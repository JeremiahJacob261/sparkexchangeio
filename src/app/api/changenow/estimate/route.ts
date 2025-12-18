import { NextRequest, NextResponse } from 'next/server';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

/**
 * GET /api/changenow/estimate
 * Get estimated exchange amount
 */
export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.CHANGENOW_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'ChangeNow API key not configured' },
                { status: 500 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const fromCurrency = searchParams.get('fromCurrency');
        const toCurrency = searchParams.get('toCurrency');
        const fromAmount = searchParams.get('fromAmount');
        const fromNetwork = searchParams.get('fromNetwork'); // Optional
        const toNetwork = searchParams.get('toNetwork');     // Optional
        const flow = searchParams.get('flow') || 'standard';

        // Validate required parameters
        if (!fromCurrency || !toCurrency || !fromAmount) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    required: ['fromCurrency', 'toCurrency', 'fromAmount'],
                    received: { fromCurrency, toCurrency, fromAmount }
                },
                { status: 400 }
            );
        }

        // Validate amount is a positive number
        const amount = parseFloat(fromAmount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount. Must be a positive number.' },
                { status: 400 }
            );
        }

        // Build the API URL with query parameters
        const params = new URLSearchParams();
        params.append('fromCurrency', fromCurrency.toLowerCase());
        params.append('toCurrency', toCurrency.toLowerCase());
        params.append('fromAmount', fromAmount);
        params.append('flow', flow);

        if (fromNetwork) params.append('fromNetwork', fromNetwork.toLowerCase());
        if (toNetwork) params.append('toNetwork', toNetwork.toLowerCase());

        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange/estimated-amount?${params.toString()}`,
            {
                headers: {
                    'x-changenow-api-key': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: 'Failed to get estimate', details: errorData },
                { status: response.status }
            );
        }

        const estimateData = await response.json();

        // Apply 1% markup
        const MARKUP_PERCENTAGE = 1;
        const estimatedAmount = parseFloat(estimateData.toAmount);
        const amountAfterMarkup = estimatedAmount * (1 - MARKUP_PERCENTAGE / 100);

        return NextResponse.json({
            success: true,
            estimate: {
                fromCurrency: fromCurrency.toLowerCase(),
                toCurrency: toCurrency.toLowerCase(),
                fromAmount: amount,
                toAmount: amountAfterMarkup, // Amount user receives after markup
                originalToAmount: estimatedAmount, // Original amount from ChangeNow
                markupPercentage: MARKUP_PERCENTAGE,
                flow: flow,
                fromNetwork: fromNetwork || estimateData.fromNetwork,
                toNetwork: toNetwork || estimateData.toNetwork,
                rateId: estimateData.rateId || null, // For fixed-rate exchanges
                validUntil: estimateData.validUntil || null,
            },
        });
    } catch (error) {
        console.error('Error getting estimate:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}
