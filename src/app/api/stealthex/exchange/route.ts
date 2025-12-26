
import { NextRequest, NextResponse } from 'next/server';
import { StealthExClient } from '@/lib/stealthex';
import { getCommissionRate } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { validateAddress } from '@/lib/validation';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.STEALTHEX_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key missing' }, { status: 500 });
        }

        const body = await request.json();
        // Support both naming conventions just in case
        const from = body.fromCurrency || body.from;
        const to = body.toCurrency || body.to;
        const amount = body.fromAmount || body.amount;
        const { address, refundAddress, refundExtraId, extraId } = body;

        // Validate params
        if (!from || !to || !amount || !address) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Validate address (Using 'to' as network since StealthEX often uses symbol as network identifier for validation context)
        if (!validateAddress(address, to)) {
            return NextResponse.json({ error: 'Invalid destination address' }, { status: 400 });
        }

        if (refundAddress && !validateAddress(refundAddress, from)) {
            return NextResponse.json({ error: 'Invalid refund address' }, { status: 400 });
        }

        const commissionRate = await getCommissionRate();
        const client = new StealthExClient(apiKey);

        const exchange = await client.createExchange({
            from,
            to,
            amount: parseFloat(amount),
            address,
            extraId,
            refundAddress,
            refundExtraId,
            additional_fee_percent: commissionRate
        });

        // Save to DB
        const { error: dbError } = await supabase
            .from('transactions')
            .insert({
                stealthex_id: exchange.id,
                payin_address: exchange.address_from,
                payout_address: exchange.address_to,
                from_currency: from,
                to_currency: to,
                from_amount: parseFloat(exchange.amount_from),
                to_amount: parseFloat(exchange.amount_estimated),
                status: 'waiting'
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
        }

        return NextResponse.json({
            success: true,
            exchange: {
                id: exchange.id,
                payinAddress: exchange.address_from,
                payoutAddress: exchange.address_to,
                fromCurrency: from,
                toCurrency: to,
                fromAmount: exchange.amount_from,
                toAmount: exchange.amount_estimated
            },
            instructions: {
                payinAddress: exchange.address_from,
                message: `Send ${exchange.amount_from} ${from.toUpperCase()} to ${exchange.address_from}`,
                payinExtraId: exchange.extra_id_from || null
            }
        });

    } catch (error) {
        console.error('Exchange creation error:', error);
        return NextResponse.json({ error: 'Failed to create exchange', details: (error as Error).message }, { status: 500 });
    }
}
