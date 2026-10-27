"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Zap, Download, Upload, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

// Speed test configuration
const SPEED_TEST_CONFIG = {
    // Cloudflare's speed test endpoints (publicly available)
    downloadUrls: [
        "https://speed.cloudflare.com/__down?bytes=10000000", // 10MB
        "https://speed.cloudflare.com/__down?bytes=25000000", // 25MB
        "https://speed.cloudflare.com/__down?bytes=50000000", // 50MB
    ],
    uploadUrl: "https://speed.cloudflare.com/__up",
    pingUrl: "https://speed.cloudflare.com/__down?bytes=0",
    downloadDuration: 10000, // 10 seconds
    uploadDuration: 10000, // 10 seconds
    pingCount: 5,
};

export function speedDisplayValue(speed: number, phase: string, download: number) {
    if (phase === "complete") return Math.max(0, download).toString();
    return speed > 0 ? Math.max(0, speed).toFixed(1) : "0";
}

export function SpeedtestSection() {
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<"idle" | "ping" | "download" | "upload" | "complete">("idle");
    const [displaySpeed, setDisplaySpeed] = useState(0);
    const [downloadHistory, setDownloadHistory] = useState<number[]>([]);
    const [uploadHistory, setUploadHistory] = useState<number[]>([]);
    const [results, setResults] = useState({
        download: 0,
        upload: 0,
        ping: 0,
        jitter: 0,
    });
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isRunningRef = useRef(false);
    const targetSpeedRef = useRef(0);
    const animatedSpeedRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const sectionRef = useRef<HTMLElement>(null);

    // No animation work while idle, off-screen, or in a hidden tab.
    useEffect(() => {
        if (!isRunning) return;
        let visible = !("IntersectionObserver" in window);
        let lastPaint = 0;
        const cancel = () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
            lastTimeRef.current = 0;
        };
        const animate = (time: number) => {
            if (!isRunningRef.current || !visible || document.hidden) { cancel(); return; }
            const delta = Math.min((time - (lastTimeRef.current || time)) / 1000, 0.1);
            lastTimeRef.current = time;
            const target = Math.max(0, targetSpeedRef.current);
            animatedSpeedRef.current += (target - animatedSpeedRef.current) * Math.min(1, delta * 10);
            if (time - lastPaint >= 50) {
                lastPaint = time;
                const rounded = Math.round(animatedSpeedRef.current * 10) / 10;
                setDisplaySpeed(previous => previous === rounded ? previous : rounded);
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        const sync = () => {
            cancel();
            if (document.hidden) {
                isRunningRef.current = false;
                abortControllerRef.current?.abort();
                setIsRunning(false); setPhase("idle"); setDisplaySpeed(0);
                setError("Test stopped while this tab was hidden. Start again to measure accurately.");
            } else if (visible && isRunningRef.current) animationFrameRef.current = requestAnimationFrame(animate);
        };
        let observer: IntersectionObserver | undefined;
        if (sectionRef.current && "IntersectionObserver" in window) {
            observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); });
            observer.observe(sectionRef.current);
        } else sync();
        document.addEventListener("visibilitychange", sync);
        return () => { cancel(); observer?.disconnect(); document.removeEventListener("visibilitychange", sync); };
    }, [isRunning]);

    // Speed to angle conversion (logarithmic scale like speedtest.net)
    const speedToAngle = useCallback((speed: number) => {
        if (speed <= 0) return -135;
        const maxAngle = 135;
        const minAngle = -135;
        const logSpeed = Math.log10(Math.max(1, speed));
        const normalizedSpeed = Math.min(logSpeed / 3, 1);
        return minAngle + (maxAngle - minAngle) * normalizedSpeed;
    }, []);

    // Update target speed (called from network callbacks)
    const updateSpeed = useCallback((speed: number) => {
        targetSpeedRef.current = Math.max(0, speed); // Ensure non-negative
    }, []);

    // Measure ping latency
    const measurePing = useCallback(async (): Promise<{ ping: number; jitter: number }> => {
        const latencies: number[] = [];

        for (let i = 0; i < SPEED_TEST_CONFIG.pingCount; i++) {
            if (!isRunningRef.current) break;

            try {
                const start = performance.now();
                await fetch(SPEED_TEST_CONFIG.pingUrl, {
                    method: "GET",
                    cache: "no-store",
                    signal: abortControllerRef.current?.signal,
                });
                const end = performance.now();
                latencies.push(end - start);
            } catch {
                // Ignore errors during ping test
            }
        }

        if (latencies.length === 0) {
            return { ping: 0, jitter: 0 };
        }

        const avgPing = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const jitter = latencies.length > 1
            ? latencies.reduce((sum, lat) => sum + Math.abs(lat - avgPing), 0) / latencies.length
            : 0;

        return {
            ping: Math.round(avgPing),
            jitter: Math.round(jitter),
        };
    }, []);

    // Measure download speed
    const measureDownload = useCallback(async (): Promise<number> => {
        const startTime = performance.now();
        let totalBytes = 0;
        const speeds: number[] = [];
        let lastUpdateTime = startTime;
        let lastBytes = 0;

        const downloadChunk = async (url: string) => {
            try {
                const response = await fetch(url + `&_t=${Date.now()}`, {
                    method: "GET",
                    cache: "no-store",
                    signal: abortControllerRef.current?.signal,
                });

                if (!response.body) return;

                const reader = response.body.getReader();

                while (isRunningRef.current) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    totalBytes += value.length;

                    const now = performance.now();
                    const elapsed = now - startTime;

                    // Update speed every 50ms for smoother animation
                    if (now - lastUpdateTime >= 50) {
                        const intervalBytes = totalBytes - lastBytes;
                        const intervalTime = (now - lastUpdateTime) / 1000;

                        if (intervalTime > 0) {
                            const speedMbps = Math.max(0, (intervalBytes * 8) / (intervalTime * 1000000));
                            speeds.push(speedMbps);
                            updateSpeed(speedMbps);
                            setDownloadHistory(prev => [...prev.slice(-40), speedMbps]);
                        }

                        lastUpdateTime = now;
                        lastBytes = totalBytes;
                    }

                    if (elapsed >= SPEED_TEST_CONFIG.downloadDuration) {
                        reader.cancel();
                        break;
                    }
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    console.error("Download test error:", err);
                }
            }
        };

        const downloadPromises = SPEED_TEST_CONFIG.downloadUrls.map(url => downloadChunk(url));

        await Promise.race([
            Promise.all(downloadPromises),
            new Promise(resolve => setTimeout(resolve, SPEED_TEST_CONFIG.downloadDuration + 1000)),
        ]);

        if (speeds.length === 0) return 0;

        const sortedSpeeds = [...speeds].sort((a, b) => a - b);
        const trimmedSpeeds = sortedSpeeds.slice(
            Math.floor(sortedSpeeds.length * 0.1),
            Math.ceil(sortedSpeeds.length * 0.9)
        );

        const avgSpeed = trimmedSpeeds.length > 0
            ? trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length
            : speeds.reduce((a, b) => a + b, 0) / speeds.length;

        return Math.max(0, Math.round(avgSpeed * 10) / 10);
    }, [updateSpeed]);

    // Measure upload speed
    const measureUpload = useCallback(async (): Promise<number> => {
        const startTime = performance.now();
        const speeds: number[] = [];
        let lastUpdateTime = startTime;

        const chunkSize = 1000000; // 1MB chunks
        const data = new Uint8Array(chunkSize);

        // Fill in native 64 KB batches instead of one million JS random calls.
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            for (let offset = 0; offset < data.length; offset += 65536) crypto.getRandomValues(data.subarray(offset, Math.min(offset + 65536, data.length)));
        } else data.fill(127);

        const uploadChunk = async () => {
            while (isRunningRef.current) {
                const elapsed = performance.now() - startTime;
                if (elapsed >= SPEED_TEST_CONFIG.uploadDuration) break;

                try {
                    const uploadStart = performance.now();

                    await fetch(SPEED_TEST_CONFIG.uploadUrl, {
                        method: "POST",
                        body: data,
                        signal: abortControllerRef.current?.signal,
                    });

                    const uploadEnd = performance.now();
                    const uploadTime = (uploadEnd - uploadStart) / 1000;

                    if (uploadTime > 0) {
                        const speedMbps = Math.max(0, (chunkSize * 8) / (uploadTime * 1000000));
                        speeds.push(speedMbps);

                        const now = performance.now();
                        if (now - lastUpdateTime >= 50) {
                            updateSpeed(speedMbps);
                            setUploadHistory(prev => [...prev.slice(-40), speedMbps]);
                            lastUpdateTime = now;
                        }
                    }
                } catch (err) {
                    if ((err as Error).name !== "AbortError") {
                        console.error("Upload test error:", err);
                    }
                    break;
                }
            }
        };

        await Promise.race([
            Promise.all([uploadChunk(), uploadChunk()]),
            new Promise(resolve => setTimeout(resolve, SPEED_TEST_CONFIG.uploadDuration + 1000)),
        ]);

        if (speeds.length === 0) return 0;

        const sortedSpeeds = [...speeds].sort((a, b) => a - b);
        const trimmedSpeeds = sortedSpeeds.slice(
            Math.floor(sortedSpeeds.length * 0.1),
            Math.ceil(sortedSpeeds.length * 0.9)
        );

        const avgSpeed = trimmedSpeeds.length > 0
            ? trimmedSpeeds.reduce((a, b) => a + b, 0) / trimmedSpeeds.length
            : speeds.reduce((a, b) => a + b, 0) / speeds.length;

        return Math.max(0, Math.round(avgSpeed * 10) / 10);
    }, [updateSpeed]);

    const runSpeedtest = async () => {
        setIsRunning(true);
        isRunningRef.current = true;
        setError(null);
        targetSpeedRef.current = 0;
        animatedSpeedRef.current = 0;
        setDisplaySpeed(0);
        setDownloadHistory([]);
        setUploadHistory([]);
        setResults({ download: 0, upload: 0, ping: 0, jitter: 0 });

        abortControllerRef.current = new AbortController();

        try {
            // Phase 1: Ping test
            setPhase("ping");
            const { ping, jitter } = await measurePing();
            setResults(prev => ({ ...prev, ping, jitter }));

            if (!isRunningRef.current) return;

            // Phase 2: Download test
            setPhase("download");
            const downloadSpeed = await measureDownload();
            setResults(prev => ({ ...prev, download: downloadSpeed }));
            targetSpeedRef.current = 0;

            if (!isRunningRef.current) return;

            // Phase 3: Upload test
            setPhase("upload");
            const uploadSpeed = await measureUpload();
            if (!isRunningRef.current) return;
            setResults(prev => ({ ...prev, upload: uploadSpeed }));

            setPhase("complete");
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setError("Speed test failed. Please try again.");
                console.error("Speed test error:", err);
            }
            setPhase("idle");
        } finally {
            setIsRunning(false);
            isRunningRef.current = false;
            targetSpeedRef.current = 0;
            animatedSpeedRef.current = 0;
            setDisplaySpeed(0);
        }
    };

    const stopSpeedtest = () => {
        isRunningRef.current = false;
        abortControllerRef.current?.abort();
        setIsRunning(false);
        setPhase("idle");
        targetSpeedRef.current = 0;
        animatedSpeedRef.current = 0;
        setDisplaySpeed(0);
    };

    useEffect(() => {
        return () => {
            isRunningRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    // Memoized calculations with safety bounds
    const needleAngle = useMemo(() => {
        const angle = speedToAngle(Math.max(0, displaySpeed));
        return Math.max(-135, Math.min(135, angle)); // Clamp to valid range
    }, [displaySpeed, speedToAngle]);

    const arcOffset = useMemo(() => {
        const progress = (needleAngle + 135) / 270;
        const offset = 329.87 - (329.87 * Math.max(0, Math.min(1, progress)));
        return Math.max(0, Math.min(329.87, offset)); // Clamp to valid range
    }, [needleAngle]);

    // Memoized SpeedGraph component
    const SpeedGraph = useMemo(() => {
        return function SpeedGraphView({ data, color }: { data: number[]; color: string }) {
            if (data.length === 0) {
                return (
                    <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="100" x2="100" y2="100" stroke={color} strokeWidth="1" opacity="0.3" />
                    </svg>
                );
            }

            const maxVal = Math.max(...data.map(v => Math.max(0, v)), 1);
            const points = data.map((val, i) => {
                const x = (i / Math.max(data.length - 1, 1)) * 100;
                const y = 100 - (Math.max(0, val) / maxVal) * 80;
                return `${x},${y}`;
            }).join(" ");

            const areaPoints = `0,100 ${points} 100,100`;

            return (
                <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <polygon
                        points={areaPoints}
                        fill={`url(#gradient-${color})`}
                    />
                    {data.length > 1 && (
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                        />
                    )}
                </svg>
            );
        };
    }, []);

    // Safe display value
    const displayValue = useMemo(() => speedDisplayValue(displaySpeed, phase, results.download), [displaySpeed, phase, results.download]);

    return (
        <section ref={sectionRef} id="speedtest" className="relative py-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="ambient-glow absolute top-1/4 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="ambient-glow absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
                        <Zap className="w-4 h-4" />
                        Speed Test
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Test Your Real Internet Speed{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Before You Swap</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Measure your actual connection speed to see how fast your crypto transactions will process.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-5xl mx-auto mb-6">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                            {error}
                        </div>
                    </div>
                )}

                {/* Speedtest Card */}
                <div className="max-w-5xl mx-auto">
                    <div className="relative rounded-3xl bg-[#1a1a2e] border border-cyan-500/20 p-6 md:p-10 shadow-2xl overflow-hidden">
                        {/* Animated glow border */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 animate-[shimmer_3s_ease-in-out_infinite] opacity-30"></div>
                        </div>

                        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left - Gauge */}
                            <div className="flex flex-col items-center justify-center">
                                {/* Speedometer */}
                                <div className="relative w-64 h-64 md:w-80 md:h-80">
                                    <svg className="w-full h-full" viewBox="0 0 200 200">
                                        <defs>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#06b6d4" />
                                                <stop offset="50%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>

                                        {/* Background arc */}
                                        <path
                                            d="M 30 150 A 70 70 0 1 1 170 150"
                                            fill="none"
                                            stroke="#2a2a4a"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                        />

                                        {/* Active arc - clamped values */}
                                        <path
                                            d="M 30 150 A 70 70 0 1 1 170 150"
                                            fill="none"
                                            stroke="url(#arcGradient)"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            filter="url(#glow)"
                                            strokeDasharray="329.87"
                                            strokeDashoffset={arcOffset}
                                        />

                                        {/* Scale markers */}
                                        {[0, 1, 5, 10, 100, 500, 1000].map((value) => {
                                            const angle = speedToAngle(value) * (Math.PI / 180);
                                            const x1 = 100 + Math.cos(angle - Math.PI / 2) * 55;
                                            const y1 = 100 + Math.sin(angle - Math.PI / 2) * 55;
                                            const x2 = 100 + Math.cos(angle - Math.PI / 2) * 65;
                                            const y2 = 100 + Math.sin(angle - Math.PI / 2) * 65;
                                            const labelX = 100 + Math.cos(angle - Math.PI / 2) * 78;
                                            const labelY = 100 + Math.sin(angle - Math.PI / 2) * 78;
                                            return (
                                                <g key={value}>
                                                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a4a6a" strokeWidth="2" />
                                                    <text
                                                        x={labelX}
                                                        y={labelY}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        fill="#6b7280"
                                                        fontSize="10"
                                                        fontWeight="500"
                                                    >
                                                        {value === 1000 ? "1000+" : value}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Needle - clamped angle */}
                                        <g transform={`rotate(${needleAngle}, 100, 100)`}>
                                            <polygon
                                                points="100,35 96,100 104,100"
                                                fill="url(#arcGradient)"
                                                filter="url(#glow)"
                                            />
                                            <circle cx="100" cy="100" r="8" fill="#1a1a2e" stroke="#06b6d4" strokeWidth="3" />
                                        </g>
                                    </svg>

                                    {/* Center display */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                        {phase === "ping" ? (
                                            <Activity className="w-8 h-8 mb-2 text-green-400 animate-pulse" />
                                        ) : phase === "download" ? (
                                            <Download className="w-8 h-8 mb-2 text-cyan-400 animate-pulse" />
                                        ) : phase === "upload" ? (
                                            <Upload className="w-8 h-8 mb-2 text-purple-400 animate-pulse" />
                                        ) : (
                                            <Download className="w-8 h-8 mb-2 text-cyan-400/50" />
                                        )}
                                        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tabular-nums">
                                            {displayValue}
                                        </span>
                                        <span className="text-sm text-gray-400 mt-1">
                                            {phase === "ping" ? "Testing latency..." : phase === "download" ? "Mbps download" : phase === "upload" ? "Mbps upload" : "Mbps"}
                                        </span>
                                    </div>
                                </div>

                                {/* Start Button */}
                                {phase === "idle" && (
                                    <Button
                                        onClick={runSpeedtest}
                                        className="mt-6 px-10 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Zap className="w-5 h-5 mr-2" />
                                        GO
                                    </Button>
                                )}
                                {isRunning && (
                                    <Button
                                        onClick={stopSpeedtest}
                                        variant="outline"
                                        className="mt-6 px-10 py-6 text-lg font-semibold border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-full transition-all duration-300"
                                    >
                                        Stop Test
                                    </Button>
                                )}
                                {phase === "complete" && (
                                    <Button
                                        onClick={runSpeedtest}
                                        className="mt-6 px-10 py-6 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 transform hover:scale-105"
                                    >
                                        <Zap className="w-5 h-5 mr-2" />
                                        TEST AGAIN
                                    </Button>
                                )}
                            </div>

                            {/* Right - Stats */}
                            <div className="flex flex-col gap-4">
                                {/* Download Stats */}
                                <div className="bg-[#12121f] rounded-2xl p-5 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Download className="w-5 h-5 text-cyan-400" />
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Download</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-4xl font-bold text-white tabular-nums">
                                            {phase === "complete" || phase === "upload" ? results.download : (phase === "download" ? Math.max(0, Math.round(displaySpeed)) : "---")}
                                        </span>
                                        <span className="text-gray-500">Mbps</span>
                                    </div>
                                    <div className="h-16 bg-[#0a0a12] rounded-lg overflow-hidden">
                                        <SpeedGraph data={downloadHistory} color="#06b6d4" />
                                    </div>
                                </div>

                                {/* Upload Stats */}
                                <div className="bg-[#12121f] rounded-2xl p-5 border border-purple-500/10 hover:border-purple-500/30 transition-colors duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Upload className="w-5 h-5 text-purple-400" />
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Upload</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-4xl font-bold text-white tabular-nums">
                                            {phase === "complete" ? results.upload : (phase === "upload" ? Math.max(0, Math.round(displaySpeed)) : "---")}
                                        </span>
                                        <span className="text-gray-500">Mbps</span>
                                    </div>
                                    <div className="h-16 bg-[#0a0a12] rounded-lg overflow-hidden">
                                        <SpeedGraph data={uploadHistory} color="#a855f7" />
                                    </div>
                                </div>

                                {/* Ping & Jitter */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#12121f] rounded-2xl p-5 border border-green-500/10 hover:border-green-500/30 transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-green-400" />
                                            <span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Ping</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white tabular-nums">
                                                {results.ping > 0 || phase !== "idle" ? results.ping : "---"}
                                            </span>
                                            <span className="text-gray-500 text-sm">ms</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#12121f] rounded-2xl p-5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-yellow-400" />
                                            <span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Jitter</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white tabular-nums">
                                                {results.jitter > 0 || phase !== "idle" ? results.jitter : "---"}
                                            </span>
                                            <span className="text-gray-500 text-sm">ms</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Crypto Swap Estimate */}
                                {phase === "complete" && (
                                    <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl p-5 border border-cyan-500/20 animate-fade-in-up">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-gray-400 text-sm">Estimated Crypto Swap Time</span>
                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                                        {results.download > 100 ? "< 3s" : results.download > 50 ? "3-5s" : results.download > 10 ? "5-10s" : "10-30s"}
                                                    </span>
                                                    <span className="text-green-400 text-sm">
                                                        {results.download > 50 ? "⚡ Lightning Fast" : results.download > 10 ? "✓ Good Speed" : "⏱ Moderate"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Zap className="w-10 h-10 text-yellow-400 animate-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </section>
    );
}
