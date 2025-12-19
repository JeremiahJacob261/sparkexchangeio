"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle, Copy, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface ExchangeData {
    id: string;
    payinAddress: string;
    payoutAddress: string;
    fromAmount: number;
    toAmount: number;
    payinHash?: string;
    payoutHash?: string;
    updatedAt: string;
    status: string; // waiting, confirming, exchanging, sending, finished, failed, refunded, expired
}

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [statusData, setStatusData] = useState<ExchangeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Polling Logic
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/changenow/transaction/${id}`);
                const data = await res.json();

                if (data.success) {
                    setStatusData({
                        id: id,
                        payinAddress: data.payinAddress,
                        payoutAddress: data.payoutAddress,
                        fromAmount: data.fromAmount,
                        toAmount: data.toAmount,
                        status: data.status,
                        payinHash: data.payinHash,
                        payoutHash: data.payoutHash,
                        updatedAt: data.updatedAt
                    });

                    // Stop polling if final state
                    if (['finished', 'failed', 'refunded', 'expired'].includes(data.status)) {
                        clearInterval(intervalId);
                    }
                } else {
                    setError(data.error || "Failed to fetch status");
                }
            } catch (err) {
                console.error("Polling error", err);
                setError("Network error");
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
        intervalId = setInterval(checkStatus, 15000);

        return () => clearInterval(intervalId);
    }, [id]);

    const getStepStatus = (step: 'deposit' | 'exchange' | 'send' | 'finish') => {
        if (!statusData) return 'pending';
        const txStatus = statusData.status;

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

        if (step === 'deposit') return txStatus === 'waiting' ? 'active' : 'completed';
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
        if (step === 'finish') return txStatus === 'finished' ? 'completed' : 'pending';
        return 'pending';
    };


    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center">
                <div className="w-full max-w-2xl mt-10">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>

                    <div className="glass rounded-2xl p-8 shadow-2xl border border-primary/20">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Loading transaction...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-10">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold mb-2">Error Loading Transaction</h2>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        ) : statusData ? (
                            <>
                                <div className="text-center mb-10">
                                    <h1 className="text-3xl font-bold mb-2">Transaction Status</h1>
                                    <p className="font-mono text-muted-foreground bg-secondary/30 inline-block px-3 py-1 rounded-lg">
                                        ID: {statusData.id}
                                    </p>
                                </div>

                                {/* Stepper */}
                                <div className="flex items-center justify-between mb-12 px-4 relative">
                                    <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-white/10 -z-10" />
                                    {[
                                        { id: 'deposit', label: 'Deposit' },
                                        { id: 'exchange', label: 'Exchange' },
                                        { id: 'send', label: 'Sending' },
                                        { id: 'finish', label: 'Done' }
                                    ].map((step, index) => {
                                        const status = getStepStatus(step.id as any);
                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 rounded-lg z-10">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${status === 'completed' ? 'bg-green-500 border-green-500 text-black' :
                                                        status === 'active' ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/30' :
                                                            status === 'error' ? 'bg-red-500 border-red-500 text-white' :
                                                                'bg-secondary border-muted text-muted-foreground'
                                                    }`}>
                                                    {status === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                                                        status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                                                            <span className="text-sm font-bold">{index + 1}</span>}
                                                </div>
                                                <span className={`text-xs font-bold uppercase ${status === 'active' ? 'text-primary' :
                                                        status === 'completed' ? 'text-green-500' :
                                                            status === 'error' ? 'text-red-500' :
                                                                'text-muted-foreground'
                                                    }`}>{step.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Content based on status */}
                                {statusData.status === 'waiting' && (
                                    <div className="grid md:grid-cols-2 gap-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                                            <QRCodeCanvas value={statusData.payinAddress} size={180} />
                                        </div>
                                        <div className="flex flex-col justify-center space-y-6">
                                            <div>
                                                <label className="text-sm text-muted-foreground mb-1 block">Send Exact Amount</label>
                                                <div className="text-3xl font-bold">{statusData.fromAmount} <span className="text-primary text-xl">Coin</span></div>
                                            </div>
                                            <div>
                                                <label className="text-sm text-muted-foreground mb-1 block">To Address</label>
                                                <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg border border-border">
                                                    <code className="text-xs flex-1 break-all font-mono">{statusData.payinAddress}</code>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => navigator.clipboard.writeText(statusData.payinAddress)}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {statusData.status === 'finished' && (
                                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl p-8 mb-8">
                                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <h2 className="text-2xl font-bold text-green-500 mb-2">Exchange Successful!</h2>
                                        <p className="text-muted-foreground mb-4">You received <strong>{statusData.toAmount}</strong></p>

                                        {statusData.payoutHash && (
                                            <div className="text-xs text-muted-foreground break-all">
                                                Hash: {statusData.payoutHash}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
