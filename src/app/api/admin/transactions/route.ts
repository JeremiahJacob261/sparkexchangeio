
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCommissionRate } from '@/lib/settings';

// Helper to fetch approximate prices from CoinGecko (no geo-restrictions)
async function getPrices() {
    try {
        console.log('[Admin API] Fetching prices from CoinGecko...');

        // CoinGecko simple price endpoint - gets current prices vs USD
        // List of commonly traded cryptos
        const cryptoIds = [
            'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple',
            'cardano', 'dogecoin', 'tron', 'litecoin', 'polygon',
            'polkadot', 'avalanche-2', 'chainlink', 'uniswap', 'bitcoin-cash',
            'stellar', 'cosmos', 'monero', 'ethereum-classic', 'eos',
            'tezos', 'filecoin', 'algorand', 'vechain', 'decentraland',
            'the-sandbox', 'axie-infinity', 'shiba-inu', 'dai', 'usd-coin',
            'tether', 'binance-usd', 'true-usd', 'pax-dollar', 'wrapped-bitcoin'
        ].join(',');

        // Add timeout to prevent hanging in serverless
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd`,
            {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
            console.error('[Admin API] CoinGecko API returned error:', res.status, res.statusText);
            return getDefaultPrices();
        }

        const data = await res.json();
        console.log('[Admin API] Successfully fetched prices from CoinGecko');

        // Map CoinGecko IDs to common ticker symbols
        const idToSymbol: Record<string, string> = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'binancecoin': 'BNB',
            'solana': 'SOL',
            'ripple': 'XRP',
            'cardano': 'ADA',
            'dogecoin': 'DOGE',
            'tron': 'TRX',
            'litecoin': 'LTC',
            'polygon': 'MATIC',
            'polkadot': 'DOT',
            'avalanche-2': 'AVAX',
            'chainlink': 'LINK',
            'uniswap': 'UNI',
            'bitcoin-cash': 'BCH',
            'stellar': 'XLM',
            'cosmos': 'ATOM',
            'monero': 'XMR',
            'ethereum-classic': 'ETC',
            'eos': 'EOS',
            'tezos': 'XTZ',
            'filecoin': 'FIL',
            'algorand': 'ALGO',
            'vechain': 'VET',
            'decentraland': 'MANA',
            'the-sandbox': 'SAND',
            'axie-infinity': 'AXS',
            'shiba-inu': 'SHIB',
            'dai': 'DAI',
            'usd-coin': 'USDC',
            'tether': 'USDT',
            'binance-usd': 'BUSD',
            'true-usd': 'TUSD',
            'pax-dollar': 'USDP',
            'wrapped-bitcoin': 'WBTC'
        };

        // Convert to symbol -> price map
        const priceMap: Record<string, number> = {};
        Object.entries(data).forEach(([coinId, priceData]: [string, any]) => {
            const symbol = idToSymbol[coinId];
            if (symbol && priceData.usd) {
                priceMap[symbol] = priceData.usd;
            }
        });

        // Ensure stablecoins are exactly $1
        priceMap['USDT'] = 1;
        priceMap['USDC'] = 1;
        priceMap['DAI'] = 1;
        priceMap['BUSD'] = 1;

        console.log('[Admin API] Price map created with', Object.keys(priceMap).length, 'currencies');
        return priceMap;
    } catch (error) {
        console.error('[Admin API] Error fetching prices:', error);
        return getDefaultPrices();
    }
}

// Fallback with common crypto prices (approximate)
function getDefaultPrices(): Record<string, number> {
    console.log('[Admin API] Using fallback prices');
    return {
        'BTC': 95000,
        'ETH': 3500,
        'BNB': 600,
        'SOL': 180,
        'XRP': 2.5,
        'ADA': 0.9,
        'DOGE': 0.35,
        'TRX': 0.25,
        'LTC': 100,
        'MATIC': 1.1,
        'USDT': 1,
        'USDC': 1,
        'DAI': 1,
        'BUSD': 1,
    };
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

        console.log('[Admin API] Commission rate:', commissionRate);
        console.log('[Admin API] Total transactions:', transactions.length);

        let totalVolumeUSD = 0;
        let totalCommissionUSD = 0;
        let completedCount = 0;

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
                completedCount++;
                totalVolumeUSD += usdValue;
                totalCommissionUSD += estimatedCommission;

                console.log(`[Admin API] TX ${tx.id}: ${tx.from_amount} ${symbol} @ $${price} = $${usdValue.toFixed(2)}, commission: $${estimatedCommission.toFixed(2)}`);
            }

            return {
                ...tx,
                usdValue: usdValue > 0 ? usdValue : null
            };
        });

        console.log('[Admin API] Completed transactions:', completedCount);
        console.log('[Admin API] Total Volume USD:', totalVolumeUSD.toFixed(2));
        console.log('[Admin API] Total Commission USD:', totalCommissionUSD.toFixed(2));

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
