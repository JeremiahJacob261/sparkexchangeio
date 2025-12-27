import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CHANGENOW_API_URL = 'https://api.changenow.io/v2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params are promises in Next.js 15+
) {
    try {
        const { id } = await params;
        const apiKey = process.env.CHANGENOW_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'ChangeNow API key not configured' },
                { status: 500 }
            );
        }

        // Fetch transaction status from ChangeNOW
        const response = await fetch(
            `${CHANGENOW_API_URL}/exchange/by-id?id=${id}`,
            {
                headers: {
                    'x-changenow-api-key': apiKey,
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch transaction status' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Map ChangeNOW status to our internal status if needed, 
        // or just use their status directly. 
        // ChangeNOW statuses: waiting, confirming, exchanging, sending, finished, failed, refunded, expired

        let dbStatus = 'PROCESSING';
        if (data.status === 'waiting') dbStatus = 'AWAITING_DEPOSIT';
        else if (data.status === 'finished') dbStatus = 'COMPLETED';
        else if (data.status === 'failed' || data.status === 'expired') dbStatus = 'FAILED';

        // Update Supabase
        // We catch errors here so we don't block the UI response if DB fails
        const { error: dbError } = await supabase
            .from('transactions')
            .update({
                status: dbStatus,
                updated_at: new Date().toISOString()
            })
            .eq('changenow_id', id);

        if (dbError) {
            console.error('Failed to update transaction in Supabase:', dbError);
        }

        return NextResponse.json({
            success: true,
            status: data.status, // waiting, confirming, exchanging, sending, finished, failed, ...
            payinAddress: data.payinAddress,
            payoutAddress: data.payoutAddress,
            fromAmount: data.amountFrom,
            toAmount: data.expectedAmountTo,
            toCurrency: data.toCurrency,
            payinHash: data.payinHash,
            payoutHash: data.payoutHash,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
