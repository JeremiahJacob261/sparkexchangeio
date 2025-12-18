import { NextRequest, NextResponse } from 'next/server';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

/**
 * GET /api/changenow/currencies
 * Fetches available currencies from ChangeNow API
 * Filters to only show Polygon network tokens if specified
 * 
 * Query params:
 * - network (optional): Filter by network (e.g., "matic" for Polygon)
 * - active (optional): Only return active currencies (default: true)
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
        const network = searchParams.get('network') || 'matic';
        const activeOnly = searchParams.get('active') !== 'false';

        // Fetch currencies from ChangeNow API
        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange/currencies?active=${activeOnly}`,
            {
                headers: {
                    'x-changenow-api-key': apiKey,
                },
                next: { revalidate: 300 }, // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: 'Failed to fetch currencies', details: errorData },
                { status: response.status }
            );
        }

        const currencies = await response.json();

        // Filter currencies by network if specified
        let filteredCurrencies = currencies;
        if (network) {
            filteredCurrencies = currencies.filter(
                (currency: { network: string }) =>
                    currency.network?.toLowerCase() === network.toLowerCase()
            );
        }

        return NextResponse.json({
            success: true,
            network: network,
            currencies: filteredCurrencies,
            total: filteredCurrencies.length,
        });
    } catch (error) {
        console.error('Error fetching currencies:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}
