
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
        const fromNetwork = searchParams.get('fromNetwork') || 'mainnet';
        const toNetwork = searchParams.get('toNetwork') || 'mainnet';

        if (!fromCurrency || !toCurrency || !fromAmount) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const commissionRate = await getCommissionRate();
        const client = new StealthExClient(apiKey);

        // StealthEX v4 estimate - POST to /v4/rates/estimated-amount
        const result = await client.getEstimate(
            fromCurrency,
            toCurrency,
            fromNetwork,
            toNetwork,
            fromAmount,
            false, // fixed
            commissionRate // additional_fee_percent
        );

        // Result contains { estimated_amount: number, rate?: { id, valid_until } }
        const estimatedAmount = result.estimated_amount;

        return NextResponse.json({
            success: true,
            estimate: {
                fromCurrency,
                toCurrency,
                fromAmount,
                toAmount: estimatedAmount,
                originalToAmount: estimatedAmount,
                markupPercentage: commissionRate,
                validUntil: result.rate?.valid_until || null,
                rateId: result.rate?.id || null,
            }
        });

    } catch (error) {
        console.error('Estimate error:', error);
        return NextResponse.json({ error: 'Estimation failed', details: (error as Error).message }, { status: 500 });
    }
}
