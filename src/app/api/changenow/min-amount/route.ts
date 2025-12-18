import { NextRequest, NextResponse } from 'next/server';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

/**
 * GET /api/changenow/min-amount
 * Get the minimum exchange amount for a currency pair
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
        const fromNetwork = searchParams.get('fromNetwork');
        const toNetwork = searchParams.get('toNetwork');
        const flow = searchParams.get('flow') || 'standard';

        // Validate required parameters
        if (!fromCurrency || !toCurrency) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    required: ['fromCurrency', 'toCurrency'],
                    received: { fromCurrency, toCurrency }
                },
                { status: 400 }
            );
        }

        // Build the API URL with query parameters
        const params = new URLSearchParams();
        params.append('fromCurrency', fromCurrency.toLowerCase());
        params.append('toCurrency', toCurrency.toLowerCase());
        params.append('flow', flow);

        if (fromNetwork) params.append('fromNetwork', fromNetwork.toLowerCase());
        if (toNetwork) params.append('toNetwork', toNetwork.toLowerCase());

        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange/range?${params.toString()}`,
            {
                headers: {
                    'x-changenow-api-key': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: 'Failed to get exchange range', details: errorData },
                { status: response.status }
            );
        }

        const rangeData = await response.json();

        return NextResponse.json({
            success: true,
            range: {
                fromCurrency: fromCurrency.toLowerCase(),
                toCurrency: toCurrency.toLowerCase(),
                minAmount: rangeData.minAmount,
                maxAmount: rangeData.maxAmount || null,
                fromNetwork: fromNetwork || rangeData.fromNetwork,
                toNetwork: toNetwork || rangeData.toNetwork,
                flow: flow,
            },
        });
    } catch (error) {
        console.error('Error getting exchange range:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}
