"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowDownUp, ChevronDown, Loader2, AlertCircle, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAddress } from "@/lib/validation";

// Types
interface Currency {
    ticker: string;
    name: string;
    image: string;
    network: string;
}

interface EstimateResponse {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    originalToAmount?: number;
    rateId?: string;
    validUntil?: string;
    minAmount?: number;
}

interface ExchangeResponse {
    id: string;
    payinAddress: string;
    payoutAddress: string;
    fromAmount: string;
    toAmount: string;
    fromCurrency: string;
    toCurrency: string;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export function ExchangeWidget() {
    // State
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

    const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
    const [toCurrency, setToCurrency] = useState<Currency | null>(null);

    const [fromAmount, setFromAmount] = useState<string>("10");
    const [toAmount, setToAmount] = useState<string>("");

    const [destinationAddress, setDestinationAddress] = useState("");
    const [isAddressValid, setIsAddressValid] = useState(true);
    const [addressError, setAddressError] = useState("");

    const [isEstimating, setIsEstimating] = useState(false);
    const [estimateError, setEstimateError] = useState<string | null>(null);

    const [isCreatingTx, setIsCreatingTx] = useState(false);
    const [txResult, setTxResult] = useState<ExchangeResponse | null>(null);

    // Dropdown states
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Debounce amount for API calls
    const debouncedFromAmount = useDebounce(fromAmount, 500);

    // Initialize Currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch('/api/changenow/currencies?active=true');
                const data = await res.json();

                if (data.success && data.currencies.length > 0) {
                    setCurrencies(data.currencies);
                    // Default selections
                    const defaultFrom = data.currencies.find((c: Currency) => c.ticker === 'matic' && c.network === 'matic') || data.currencies[0];
                    const defaultTo = data.currencies.find((c: Currency) => c.ticker === 'usdc' && c.network === 'matic') || data.currencies[1] || data.currencies[0];
                    setFromCurrency(defaultFrom);
                    setToCurrency(defaultTo);
                }
            } catch (error) {
                console.error("Failed to fetch currencies", error);
                setEstimateError("Failed to load currencies. Please refresh.");
            } finally {
                setIsLoadingCurrencies(false);
            }
        };
        fetchCurrencies();
    }, []);

    // Estimate Exchange Amount
    useEffect(() => {
        async function getEstimate() {
            if (!fromCurrency || !toCurrency || !debouncedFromAmount || parseFloat(debouncedFromAmount) <= 0) {
                setToAmount("");
                return;
            }

            setIsEstimating(true);
            setEstimateError(null);

            try {
                const params = new URLSearchParams();
                params.append('fromCurrency', fromCurrency.ticker);
                params.append('toCurrency', toCurrency.ticker);
                params.append('fromAmount', debouncedFromAmount);
                params.append('flow', 'standard');
                if (fromCurrency.network) params.append('fromNetwork', fromCurrency.network);
                if (toCurrency.network) params.append('toNetwork', toCurrency.network);

                const res = await fetch(`/api/changenow/estimate?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setToAmount(data.estimate.toAmount.toFixed(6));
                    if (data.estimate.toAmount === 0) {
                        setEstimateError("Amount too low");
                    }
                } else {
                    setEstimateError(data.error || "Estimation failed");
                    setToAmount("");
                }
            } catch (error) {
                console.error("Estimation error", error);
                setEstimateError("Failed to get quote");
            } finally {
                setIsEstimating(false);
            }
        }

        getEstimate();
    }, [debouncedFromAmount, fromCurrency, toCurrency]);

    // Validate Address
    useEffect(() => {
        if (!destinationAddress || !toCurrency) {
            setIsAddressValid(true); // Don't show error when empty
            setAddressError("");
            return;
        }

        const isValid = validateAddress(destinationAddress, toCurrency.network);
        setIsAddressValid(isValid);
        setAddressError(isValid ? "" : `Invalid ${toCurrency.network} address`);

        // Save to localStorage
        localStorage.setItem("lastDestinationAddress", destinationAddress);

    }, [destinationAddress, toCurrency]);

    // Restore address from storage
    useEffect(() => {
        const saved = localStorage.getItem("lastDestinationAddress");
        if (saved) setDestinationAddress(saved);
    }, []);

    const handleSwapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    const handleCreateExchange = async () => {
        if (!fromCurrency || !toCurrency || !fromAmount || !destinationAddress || !isAddressValid) return;

        setIsCreatingTx(true);
        setEstimateError(null);

        try {
            const payload = {
                fromCurrency: fromCurrency.ticker,
                toCurrency: toCurrency.ticker,
                fromAmount: parseFloat(fromAmount),
                address: destinationAddress,
                fromNetwork: fromCurrency.network,
                toNetwork: toCurrency.network,
                flow: 'standard'
            };

            const res = await fetch('/api/changenow/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                setTxResult(data.exchange);
                // Save tx to storage
                const txHistory = JSON.parse(localStorage.getItem("txHistory") || "[]");
                txHistory.push({
                    id: data.exchange.id,
                    date: new Date().toISOString(),
                    from: fromCurrency.ticker,
                    to: toCurrency.ticker,
                    amount: fromAmount
                });
                localStorage.setItem("txHistory", JSON.stringify(txHistory));
            } else {
                setEstimateError(data.error || "Failed to create transaction");
            }

        } catch (error) {
            console.error("Transaction Creation Error", error);
            setEstimateError("An unexpected error occurred");
        } finally {
            setIsCreatingTx(false);
        }
    };

    const reset = () => {
        setTxResult(null);
        setFromAmount("10");
        setToAmount("");
        setEstimateError(null);
    };

    // --- RENDER ---

    if (isLoadingCurrencies) {
        return (
            <div className="w-full max-w-md mx-auto h-[400px] flex items-center justify-center glass rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Success View
    if (txResult) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="glass rounded-2xl p-6 shadow-2xl shadow-purple-500/10 border border-success/20 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Exchange Created!</h3>
                        <p className="text-sm text-muted-foreground mt-2">ID: {txResult.id}</p>
                    </div>

                    <div className="space-y-4 bg-secondary/30 p-4 rounded-xl mb-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Send exactly</p>
                            <p className="text-2xl font-bold text-primary">
                                {txResult.fromAmount} <span className="text-lg">{txResult.fromCurrency.toUpperCase()}</span>
                            </p>
                        </div>

                        <div className="relative">
                            <label className="text-xs text-muted-foreground ml-1">To this address:</label>
                            <div className="flex items-center gap-2 mt-1 bg-background p-3 rounded-lg border border-border">
                                <code className="text-xs break-all flex-1">{txResult.payinAddress}</code>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => navigator.clipboard.writeText(txResult.payinAddress)}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button onClick={reset} className="w-full" variant="outline">
                        Start New Exchange
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Track status in the dashboard or save your Transaction ID.
                    </p>
                </div>
            </div>
        );
    }

    // Main Swap View
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="glass rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
                <h3 className="text-lg font-semibold mb-4 text-center">
                    Swap Cryptocurrencies
                </h3>

                {estimateError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{estimateError}</span>
                    </div>
                )}

                {/* From Input */}
                <div className="space-y-2 mb-2">
                    <label className="text-xs font-medium text-muted-foreground ml-1">You send</label>
                    <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl border border-transparent focus-within:border-primary/50 transition-colors">
                        <div className="flex-1">
                            <Input
                                type="number"
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                                className="text-xl font-bold bg-transparent border-0 h-14 focus-visible:ring-0 px-3"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-3 h-14 rounded-lg hover:bg-background/50 transition-colors min-w-[110px]"
                                onClick={() => { setShowFromDropdown(!showFromDropdown); setShowToDropdown(false); }}
                            >
                                {fromCurrency?.image && <img src={fromCurrency.image} alt={fromCurrency.ticker} className="w-6 h-6 rounded-full" />}
                                <span className="font-bold uppercase">{fromCurrency?.ticker || 'SEL'}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {showFromDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 max-h-60 overflow-y-auto bg-card rounded-xl border border-border shadow-xl z-20">
                                    {currencies.map(c => (
                                        <button
                                            key={c.ticker + c.network}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
                                            onClick={() => { setFromCurrency(c); setShowFromDropdown(false); }}
                                        >
                                            <img src={c.image} className="w-6 h-6 rounded-full" alt="" />
                                            <div>
                                                <div className="font-bold uppercase">{c.ticker}</div>
                                                <div className="text-xs text-muted-foreground">{c.name} <span className="opacity-50">({c.network})</span></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Swap Divider */}
                <div className="flex justify-center -my-3 relative z-10">
                    <button
                        onClick={handleSwapCurrencies}
                        className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:scale-110 transition-transform text-muted-foreground hover:text-primary"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                    </button>
                </div>

                {/* To Input */}
                <div className="space-y-2 mt-2">
                    <label className="text-xs font-medium text-muted-foreground ml-1">You receive (estimated)</label>
                    <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl border border-transparent focus-within:border-primary/50 transition-colors">
                        <div className="flex-1 relative">
                            {isEstimating && (
                                <div className="absolute inset-0 flex items-center pl-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            <Input
                                type="text"
                                value={toAmount}
                                readOnly
                                className={`text-xl font-bold bg-transparent border-0 h-14 focus-visible:ring-0 px-3 ${isEstimating ? 'text-transparent' : ''}`}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-3 h-14 rounded-lg hover:bg-background/50 transition-colors min-w-[110px]"
                                onClick={() => { setShowToDropdown(!showToDropdown); setShowFromDropdown(false); }}
                            >
                                {toCurrency?.image && <img src={toCurrency.image} alt={toCurrency.ticker} className="w-6 h-6 rounded-full" />}
                                <span className="font-bold uppercase">{toCurrency?.ticker || 'SEL'}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {showToDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 max-h-60 overflow-y-auto bg-card rounded-xl border border-border shadow-xl z-20">
                                    {currencies.map(c => (
                                        <button
                                            key={c.ticker + c.network}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
                                            onClick={() => { setToCurrency(c); setShowToDropdown(false); }}
                                        >
                                            <img src={c.image} className="w-6 h-6 rounded-full" alt="" />
                                            <div>
                                                <div className="font-bold uppercase">{c.ticker}</div>
                                                <div className="text-xs text-muted-foreground">{c.name} <span className="opacity-50">({c.network})</span></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Destination Address */}
                <div className="space-y-2 mt-4">
                    <label className="text-xs font-medium text-muted-foreground ml-1">
                        Destination {toCurrency?.ticker.toUpperCase()} Address
                    </label>
                    <Input
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        className={`h-12 bg-secondary/30 ${!isAddressValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        placeholder={`Enter your ${toCurrency?.name || 'wallet'} address`}
                    />
                    {!isAddressValid && (
                        <p className="text-xs text-red-500 ml-1">{addressError}</p>
                    )}
                </div>

                {/* Exchange Info */}
                <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Includes Fee</span>
                        <span>1.0%</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Estimated Arrival</span>
                        <span>5-30 mins</span>
                    </div>
                </div>

                {/* Main Action Button */}
                <Button
                    variant="gradient"
                    size="xl"
                    className="w-full mt-4 font-bold text-lg"
                    onClick={handleCreateExchange}
                    disabled={isCreatingTx || isEstimating || !fromAmount || !toAmount || !destinationAddress || !isAddressValid}
                >
                    {isCreatingTx ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Creating Exchange...
                        </>
                    ) : (
                        "Exchange Now"
                    )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                    By clicking Exchange, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}
