import { NextRequest, NextResponse } from 'next/server';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

/**
 * Transaction status meanings:
 * - new: The transaction has been created but no deposit detected yet
 * - waiting: Waiting for the user to send the deposit
 * - confirming: Deposit detected, waiting for confirmations
 * - exchanging: Exchange is in progress
 * - sending: Sending the exchanged tokens to the user
 * - finished: Transaction completed successfully
 * - failed: Transaction failed
 * - refunded: Transaction was refunded
 * - expired: Transaction expired (no deposit received)
 */
type TransactionStatus =
    | 'new'
    | 'waiting'
    | 'confirming'
    | 'exchanging'
    | 'sending'
    | 'finished'
    | 'failed'
    | 'refunded'
    | 'expired';

interface TransactionStatusResponse {
    success: boolean;
    transaction: {
        id: string;
        status: TransactionStatus;
        fromCurrency: string;
        toCurrency: string;
        fromAmount: string | number;
        toAmount: string | number | null;
        fromNetwork: string;
        toNetwork: string;
        payinAddress: string;
        payoutAddress: string;
        payinHash: string | null;
        payoutHash: string | null;
        expectedAmountFrom: string | number;
        expectedAmountTo: string | number;
        amountFrom: string | number | null;
        amountTo: string | number | null;
        updatedAt: string;
    };
    statusDescription: string;
    isCompleted: boolean;
    isFailed: boolean;
}

/**
 * GET /api/changenow/transaction/[id]
 * Get the status of an exchange transaction
 * 
 * Path params:
 * - id: The transaction ID returned from the exchange creation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const apiKey = process.env.CHANGENOW_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'ChangeNow API key not configured' },
                { status: 500 }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange/by-id?id=${id}`,
            {
                headers: {
                    'x-changenow-api-key': apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Transaction not found', id },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to get transaction status', details: errorData },
                { status: response.status }
            );
        }

        const txData = await response.json();

        // Determine status description and completion state
        const statusInfo = getStatusInfo(txData.status);

        const responseData: TransactionStatusResponse = {
            success: true,
            transaction: {
                id: txData.id,
                status: txData.status,
                fromCurrency: txData.fromCurrency,
                toCurrency: txData.toCurrency,
                fromAmount: txData.fromAmount,
                toAmount: txData.toAmount,
                fromNetwork: txData.fromNetwork,
                toNetwork: txData.toNetwork,
                payinAddress: txData.payinAddress,
                payoutAddress: txData.payoutAddress,
                payinHash: txData.payinHash || null,
                payoutHash: txData.payoutHash || null,
                expectedAmountFrom: txData.expectedAmountFrom,
                expectedAmountTo: txData.expectedAmountTo,
                amountFrom: txData.amountFrom || null,
                amountTo: txData.amountTo || null,
                updatedAt: txData.updatedAt,
            },
            statusDescription: statusInfo.description,
            isCompleted: statusInfo.isCompleted,
            isFailed: statusInfo.isFailed,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error getting transaction status:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: (error as Error).message },
            { status: 500 }
        );
    }
}

/**
 * Get human-readable status information
 */
function getStatusInfo(status: TransactionStatus): {
    description: string;
    isCompleted: boolean;
    isFailed: boolean
} {
    const statusMap: Record<TransactionStatus, { description: string; isCompleted: boolean; isFailed: boolean }> = {
        new: {
            description: 'Transaction created. Waiting for deposit.',
            isCompleted: false,
            isFailed: false,
        },
        waiting: {
            description: 'Waiting for your deposit to arrive.',
            isCompleted: false,
            isFailed: false,
        },
        confirming: {
            description: 'Deposit received. Waiting for blockchain confirmations.',
            isCompleted: false,
            isFailed: false,
        },
        exchanging: {
            description: 'Exchange in progress. Your tokens are being swapped.',
            isCompleted: false,
            isFailed: false,
        },
        sending: {
            description: 'Sending exchanged tokens to your wallet.',
            isCompleted: false,
            isFailed: false,
        },
        finished: {
            description: 'Transaction completed successfully! Tokens have been sent to your wallet.',
            isCompleted: true,
            isFailed: false,
        },
        failed: {
            description: 'Transaction failed. Please contact support.',
            isCompleted: false,
            isFailed: true,
        },
        refunded: {
            description: 'Transaction was refunded to your refund address.',
            isCompleted: false,
            isFailed: true,
        },
        expired: {
            description: 'Transaction expired due to no deposit received.',
            isCompleted: false,
            isFailed: true,
        },
    };

    return statusMap[status] || {
        description: `Unknown status: ${status}`,
        isCompleted: false,
        isFailed: false,
    };
}
