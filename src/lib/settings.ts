import { supabase } from './supabase';

export const DEFAULT_COMMISSION = 0.4;

export async function getCommissionRate(): Promise<number> {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'commission_rate')
            .single();

        if (error) {
            console.warn('[Settings] Error fetching commission rate:', error.message);
            console.log('[Settings] Using default commission:', DEFAULT_COMMISSION);
            return DEFAULT_COMMISSION;
        }

        if (!data) {
            console.log('[Settings] No commission rate found, using default:', DEFAULT_COMMISSION);
            return DEFAULT_COMMISSION;
        }

        // data.value could be a number or string depending on how it was saved
        const rate = Number(data.value);
        const finalRate = isNaN(rate) ? DEFAULT_COMMISSION : rate;
        console.log('[Settings] Commission rate from DB:', data.value, '-> parsed:', finalRate);
        return finalRate;
    } catch (error) {
        console.error('[Settings] Unexpected error fetching commission rate:', error);
        return DEFAULT_COMMISSION;
    }
}

export async function setCommissionRate(rate: number): Promise<void> {
    const { error } = await supabase
        .from('app_settings')
        .upsert({
            key: 'commission_rate',
            value: rate,
            updated_at: new Date().toISOString()
        });

    if (error) {
        throw new Error(`Failed to update commission rate: ${error.message}`);
    }
}
