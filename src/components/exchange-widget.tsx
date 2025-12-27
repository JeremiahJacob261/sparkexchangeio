"use client";
import Link from "next/link";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeftRight, ChevronDown, Loader2, AlertCircle, Copy, CheckCircle, QrCode, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateAddress } from "@/lib/validation";
import { QRCodeCanvas } from "qrcode.react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Currency {
    ticker: string;
    name: string;
    image: string;
    network: string;
}

interface ExchangeResponse {
    id: string;
    payinAddress: string;
    payoutAddress: string;
    fromAmount: string; // StealthEX might return number or string, we handle widely
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

    const [fromAmount, setFromAmount] = useState<string>("0.1");
    const [toAmount, setToAmount] = useState<string>("");

    const [destinationAddress, setDestinationAddress] = useState("");
    const [isAddressValid, setIsAddressValid] = useState(true);
    const [addressError, setAddressError] = useState("");

    const [refundAddress, setRefundAddress] = useState("");
    const [isRefundAddressValid, setIsRefundAddressValid] = useState(true);

    const [isEstimating, setIsEstimating] = useState(false);
    const [estimateError, setEstimateError] = useState<string | null>(null);

    const [isCreatingTx, setIsCreatingTx] = useState(false);
    const [txResult, setTxResult] = useState<ExchangeResponse | null>(null);

    const [termsAccepted, setTermsAccepted] = useState(false);

    // Transaction Status state
    const [txStatus, setTxStatus] = useState<string>("waiting"); // waiting, confirming, exchanging, sending, finished, failed
    const [isPolling, setIsPolling] = useState(false);

    // Dropdown states
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Debounce amount for API calls
    const debouncedFromAmount = useDebounce(fromAmount, 500);

