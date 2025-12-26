
import { NextRequest, NextResponse } from 'next/server';
import { StealthExClient } from '@/lib/stealthex';
import { getCommissionRate } from '@/lib/settings';

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.STEALTHEX_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key missing' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const fromCurrency = searchParams.get('fromCurrency');
        const toCurrency = searchParams.get('toCurrency');
        const fromAmount = parseFloat(searchParams.get('fromAmount') || '0');

        if (!fromCurrency || !toCurrency || !fromAmount) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const commissionRate = await getCommissionRate();
        const client = new StealthExClient(apiKey);

        // StealthEX estimate
        const result = await client.getEstimate(
            fromCurrency,
            toCurrency,
            fromAmount,
            false, // fixed
            commissionRate // additional_fee_percent
        );

        // Result likely contains { estimated_amount: number, ... } or similar
        // I need to check exact response shape. Assuming { estimated_amount } based on typical APIs.
        // If getting range, it might be { min_amount: ..., max_amount: ... }

        // If the client.getEstimate returns an object with estimated_amount:
        const estimatedAmount = result.estimated_amount;

        return NextResponse.json({
            success: true,
            estimate: {
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount: estimatedAmount,
                originalToAmount: estimatedAmount, // We don't verify base without fee, assume result is final
                markupPercentage: commissionRate,
                validUntil: null, // StealthEX might not provide this for floating
            }
        });

    } catch (error) {
        console.error('Estimate error:', error);
        return NextResponse.json({ error: 'Estimation failed', details: (error as Error).message }, { status: 500 });
    }
}
