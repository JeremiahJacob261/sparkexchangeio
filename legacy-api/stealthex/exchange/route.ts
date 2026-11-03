
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
        const from = body.fromCurrency || body.from;
        const to = body.toCurrency || body.to;
        const amount = body.fromAmount || body.amount;
        const { address, refundAddress, refundExtraId, extraId, fromNetwork, toNetwork } = body;

        // Default to mainnet if not specified
        const finalFromNetwork = fromNetwork || 'mainnet';
        const finalToNetwork = toNetwork || 'mainnet';

        // Validate params
        if (!from || !to || !amount || !address) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Validate address (Using network from request)
        if (!validateAddress(address, finalToNetwork)) {
            return NextResponse.json({ error: 'Invalid destination address' }, { status: 400 });
        }

        if (refundAddress && !validateAddress(refundAddress, finalFromNetwork)) {
            return NextResponse.json({ error: 'Invalid refund address' }, { status: 400 });
        }

        const commissionRate = await getCommissionRate();
        const client = new StealthExClient(apiKey);

        // Create exchange using StealthEX v4 API
        const exchange = await client.createExchange({
            from,
            to,
            fromNetwork: finalFromNetwork,
            toNetwork: finalToNetwork,
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
                payin_address: exchange.deposit.address,
                payout_address: exchange.withdrawal.address,
                from_currency: from,
                to_currency: to,
                from_amount: exchange.deposit.expected_amount,
                to_amount: exchange.withdrawal.expected_amount,
                status: exchange.status
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
        }

        return NextResponse.json({
            success: true,
            exchange: {
                id: exchange.id,
                payinAddress: exchange.deposit.address,
                payoutAddress: exchange.withdrawal.address,
                fromCurrency: from,
                toCurrency: to,
                fromAmount: exchange.deposit.expected_amount,
                toAmount: exchange.withdrawal.expected_amount,
                status: exchange.status
            },
            instructions: {
                payinAddress: exchange.deposit.address,
                message: `Send ${exchange.deposit.expected_amount} ${from.toUpperCase()} to ${exchange.deposit.address}`,
                payinExtraId: exchange.deposit.extra_id || null
            }
        });

    } catch (error) {
        console.error('Exchange creation error:', error);
        return NextResponse.json({ error: 'Failed to create exchange', details: (error as Error).message }, { status: 500 });
    }
}