    // Optimize: Memoize filtered currencies and limit to 50 items to prevent lag
    const filteredCurrencies = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return currencies
            .filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.ticker.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 50);
    }, [currencies, searchQuery]);

    // Initialize Currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch('/api/changenow/currencies');
                const data = await res.json();

                if (data.success && data.currencies.length > 0) {
                    setCurrencies(data.currencies);

                    // Default selections: BTC -> ETH
                    // We look for 'btc' and 'eth' tickers.
                    const btc = data.currencies.find((c: Currency) => c.ticker === 'btc');
                    const eth = data.currencies.find((c: Currency) => c.ticker === 'eth');

                    const defaultFrom = btc || data.currencies[0];
                    const defaultTo = eth || data.currencies[1] || data.currencies[0];

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
                if (fromCurrency.network) params.append('fromNetwork', fromCurrency.network);
                if (toCurrency.network) params.append('toNetwork', toCurrency.network);

                const res = await fetch(`/api/changenow/estimate?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setToAmount(parseFloat(data.estimate.toAmount).toFixed(6));
                    if (data.estimate.toAmount === 0) {
                        setEstimateError("Amount too low");
                    }
                } else {
                    // Use specific error message from details if available
                    const errorMessage = data.details?.message || data.error || "Estimation failed";
                    setEstimateError(errorMessage);
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
            setIsAddressValid(true);
            setAddressError("");
            return;
        }

        const isValid = validateAddress(destinationAddress, toCurrency.network);
        setIsAddressValid(isValid);
        setAddressError(isValid ? "" : `Invalid ${toCurrency.network} address`);

    }, [destinationAddress, toCurrency]);

    // Validate Refund Address
    useEffect(() => {
        if (!refundAddress || !fromCurrency) {
            setIsRefundAddressValid(true);
            return;
        }
        setIsRefundAddressValid(validateAddress(refundAddress, fromCurrency.network));
    }, [refundAddress, fromCurrency]);

    // Polling Effect
    useEffect(() => {
        if (!txResult || !isPolling) return;

        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/changenow/transaction/${txResult.id}`);
                const data = await res.json();

                if (data.success && data.status) {
                    setTxStatus(data.status);

                    if (data.status === 'finished' || data.status === 'failed' || data.status === 'refunded' || data.status === 'expired') {
                        setIsPolling(false);
                    }
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        };

        // Check immediately then poll
        checkStatus();
        intervalId = setInterval(checkStatus, 15000); // Poll every 15s

        return () => clearInterval(intervalId);
    }, [txResult, isPolling]);

    // Start polling when txResult is set
    useEffect(() => {
        if (txResult) {
            setTxStatus("waiting");
            setIsPolling(true);
        }
    }, [txResult]);

    // Helpers for Stepper
    const getStepStatus = (step: 'deposit' | 'exchange' | 'send' | 'finish') => {
        const statusMap: Record<string, number> = {
            'waiting': 0,
            'confirming': 1,
            'exchanging': 2,
            'sending': 3,
            'finished': 4,
            'failed': -1,
            'refunded': -1,
            'expired': -1
        };

        const currentStepValue = statusMap[txStatus] ?? 0;

        if (currentStepValue === -1) return 'error';

        if (step === 'deposit') {
            if (txStatus === 'waiting') return 'active';
            return 'completed';
        }
        if (step === 'exchange') {
            if (txStatus === 'waiting') return 'pending';
            if (txStatus === 'confirming' || txStatus === 'exchanging') return 'active';
            return 'completed';
        }
        if (step === 'send') {
            if (['waiting', 'confirming', 'exchanging'].includes(txStatus)) return 'pending';
            if (txStatus === 'sending') return 'active';
            return 'completed';
        }
        if (step === 'finish') {
            if (txStatus === 'finished') return 'completed';
            return 'pending';
        }
        return 'pending';
    };


    const handleSwapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);

        // Also swap amounts logic could be here but usually better to keep fromAmount
    };

    const handleCreateExchange = async () => {
        if (!fromCurrency || !toCurrency || !fromAmount || !destinationAddress || !isAddressValid || !termsAccepted) return;

        setIsCreatingTx(true);
        setEstimateError(null);

        try {
            const payload: any = {
                fromCurrency: fromCurrency.ticker,
                toCurrency: toCurrency.ticker,
                fromAmount: parseFloat(fromAmount),
                address: destinationAddress,
                refundAddress: refundAddress || undefined,
            };

            // Add network parameters if available
            if (fromCurrency.network) payload.fromNetwork = fromCurrency.network;
            if (toCurrency.network) payload.toNetwork = toCurrency.network;

            const res = await fetch('/api/changenow/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                setTxResult(data.exchange);

                // Save to local storage as fallback
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
                // Use specific error message from details if available
                const errorMessage = data.details?.message || data.error || "Failed to create transaction";
                setEstimateError(errorMessage);
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
        setFromAmount("0.1");
        setToAmount("");
        setEstimateError(null);
        setDestinationAddress("");
        setRefundAddress("");
        setTermsAccepted(false);
    };

    // --- RENDER ---

    if (isLoadingCurrencies) {
        return (
            <div className="w-full max-w-4xl mx-auto h-[400px] flex items-center justify-center glass rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Success View
    if (txResult) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <div className="glass rounded-2xl p-8 shadow-2xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-8">
                        {txStatus === 'finished' ? (
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4 ring-1 ring-green-500/40">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        ) : (
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 ring-1 ring-primary/20">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}

                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {txStatus === 'waiting' && 'Awaiting Deposit'}
                            {(txStatus === 'confirming' || txStatus === 'exchanging') && 'Exchanging...'}
                            {txStatus === 'sending' && 'Sending to You...'}
                            {txStatus === 'finished' && 'Exchange Completed!'}
                            {(txStatus === 'failed' || txStatus === 'refunded' || txStatus === 'expired') && 'Exchange Failed'}
                        </h3>
                        <p className="text-muted-foreground mt-2 font-mono text-sm">ID: {txResult.id}</p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-10 px-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/10 -z-10" />

                        {[
                            { id: 'deposit', label: 'Deposit' },
                            { id: 'exchange', label: 'Exchange' },
                            { id: 'send', label: 'Sending' },
                            { id: 'finish', label: 'Done' }
                        ].map((step, index) => {
                            const status = getStepStatus(step.id as any);
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-[#0a0a0a] px-2 rounded-lg">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${status === 'completed' ? 'bg-green-500 border-green-500 text-black' :
                                        status === 'active' ? 'bg-primary border-primary text-white scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                                            'bg-black border-white/20 text-white/40'
                                        }`}>
                                        {status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-bold">{index + 1}</span>}
                                    </div>
                                    <span className={`text-xs font-medium ${status === 'active' ? 'text-primary' :
                                        status === 'completed' ? 'text-green-500' : 'text-muted-foreground'
                                        }`}>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Deposit Instructions (Only show if waiting) */}
                    {txStatus === 'waiting' && (
                        <div className="grid md:grid-cols-2 gap-8 mb-8 animate-in fade-in duration-500">
                            <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center space-y-4">
                                <div className="bg-white p-2 rounded-lg">
                                    <QRCodeCanvas value={txResult.payinAddress} size={160} />
                                </div>
                                <p className="text-xs text-muted-foreground">Scan to deposit</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Send Exact Amount</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">{txResult.fromAmount}</span>
                                        <span className="text-xl font-medium text-primary mb-1">{txResult.fromCurrency.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">To Deposit Address</p>
                                    <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/10 group hover:border-primary/50 transition-colors">
                                        <code className="text-xs flex-1 break-all font-mono text-gray-300">{txResult.payinAddress}</code>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                                            onClick={() => navigator.clipboard.writeText(txResult.payinAddress)}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-xs bg-yellow-500/10 text-yellow-500 p-3 rounded-lg border border-yellow-500/20">
                                    <p>⚠️ Send only {txResult.fromCurrency.toUpperCase()} to this address. Sending other coins may result in permanent loss.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Completion Info */}
                    {txStatus === 'finished' && (
                        <div className="text-center p-6 bg-green-500/5 rounded-xl border border-green-500/20 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-green-500 font-medium mb-1">Successfully Sent</p>
                            <p className="text-3xl font-bold text-white mb-2">{txResult.toAmount} {txResult.toCurrency.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground break-all">to {txResult.payoutAddress}</p>
                        </div>
                    )}

                    {/* Error Info */}
                    {(txStatus === 'failed' || txStatus === 'expired' || txStatus === 'refunded') && (
                        <div className="text-center p-6 bg-red-500/5 rounded-xl border border-red-500/20 mb-8 animate-in fade-in zoom-in duration-300">
                            <p className="text-red-500 font-medium mb-1">Transaction Failed</p>
                            <p className="text-sm text-muted-foreground">Please contact support with your Transaction ID if you verified funds were sent.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={reset} className="w-full" variant="outline">
                            New Exchange
                        </Button>
                        <Button asChild className="w-full" variant="default">
                            <Link href={`/status/${txResult.id}`} target="_blank">
                                Track Order
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Swap View
    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="glass rounded-2xl p-1 shadow-2xl overflow-hidden ">
                <div className="bg-card/50 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/5">
                    <h3 className="text-xl font-bold text-center mb-8 text-white">Exchange Crypto</h3>

                    {estimateError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-sm text-red-500">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{estimateError}</span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 relative">
                        {/* You Send */}
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 hover:border-primary/30 transition-colors focus-within:border-primary/50">
                            <label className="text-sm text-muted-foreground mb-2 block">You send</label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={fromAmount}
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    className="text-3xl font-bold bg-transparent border-0 h-auto p-0 focus-visible:ring-0 shadow-none text-white placeholder:text-gray-700"
                                    placeholder="0.00"
                                />
                                <div className="relative shrink-0">
                                    <button
                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10 transition-colors"
                                        onClick={() => {
                                            setShowFromDropdown(!showFromDropdown);
                                            setShowToDropdown(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        {fromCurrency?.image && <img src={fromCurrency.image} alt="" className="w-6 h-6 rounded-full" />}
                                        <span className="font-bold uppercase text-white">{fromCurrency?.ticker || 'SEL'}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {showFromDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-[#1a1b1e] rounded-xl border border-white/10 shadow-2xl z-30 flex flex-col">
                                            <div className="p-3 sticky top-0 bg-[#1a1b1e] z-10 border-b border-white/5">
                                                <Input
                                                    placeholder="Search coins..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-9 bg-black/20 border-white/10 text-xs"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="p-2 space-y-1 overflow-y-auto">
                                                {filteredCurrencies
                                                    .map(c => (
                                                        <button
                                                            key={c.ticker + c.network}
                                                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left transition-colors"
                                                            onClick={() => { setFromCurrency(c); setShowFromDropdown(false); }}
                                                        >
                                                            <img src={c.image} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                                            <div className="overflow-hidden">
                                                                <div className="font-bold uppercase text-sm text-white truncate">{c.ticker} <span className="text-[10px] text-muted-foreground bg-white/5 px-1 rounded ml-1">{c.network}</span></div>
                                                                <div className="text-xs text-muted-foreground truncate">{c.name}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Swap Icon */}
                        <div className="flex md:hidden justify-center -my-2 z-10">
                            <button
                                onClick={handleSwapCurrencies}
                                className="w-10 h-10 bg-[#1a1b1e] rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-lg active:scale-95"
                            >
                                <ArrowLeftRight className="w-4 h-4 rotate-90" />
                            </button>
                        </div>

                        {/* Swap Icon (Desktop) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 md:flex hidden">
                            <button
                                onClick={handleSwapCurrencies}
                                className="w-10 h-10 bg-[#1a1b1e] rounded-lg border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
                            >
                                <ArrowLeftRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* You Get */}
                        <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 hover:border-primary/30 transition-colors">
                            <label className="text-sm text-muted-foreground mb-2 block">You get (estimated)</label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    {isEstimating && <Loader2 className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />}
                                    <Input
                                        type="text"
                                        value={toAmount}
                                        readOnly
                                        className={`text-3xl font-bold bg-transparent border-0 h-auto p-0 focus-visible:ring-0 shadow-none text-white placeholder:text-gray-700 ${isEstimating ? 'opacity-0' : 'opacity-100'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="relative shrink-0">
                                    <button
                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10 transition-colors"
                                        onClick={() => {
                                            setShowToDropdown(!showToDropdown);
                                            setShowFromDropdown(false);
                                            setSearchQuery("");
                                        }}
                                    >
                                        {toCurrency?.image && <img src={toCurrency.image} alt="" className="w-6 h-6 rounded-full" />}
                                        <span className="font-bold uppercase text-white">{toCurrency?.ticker || 'SEL'}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {showToDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-[#1a1b1e] rounded-xl border border-white/10 shadow-2xl z-20 flex flex-col">
                                            <div className="p-3 sticky top-0 bg-[#1a1b1e] z-10 border-b border-white/5">
                                                <Input
                                                    placeholder="Search coins..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="h-9 bg-black/20 border-white/10 text-xs"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="p-2 space-y-1 overflow-y-auto">
                                                {filteredCurrencies
                                                    .map(c => (
                                                        <button
                                                            key={c.ticker + c.network}
                                                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-left transition-colors"
                                                            onClick={() => { setToCurrency(c); setShowToDropdown(false); }}
                                                        >
                                                            <img src={c.image} className="w-6 h-6 rounded-full shrink-0" alt="" />
                                                            <div className="overflow-hidden">
                                                                <div className="font-bold uppercase text-sm text-white truncate">{c.ticker} <span className="text-[10px] text-muted-foreground bg-white/5 px-1 rounded ml-1">{c.network}</span></div>
                                                                <div className="text-xs text-muted-foreground truncate">{c.name}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rate Info */}
                    <div className="flex items-center gap-4 text-xs font-medium mt-4 mb-8">
                        <span className="text-green-500 underline decoration-dotted underline-offset-2 cursor-help">No extra fees</span>
                        {fromCurrency && toCurrency && toAmount && (
                            <span className="text-muted-foreground">
                                Estimated rate: 1 {fromCurrency.ticker.toUpperCase()} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount || '1')).toFixed(6)} {toCurrency.ticker.toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Recipient Wallet */}
                    <div className="space-y-4 mb-8">
                        <label className="text-sm text-muted-foreground">Recipient Wallet</label>
                        <div className="relative">
                            <Input
                                value={destinationAddress}
                                onChange={(e) => setDestinationAddress(e.target.value)}
                                className={`h-14 bg-black/20 border-white/10 text-white rounded-xl px-4 focus-visible:ring-primary/50 text-base ${!isAddressValid ? 'border-red-500' : ''}`}
                                placeholder={`Enter ${toCurrency?.ticker.toUpperCase()} payout address`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <QrCode className="w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer" />
                            </div>
                        </div>
                        {!isAddressValid && (
                            <p className="text-xs text-red-500 pl-1">{addressError}</p>
                        )}
                    </div>

                    {/* Exchange Button */}
                    <Button
                        size="xl"
                        variant="gradient"
                        className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100"
                        onClick={handleCreateExchange}
                        disabled={isCreatingTx || isEstimating || !fromAmount || !toAmount || !destinationAddress || !isAddressValid || !termsAccepted}
                    >
                        {isCreatingTx ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            "Exchange"
                        )}
                    </Button>

                    {/* Terms */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked: boolean) => setTermsAccepted(checked)}
                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <label
                            htmlFor="terms"
                            className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I've read and agree to the provider's <span className="underline hover:text-primary cursor-pointer">Terms of use</span> and <span className="underline hover:text-primary cursor-pointer">Privacy Policy</span>
                        </label>
                    </div>

                    <div className="my-6 border-b border-white/5"></div>

                    {/* Refund Wallet / Advanced */}
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="advanced" className="border-0">
                            <AccordionTrigger className="text-xs font-bold text-muted-foreground uppercase opacity-70 hover:opacity-100 hover:no-underline py-2">
                                <div className="flex items-center gap-2 text-[10px] tracking-wider">
                                    Advanced Settings
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 space-y-2">
                                    <label className="text-sm text-muted-foreground">Refund Wallet (Optional)</label>
                                    <Input
                                        value={refundAddress}
                                        onChange={(e) => setRefundAddress(e.target.value)}
                                        className={`h-12 bg-black/20 border-white/10 text-white rounded-xl ${!isRefundAddressValid ? 'border-red-500' : ''}`}
                                        placeholder={`Enter ${fromCurrency?.ticker.toUpperCase()} refund address`}
                                    />
                                    {!isRefundAddressValid && <p className="text-xs text-red-500">Invalid address</p>}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
