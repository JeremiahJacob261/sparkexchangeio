
export const STEALTHEX_API_URL = 'https://api.stealthex.io';

export interface StealthEXCurrency {
    symbol: string;
    network: string;
    name: string;
    icon_url: string;
    extra_id: string | null;
    address_regex: string | null;
    extra_id_regex: string | null;
    rates: ('floating' | 'fixed')[];
    features: string[];
}

export interface EstimateResponse {
    estimated_amount: number;
    rate?: {
        id: string;
        valid_until: string;
    };
}

export interface CreateExchangeParams {
    from: string;
    to: string;
    fromNetwork: string;
    toNetwork: string;
    amount: number;
    address: string;
    extraId?: string;
    refundAddress?: string;
    refundExtraId?: string;
    fixed?: boolean;
    additional_fee_percent?: number;
    rate_id?: string;
}

export interface ExchangeResponse {
    id: string;
    status: string;
    rate: 'floating' | 'fixed';
    deposit: {
        symbol: string;
        network: string;
        amount: number;
        expected_amount: number;
        address: string;
        extra_id: string | null;
        tx_hash: string | null;
    };
    withdrawal: {
        symbol: string;
        network: string;
        amount: number;
        expected_amount: number;
        address: string;
        extra_id: string | null;
        tx_hash: string | null;
    };
    refund_address: string | null;
    refund_extra_id: string | null;
    created_at: string;
    expires_at: string | null;
}

export class StealthExClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${STEALTHEX_API_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }
            const errorMessage = errorData.err?.details || errorData.message || `StealthEX API error: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async getCurrencies(options?: {
        limit?: number;
        offset?: number;
        network?: string;
        rate?: 'floating' | 'fixed';
    }): Promise<StealthEXCurrency[]> {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.network) params.append('network', options.network);
        if (options?.rate) params.append('rate', options.rate);

        const query = params.toString();
        return this.request<StealthEXCurrency[]>(`/v4/currencies${query ? `?${query}` : ''}`);
    }

    async getEstimate(
        from: string,
        to: string,
        fromNetwork: string,
        toNetwork: string,
        amount: number,
        fixed = false,
        additionalFeePercent?: number
    ): Promise<EstimateResponse> {
        const payload = {
            route: {
                from: {
                    symbol: from,
                    network: fromNetwork
                },
                to: {
                    symbol: to,
                    network: toNetwork
                }
            },
            amount,
            estimation: 'direct' as const,
            rate: fixed ? 'fixed' as const : 'floating' as const,
            ...(additionalFeePercent !== undefined && { additional_fee_percent: additionalFeePercent })
        };

        return this.request<EstimateResponse>('/v4/rates/estimated-amount', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async createExchange(data: CreateExchangeParams): Promise<ExchangeResponse> {
        const payload = {
            route: {
                from: {
                    symbol: data.from,
                    network: data.fromNetwork
                },
                to: {
                    symbol: data.to,
                    network: data.toNetwork
                }
            },
            amount: data.amount,
            estimation: 'direct' as const,
            rate: data.fixed ? 'fixed' as const : 'floating' as const,
            address: data.address,
            ...(data.extraId && { extra_id: data.extraId }),
            ...(data.refundAddress && { refund_address: data.refundAddress }),
            ...(data.refundExtraId && { refund_extra_id: data.refundExtraId }),
            ...(data.additional_fee_percent !== undefined && { additional_fee_percent: data.additional_fee_percent }),
            ...(data.rate_id && { rate_id: data.rate_id })
        };

        return this.request<ExchangeResponse>('/v4/exchanges', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getExchange(id: string): Promise<ExchangeResponse> {
        return this.request<ExchangeResponse>(`/v4/exchanges/${id}`);
    }
}
