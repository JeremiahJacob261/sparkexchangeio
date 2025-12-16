"use client";

import { useState } from "react";
import { ArrowDownUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const currencies = [
    { symbol: "BTC", name: "Bitcoin", icon: "₿" },
    { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
    { symbol: "USDT", name: "Tether", icon: "₮" },
    { symbol: "BNB", name: "BNB", icon: "◆" },
    { symbol: "SOL", name: "Solana", icon: "◎" },
    { symbol: "XRP", name: "XRP", icon: "✕" },
    { symbol: "USDC", name: "USD Coin", icon: "$" },
    { symbol: "ADA", name: "Cardano", icon: "₳" },
];

export function ExchangeWidget() {
    const [fromCurrency, setFromCurrency] = useState(currencies[0]);
    const [toCurrency, setToCurrency] = useState(currencies[1]);
    const [fromAmount, setFromAmount] = useState("1");
    const [toAmount, setToAmount] = useState("32.45");
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSwap = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
        const tempAmount = fromAmount;
        setFromAmount(toAmount);
        setToAmount(tempAmount);
    };

    const handleExchange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert("Exchange initiated! In a real app, this would proceed to the next step.");
        }, 2000);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="glass rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
                <h3 className="text-lg font-semibold mb-4 text-center">
                    Swap Cryptocurrencies
                </h3>

                {/* From Currency */}
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">You send</label>
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={fromAmount}
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    className="text-lg font-medium bg-secondary/50 border-0 h-14"
                                    placeholder="0.00"
                                />
                            </div>
                            <button
                                className="flex items-center gap-2 px-4 h-14 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-w-[120px]"
                                onClick={() => {
                                    setShowFromDropdown(!showFromDropdown);
                                    setShowToDropdown(false);
                                }}
                            >
                                <span className="text-xl">{fromCurrency.icon}</span>
                                <span className="font-medium">{fromCurrency.symbol}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        {showFromDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl border border-border shadow-xl z-10 overflow-hidden">
                                {currencies.map((currency) => (
                                    <button
                                        key={currency.symbol}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                                        onClick={() => {
                                            setFromCurrency(currency);
                                            setShowFromDropdown(false);
                                        }}
                                    >
                                        <span className="text-lg">{currency.icon}</span>
                                        <div>
                                            <div className="font-medium">{currency.symbol}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {currency.name}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-2 relative z-10">
                    <button
                        onClick={handleSwap}
                        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                    >
                        <ArrowDownUp className="w-5 h-5" />
                    </button>
                </div>

                {/* To Currency */}
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">You receive</label>
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={toAmount}
                                    onChange={(e) => setToAmount(e.target.value)}
                                    className="text-lg font-medium bg-secondary/50 border-0 h-14"
                                    placeholder="0.00"
                                    readOnly
                                />
                            </div>
                            <button
                                className="flex items-center gap-2 px-4 h-14 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-w-[120px]"
                                onClick={() => {
                                    setShowToDropdown(!showToDropdown);
                                    setShowFromDropdown(false);
                                }}
                            >
                                <span className="text-xl">{toCurrency.icon}</span>
                                <span className="font-medium">{toCurrency.symbol}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        {showToDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl border border-border shadow-xl z-10 overflow-hidden">
                                {currencies.map((currency) => (
                                    <button
                                        key={currency.symbol}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                                        onClick={() => {
                                            setToCurrency(currency);
                                            setShowToDropdown(false);
                                        }}
                                    >
                                        <span className="text-lg">{currency.icon}</span>
                                        <div>
                                            <div className="font-medium">{currency.symbol}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {currency.name}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Exchange Rate */}
                <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Exchange Rate</span>
                        <span>
                            1 {fromCurrency.symbol} ≈ 32.45 {toCurrency.symbol}
                        </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground mt-1">
                        <span>Network Fee</span>
                        <span>~0.0001 {fromCurrency.symbol}</span>
                    </div>
                </div>

                {/* Exchange Button */}
                <Button
                    variant="gradient"
                    size="xl"
                    className="w-full mt-4"
                    onClick={handleExchange}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Exchange Now"
                    )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                    No registration required • Fast & Secure
                </p>
            </div>
        </div>
    );
}
