
import { NextRequest, NextResponse } from 'next/server';
import { getCommissionRate, setCommissionRate } from '@/lib/settings';

export async function GET() {
    try {
        const rate = await getCommissionRate();
        return NextResponse.json({ commission_percentage: rate });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { commission_percentage } = body;

        if (typeof commission_percentage !== 'number' || commission_percentage < 0) {
            return NextResponse.json({ error: 'Invalid commission value' }, { status: 400 });
        }

        await setCommissionRate(commission_percentage);
        return NextResponse.json({ success: true, commission_percentage });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
