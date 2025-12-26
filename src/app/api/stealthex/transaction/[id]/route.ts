
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

        // Update DB
        // Map StealthEX status to our statuses
        // StealthEX statuses: waiting, confirming, exchanging, sending, finished, failed, refunding, refunded

        await supabase
            .from('transactions')
            .update({
                status: tx.status,
                updated_at: new Date().toISOString()
            })
            .eq('stealthex_id', id);

        return NextResponse.json({
            success: true,
            transaction: {
                id: tx.id,
                status: tx.status,
                fromCurrency: tx.currency_from,
                toCurrency: tx.currency_to,
                fromAmount: tx.amount_from,
                toAmount: tx.amount_to, // This is actual amount? or estimated?
                payinAddress: tx.address_from,
                payoutAddress: tx.address_to,
                createdAt: tx.timestamp || new Date().toISOString(), // Check if timestamp exists
                payinExtraId: tx.extra_id_from,
                txHash: tx.tx_to // Outgoing hash
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
    }
}
