import { NextRequest, NextResponse } from 'next/server';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

interface ExchangeRequestBody {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    address: string; // User's wallet address to receive tokens
    fromNetwork?: string;
    toNetwork?: string;
    refundAddress?: string;
    refundExtraId?: string;
    extraId?: string; // For currencies that require extra ID (memo, tag, etc.)
    flow?: 'standard' | 'fixed-rate';
    rateId?: string; // Required for fixed-rate exchanges
}

/**
 * POST /api/changenow/exchange
 * Create a new exchange transaction
 * Returns a deposit address for the user to send tokens to
 * 
 * Request body:
 * - fromCurrency: Source currency ticker (required)
 * - toCurrency: Target currency ticker (required)
 * - fromAmount: Amount to exchange (required)
 * - address: User's wallet address to receive tokens (required)
 * - fromNetwork: Source network (optional, defaults to "matic")
 * - toNetwork: Target network (optional, defaults to "matic")
 * - refundAddress: Address for refunds if transaction fails (optional)
 * - refundExtraId: Extra ID for refund address if needed (optional)
 * - extraId: Extra ID for destination address if needed by currency (optional)
 * - flow: "standard" or "fixed-rate" (optional, defaults to "standard")
 * - rateId: Required for fixed-rate exchanges (optional)
 */
export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.CHANGENOW_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'ChangeNow API key not configured' },
                { status: 500 }
            );
        }

        const body: ExchangeRequestBody = await request.json();

        const {
            fromCurrency,
            toCurrency,
            fromAmount,
            address,
            fromNetwork = 'matic',
            toNetwork = 'matic',
            refundAddress,
            refundExtraId,
            extraId,
            flow = 'standard',
            rateId,
        } = body;

        // Validate required parameters
        if (!fromCurrency || !toCurrency || !fromAmount || !address) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    required: ['fromCurrency', 'toCurrency', 'fromAmount', 'address'],
                    received: {
                        fromCurrency: !!fromCurrency,
                        toCurrency: !!toCurrency,
                        fromAmount: !!fromAmount,
                        address: !!address
                    }
                },
                { status: 400 }
            );
        }

        // Validate amount is a positive number
        if (typeof fromAmount !== 'number' || fromAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount. Must be a positive number.' },
                { status: 400 }
            );
        }

        // Validate address format (basic validation for Polygon addresses)
        if (!isValidPolygonAddress(address)) {
            return NextResponse.json(
                { error: 'Invalid Polygon address format' },
                { status: 400 }
            );
        }

        // Validate refund address if provided
        if (refundAddress && !isValidPolygonAddress(refundAddress)) {
            return NextResponse.json(
                { error: 'Invalid refund address format' },
                { status: 400 }
            );
        }

        // For fixed-rate exchanges, rateId is required
        if (flow === 'fixed-rate' && !rateId) {
            return NextResponse.json(
                { error: 'rateId is required for fixed-rate exchanges. Get it from /api/changenow/estimate with flow=fixed-rate' },
                { status: 400 }
            );
        }

        // Build the request body for ChangeNow API
        const exchangeRequest: Record<string, unknown> = {
            fromCurrency: fromCurrency.toLowerCase(),
            toCurrency: toCurrency.toLowerCase(),
            fromAmount: fromAmount.toString(),
            address: address,
            fromNetwork: fromNetwork.toLowerCase(),
            toNetwork: toNetwork.toLowerCase(),
            flow: flow,
        };

        if (refundAddress) {
            exchangeRequest.refundAddress = refundAddress;
        }
        if (refundExtraId) {
            exchangeRequest.refundExtraId = refundExtraId;
        }
        if (extraId) {
            exchangeRequest.extraId = extraId;
        }
        if (rateId && flow === 'fixed-rate') {
            exchangeRequest.rateId = rateId;
        }

        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-changenow-api-key': apiKey,
                },
                body: JSON.stringify(exchangeRequest),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: 'Failed to create exchange', details: errorData },
                { status: response.status }
            );
        }

        const exchangeData = await response.json();

        return NextResponse.json({
            success: true,
            exchange: {
                id: exchangeData.id,
                payinAddress: exchangeData.payinAddress, // Address to send tokens to
                payoutAddress: exchangeData.payoutAddress, // User's receiving address
                fromCurrency: exchangeData.fromCurrency,
                toCurrency: exchangeData.toCurrency,
                fromAmount: exchangeData.fromAmount,
                toAmount: exchangeData.toAmount,
                fromNetwork: exchangeData.fromNetwork,
                toNetwork: exchangeData.toNetwork,
                flow: exchangeData.flow,
                payinExtraId: exchangeData.payinExtraId || null, // If sending currency requires extra ID
                status: 'waiting', // Initial status before deposit
                createdAt: new Date().toISOString(),
            },
            instructions: {
                message: `Send ${exchangeData.fromAmount} ${exchangeData.fromCurrency.toUpperCase()} to the payinAddress below`,
                payinAddress: exchangeData.payinAddress,
                payinExtraId: exchangeData.payinExtraId || null,
                note: 'Check transaction status using GET /api/changenow/transaction/[id]',
            },
        });
    } catch (error) {
        console.error('Error creating exchange:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}

/**
 * Basic validation for Polygon (Ethereum-compatible) addresses
 */
function isValidPolygonAddress(address: string): boolean {
    // Polygon uses Ethereum-style addresses (0x followed by 40 hex characters)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
}
