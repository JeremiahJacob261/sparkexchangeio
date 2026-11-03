
import { NextRequest, NextResponse } from 'next/server';
import { StealthExClient } from '@/lib/stealthex';

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.STEALTHEX_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'StealthEX API key not configured' },
                { status: 500 }
            );
        }

        const client = new StealthExClient(apiKey);

        // Fetch all currencies with pagination to get complete list
        const currencies = await client.getCurrencies({ limit: 250 });

        // Map StealthEX v4 response to our expected format
        const mappedCurrencies = currencies.map(c => ({
            ticker: c.symbol,
            name: c.name,
            image: c.icon_url,
            network: c.network,
            hasExtraId: c.extra_id !== null,
            extraIdName: c.extra_id,
            addressRegex: c.address_regex,
            extraIdRegex: c.extra_id_regex
        }));

        return NextResponse.json({
            success: true,
            currencies: mappedCurrencies,
            total: mappedCurrencies.length
        });
    } catch (error) {
        console.error('Error fetching currencies:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}
