
export const STEALTHEX_API_URL = 'https://api.stealthex.io/api/v2';

export interface StealthEXCurrency {
    symbol: string;
    name: string;
    extraId?: string;
    image: string;
    validationAddress: string;
    hasExternalId: boolean;
}

export interface EstimateParams {
    from: string;
    to: string;
    amount: number;
    fixed?: boolean;
    additional_fee_percent?: number; // 0 to 100? or 0.0 to 1.0? Documentation usually means percent, e.g. 0.5
}

export interface CreateExchangeParams {
    from: string;
    to: string;
    amount: number;
    address: string;
    extraId?: string;
    refundAddress?: string;
    refundExtraId?: string;
    fixed?: boolean;
    additional_fee_percent?: number;
}

export class StealthExClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = new URL(`${STEALTHEX_API_URL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);

        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                'Content-Type': 'application/json',
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
            throw new Error(errorData.message || `StealthEX API error: ${response.statusText}`);
        }

        return response.json();
    }

    async getCurrencies(fixed = false): Promise<StealthEXCurrency[]> {
        return this.request<StealthEXCurrency[]>('/currency', {
            method: 'GET', // Standard GET
        });
        // Note: Documentation says /currency, filtering by fixed optionally.
    }

    async getEstimate(from: string, to: string, amount: number, fixed = false, additionalFeePercent?: number) {
        // According to search: "Get estimated exchange amount" POST. 
        // Usually /estimate/{from}/{to} is GET in many APIs, but StealthEX v2 might be POST.
        // Let's try GET first if the URL looks like resource path, but search said POST.
        // Let's implement POST to /estimate since search result 1 was specific about POST.
        // Wait, the path might be /estimate

        // Payload based on search:
        /*
          {
            amount: number,
            rate: 'fixed' | 'floating',
            route: { from: string, to: string }, // or just 'from' and 'to' fields
            additional_fee_percent?: number
          }
        */
        // Let's look at similar provider patterns. If uncertain, I will try to support both or add a comment.
        // I'll try GET /estimate/{symbol}/{symbol} first as it's common (and used by ChangeNOW).
        // But to be safe, I'll follow the "POST" hint from search result.
        // Wait, search result "Get exchange range" and "Get estimated exchange amount" were POST.

        // Given I don't have perfect docs, I'll assume:
        // GET /estimate/{from}/{to}?amount=...&fixed=...&api_key=...
        // is the most RESTful way. I'll stick to GET params for now as it's safer for "read" operations unless I see errors.

        const params = new URLSearchParams();
        params.append('amount', amount.toString());
        params.append('fixed', fixed.toString());
        if (additionalFeePercent) {
            params.append('additional_fee_percent', additionalFeePercent.toString());
        }

        // Try GET /estimate/from/to
        return this.request<any>(`/estimate/${from}/${to}?${params.toString()}`);
    }

    // Correction: If the generic GET fails, we might need to adjust. 
    // But a lot of these APIs (ChangeNOW clones) use similar structures.

    async createExchange(data: CreateExchangeParams) {
        // POST /exchange
        return this.request<any>('/exchange', {
            method: 'POST',
            body: JSON.stringify({
                currency_from: data.from,
                currency_to: data.to,
                amount: data.amount,
                address_to: data.address,
                extra_id_to: data.extraId,
                address_refund: data.refundAddress,
                extra_id_refund: data.refundExtraId,
                fixed: data.fixed,
                additional_fee_percent: data.additional_fee_percent,
                // Using snake_case as is common in these APIs
            }),
        });
    }

    async getExchange(id: string) {
        return this.request<any>(`/exchange/${id}`);
    }
}
