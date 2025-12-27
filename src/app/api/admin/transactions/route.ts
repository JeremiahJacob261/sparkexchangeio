
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCommissionRate } from '@/lib/settings';

// Helper to fetch approximate prices
async function getPrices() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price');
        if (!res.ok) return {};
        const data = await res.json();
        // Convert to easy map: BTC -> Price
        const priceMap: Record<string, number> = {};
        data.forEach((item: any) => {
            if (item.symbol.endsWith('USDT')) {
                const symbol = item.symbol.replace('USDT', '');
                priceMap[symbol] = parseFloat(item.price);
            }
        });
        // Add manual stablecoins if missed
        priceMap['USDT'] = 1;
        priceMap['USDC'] = 1;
        priceMap['DAI'] = 1;
        return priceMap;
    } catch {
        return {};
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check auth
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        // if (!session || session.value !== 'authenticated') {
        //     return NextResponse.json(
        //         { error: 'Unauthorized' },
        //         { status: 401 }
        //     );
        // }

        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch transactions' },
                { status: 500 }
            );
        }

        // Fetch prices & Commission Rate
        const [prices, commissionRate] = await Promise.all([
            getPrices(),
            getCommissionRate()
        ]);

        let totalVolumeUSD = 0;
        let totalCommissionUSD = 0;

        // Calculate analytics
        const processedTransactions = transactions.map(tx => {
            // Try to find price for from_currency or to_currency
            // Usually to_currency is what the user *receives*, so volume is often measured in output or input.
            // Let's use from_amount * price(from_currency)
            const symbol = tx.from_currency?.toUpperCase();
            const price = prices[symbol] || 0;
            const usdValue = (tx.from_amount || 0) * price;

            // Commission
            // If we had stored commission_rate per tx, we'd use it. 
            // Since we didn't, we approximate with current rate for now (as it was recently added).
            // Commission is typically on top of the rate? Or included? 
            // In our StealthEX integration, `additional_fee_percent` is the partner profit.
            // If we set 1%, we get 1% of the volume.
            const estimatedCommission = usdValue * (commissionRate / 100);

            if (tx.status === 'finished' || tx.status === 'COMPLETED') {
                totalVolumeUSD += usdValue;
                totalCommissionUSD += estimatedCommission;
            }

            return {
                ...tx,
                usdValue: usdValue > 0 ? usdValue : null
            };
        });

        const totalTransactions = transactions.length;
        const totalVolume = transactions.reduce((sum, tx) => sum + (Number(tx.from_amount) || 0), 0); // Raw mixed sum (legacy)
        const successCount = transactions.filter(tx => tx.status === 'COMPLETED' || tx.status === 'finished').length;
        const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;


        // Fetch visits
        const { data: visitsData } = await supabase.from('app_settings').select('value').eq('key', 'total_visits').single();
        const totalVisits = visitsData ? Number(visitsData.value) : 0;

        // Fetch unique visitors
        const { count: totalUniqueVisits } = await supabase.from('visitor_logs').select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            transactions: processedTransactions, // Return with estimated USD value attached
            analytics: {
                totalTransactions,
                totalVolume,
                totalVolumeUSD, // New Field
                totalCommissionUSD, // New Field
                successRate: successRate.toFixed(1),
                totalVisits,
                totalUniqueVisits: totalUniqueVisits || 0
            }
        });

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
