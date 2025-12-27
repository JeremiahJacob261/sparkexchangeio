"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, LogOut, TrendingUp, Activity, CheckCircle, XCircle, Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
    id: string;
    changenow_id?: string;
    stealthex_id?: string;
    payin_address: string;
    payout_address: string;
    from_currency: string;
    to_currency: string;
    from_amount: number;
    to_amount: number;
    status: string;
    created_at: string;
}

interface Analytics {
    totalTransactions: number;
    totalVolume: number; // Raw sum
    successRate: string;
    totalVisits: number;
    totalUniqueVisits: number;
    totalVolumeUSD: number;
    totalCommissionUSD: number;
}

export default function AdminDashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [commission, setCommission] = useState<string>("0");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Force sync a transaction from ChangeNOW or StealthEX
    const syncTransaction = async (id: string, externalId: string) => {
        setIsRefreshing(id);
        try {
            // Try ChangeNOW as the primary provider
            await fetch(`/api/changenow/transaction/${externalId}`);
            await fetchData();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsRefreshing(null);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Check auth
            const res = await fetch("/api/admin/transactions");
            if (res.status === 401) {
                router.push("/admin");
                return;
            }
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
                setAnalytics(data.analytics);
                console.log(data.analytics);
            }

            // Fetch Config
            const configRes = await fetch("/api/admin/config");
            const configData = await configRes.json();
            if (configData.commission_percentage !== undefined) {
                setCommission(configData.commission_percentage.toString());
            }

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCommission = async () => {
        setIsSaving(true);
        try {
            const val = parseFloat(commission);
            if (isNaN(val) || val < 0) {
                alert("Invalid commission value");
                return;
            }
            const res = await fetch("/api/admin/config", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commission_percentage: val })
            });
            if (res.ok) {
                alert("Commission updated successfully");
            } else {
                alert("Failed to update commission");
            }
        } catch (error) {
            console.error("Error saving commission", error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push("/admin");
    };

    if (isLoading && transactions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 text-white font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">SparkExchange Admin</h1>
                    <p className="text-muted-foreground text-sm">Dashboard & Analytics</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Analytics Cards */}
                {analytics && (
                    <>
                        <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Activity className="w-24 h-24" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Transactions</h3>
                            <p className="text-3xl font-bold">{analytics.totalTransactions}</p>
                        </div>

                        <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp className="w-24 h-24" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Visits</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold">{analytics.totalVisits}</span>
                                <span className="text-sm text-muted-foreground mb-1">({analytics.totalUniqueVisits} unique)</span>
                            </div>
                        </div>

                        <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CheckCircle className="w-24 h-24" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Success Rate</h3>
                            <p className="text-3xl font-bold text-green-500">{analytics.successRate}%</p>
                        </div>

                        <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="text-6xl font-bold">$</span>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Volume</h3>
                            <p className="text-3xl font-bold">${(analytics.totalVolumeUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-muted-foreground mt-1">Estimated USD Value</p>
                        </div>

                        <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden border-primary/20 bg-primary/5">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="text-6xl font-bold text-primary">$</span>
                            </div>
                            <h3 className="text-sm font-medium text-primary mb-2">Total Earnings</h3>
                            <p className="text-3xl font-bold text-primary">${(analytics.totalCommissionUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-xs text-primary/70 mt-1">Commission Earned</p>
                        </div>
                    </>
                )}

                {/* Commission Settings */}
                <div className="bg-card border border-white/10 p-6 rounded-xl relative overflow-hidden md:col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Settings className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Platform Settings</h3>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Your Commission (%)</label>
                            <Input
                                type="number"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                                min="0"
                                step="0.1"
                                className="bg-black/20"
                            />
                        </div>
                        <Button onClick={handleUpdateCommission} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-card border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-white/5">
                    <h2 className="font-semibold">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">ID</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Pair</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Amount</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Address</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{tx.stealthex_id || tx.changenow_id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold uppercase">
                                            <span>{tx.from_currency}</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span>{tx.to_currency}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{Number(tx.from_amount).toFixed(4)} <span className="text-xs text-muted-foreground uppercase">{tx.from_currency}</span></div>
                                        <div className="text-xs text-muted-foreground">≈ {Number(tx.to_amount).toFixed(4)} <span className="uppercase">{tx.to_currency}</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${tx.status === 'finished' || tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                                tx.status === 'failed' || tx.status === 'expired' || tx.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-blue-500/10 text-blue-500'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px] truncate font-mono text-xs text-muted-foreground" title={tx.payout_address}>
                                        {tx.payout_address}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-white"
                                            onClick={() => syncTransaction(tx.id, (tx.stealthex_id || tx.changenow_id) as string)}
                                            disabled={isRefreshing === tx.id}
                                            title="Sync Status"
                                        >
                                            <RefreshCcw className={`w-4 h-4 ${isRefreshing === tx.id ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No transactions found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
