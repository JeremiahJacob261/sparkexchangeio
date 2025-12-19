import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        // Check auth
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');

        if (!session || session.value !== 'authenticated') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

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

        // Calculate analytics
        const totalTransactions = transactions.length;
        const totalVolume = transactions.reduce((sum, tx) => sum + (Number(tx.to_amount) || 0), 0); // This is mixed currencies, but rough generic sum
        const successCount = transactions.filter(tx => tx.status === 'COMPLETED' || tx.status === 'finished').length;
        const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;

        return NextResponse.json({
            success: true,
            transactions,
            analytics: {
                totalTransactions,
                totalVolume, // Note: This is a raw sum of all target amounts, ideally we'd normalize to USD
                successRate: successRate.toFixed(1)
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
