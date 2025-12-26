
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
        const currencies = await client.getCurrencies();

        // Mapping to match ChangeNOW response structure partially
        // StealthEX might return distinct entries for networks
        const mappedCurrencies = currencies.map(c => ({
            ticker: c.symbol, // StealthEX symbols often include network info implicitly e.g. defined by them
            name: c.name,
            image: c.image,
            network: c.validationAddress?.startsWith('0x') ? 'ch' : 'generic', // Rudimentary guessing, likely not needed if we just use ticker
            // Actually we just pass what we got.
            // If the frontend relies on `network` field to group, we might need more info.
            // For now, let's just pass `symbol` as ticker and empty network, or check if StealthEX provides network.
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
