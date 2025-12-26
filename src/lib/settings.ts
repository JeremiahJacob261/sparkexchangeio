import { supabase } from './supabase';

export const DEFAULT_COMMISSION = 0.4;

export async function getCommissionRate(): Promise<number> {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'commission_rate')
        .single();

    if (error) {
        console.warn('Error fetching commission rate:', error.message);
        return DEFAULT_COMMISSION;
    }

    if (!data) return DEFAULT_COMMISSION;

    // data.value could be a number or string depending on how it was saved
    const rate = Number(data.value);
    return isNaN(rate) ? DEFAULT_COMMISSION : rate;
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
