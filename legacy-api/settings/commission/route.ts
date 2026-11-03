import { NextResponse } from 'next/server';
import { getCommissionRate } from '@/lib/settings';

export async function GET() {
    try {
        const rate = await getCommissionRate();
        return NextResponse.json({ commissionRate: rate });
    } catch (error) {
        console.error('Error fetching commission rate:', error);
        return NextResponse.json(
            { error: 'Failed to fetch commission rate' },
            { status: 500 }
        );
    }
}
