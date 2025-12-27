
import { NextRequest, NextResponse } from 'next/server';
import { StealthExClient } from '@/lib/stealthex';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const apiKey = process.env.STEALTHEX_API_KEY;
        const { id } = await params;

        if (!apiKey) return NextResponse.json({ error: 'Configuration error' }, { status: 500 });

        const client = new StealthExClient(apiKey);
        const tx = await client.getExchange(id);

        // Update DB with latest status
        await supabase
            .from('transactions')
            .update({
                status: tx.status,
                updated_at: new Date().toISOString()
            })
            .eq('stealthex_id', id);

        return NextResponse.json({
            success: true,
            status: tx.status,
            transaction: {
                id: tx.id,
                status: tx.status,
                fromCurrency: tx.deposit.symbol,
                toCurrency: tx.withdrawal.symbol,
                fromAmount: tx.deposit.expected_amount,
                toAmount: tx.withdrawal.expected_amount,
                actualFromAmount: tx.deposit.amount,
                actualToAmount: tx.withdrawal.amount,
                payinAddress: tx.deposit.address,
                payoutAddress: tx.withdrawal.address,
                payinExtraId: tx.deposit.extra_id,
                payoutExtraId: tx.withdrawal.extra_id,
                payinHash: tx.deposit.tx_hash,
                payoutHash: tx.withdrawal.tx_hash,
                createdAt: tx.created_at,
                expiresAt: tx.expires_at
            }
        });

    } catch (error) {
        console.error('Transaction fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch transaction', details: (error as Error).message }, { status: 500 });
    }
}
