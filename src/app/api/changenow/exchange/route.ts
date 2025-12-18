import { NextRequest, NextResponse } from 'next/server';
import { validateAddress } from '@/lib/validation';

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
            fromNetwork, // No default
            toNetwork,   // No default
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

        // Validate address format using shared validation logic
        // If network is not provided, use a lax validation or try to infer?
        // We'll pass the network if available, otherwise just check length
        const targetNetwork = toNetwork || 'unknown';
        if (!validateAddress(address, targetNetwork)) {
            return NextResponse.json(
                { error: `Invalid ${targetNetwork !== 'unknown' ? targetNetwork : ''} address format` },
                { status: 400 }
            );
        }

        // Validate refund address if provided
        if (refundAddress) {
            const sourceNetwork = fromNetwork || 'unknown';
            if (!validateAddress(refundAddress, sourceNetwork)) {
                return NextResponse.json(
                    { error: 'Invalid refund address format' },
                    { status: 400 }
                );
            }
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
            flow: flow,
        };

        if (fromNetwork) exchangeRequest.fromNetwork = fromNetwork.toLowerCase();
        if (toNetwork) exchangeRequest.toNetwork = toNetwork.toLowerCase();
        if (refundAddress) exchangeRequest.refundAddress = refundAddress;
        if (refundExtraId) exchangeRequest.refundExtraId = refundExtraId;
        if (extraId) exchangeRequest.extraId = extraId;
        if (rateId && flow === 'fixed-rate') exchangeRequest.rateId = rateId;

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
                payinAddress: exchangeData.payinAddress,
                payoutAddress: exchangeData.payoutAddress,
                fromCurrency: exchangeData.fromCurrency,
                toCurrency: exchangeData.toCurrency,
                fromAmount: exchangeData.fromAmount,
                toAmount: exchangeData.toAmount,
                fromNetwork: exchangeData.fromNetwork,
                toNetwork: exchangeData.toNetwork,
                flow: exchangeData.flow,
                payinExtraId: exchangeData.payinExtraId || null,
                status: 'waiting',
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
