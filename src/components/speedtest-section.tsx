"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Download, Upload, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpeedtestSection() {
    const [isRunning, setIsRunning] = useState(false);
    const [phase, setPhase] = useState<"idle" | "download" | "upload" | "complete">("idle");
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [downloadHistory, setDownloadHistory] = useState<number[]>([]);
    const [uploadHistory, setUploadHistory] = useState<number[]>([]);
    const [results, setResults] = useState({
        download: 0,
        upload: 0,
        ping: 0,
        jitter: 0,
    });
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    // Speed to angle conversion (logarithmic scale like speedtest.net)
    const speedToAngle = (speed: number) => {
        if (speed <= 0) return -135;
        const maxAngle = 135;
        const minAngle = -135;
        // Logarithmic scale: 0->-135, 1->-90, 10->-45, 100->45, 1000->135
        const logSpeed = Math.log10(Math.max(1, speed));
        const normalizedSpeed = Math.min(logSpeed / 3, 1); // log10(1000) = 3
        return minAngle + (maxAngle - minAngle) * normalizedSpeed;
    };

    const runSpeedtest = () => {
        setIsRunning(true);
        setPhase("download");
        setCurrentSpeed(0);
        setDownloadHistory([]);
        setUploadHistory([]);
        setResults({ download: 0, upload: 0, ping: 0, jitter: 0 });

        // Generate random ping/jitter immediately
        const ping = Math.floor(Math.random() * 80 + 20);
        const jitter = Math.floor(Math.random() * 50 + 10);
        setResults(prev => ({ ...prev, ping, jitter }));

        startTimeRef.current = Date.now();
        runDownloadPhase();
    };

    const runDownloadPhase = () => {
        const duration = 4000; // 4 seconds for download
        const targetSpeed = Math.random() * 400 + 100; // 100-500 Mbps

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Simulate speed fluctuations
            const baseSpeed = targetSpeed * progress;
            const noise = (Math.random() - 0.5) * 50;
            const speed = Math.max(0, baseSpeed + noise * progress);

            setCurrentSpeed(speed);
            setDownloadHistory(prev => [...prev.slice(-30), speed]);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setResults(prev => ({ ...prev, download: Math.round(targetSpeed) }));
                setPhase("upload");
                startTimeRef.current = Date.now();
                runUploadPhase();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const runUploadPhase = () => {
        const duration = 4000; // 4 seconds for upload
        const targetSpeed = Math.random() * 200 + 50; // 50-250 Mbps

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            const baseSpeed = targetSpeed * progress;
            const noise = (Math.random() - 0.5) * 30;
            const speed = Math.max(0, baseSpeed + noise * progress);

            setCurrentSpeed(speed);
            setUploadHistory(prev => [...prev.slice(-30), speed]);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setResults(prev => ({ ...prev, upload: Math.round(targetSpeed) }));
                setPhase("complete");
                setIsRunning(false);
                setCurrentSpeed(0);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const needleAngle = speedToAngle(currentSpeed);

    // Graph component
    const SpeedGraph = ({ data, color }: { data: number[]; color: string }) => {
        const maxVal = Math.max(...data, 1);
        const points = data.map((val, i) => {
            const x = (i / 30) * 100;
            const y = 100 - (val / maxVal) * 80;
            return `${x},${y}`;
        }).join(" ");

        const areaPoints = data.length > 0
            ? `0,100 ${points} 100,100`
            : "0,100 100,100";

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
                    className="transition-all duration-75"
                />
                {data.length > 1 && (
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        className="transition-all duration-75"
                    />
                )}
            </svg>
        );
    };

    return (
        <section id="speedtest" className="relative py-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
                        <Zap className="w-4 h-4" />
                        Speed Test
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Want to see how fast your crypto swap can go?{" "}
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Take a speed test</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Test your connection and see the estimated swap time for lightning-fast crypto exchanges.
                    </p>
                </div>

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
                                        {/* Outer glow */}
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

                                        {/* Active arc (animated) */}
                                        <path
                                            d="M 30 150 A 70 70 0 1 1 170 150"
                                            fill="none"
                                            stroke="url(#arcGradient)"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            filter="url(#glow)"
                                            strokeDasharray="329.87"
                                            strokeDashoffset={329.87 - (329.87 * ((needleAngle + 135) / 270))}
                                            className="transition-all duration-100"
                                        />

                                        {/* Scale markers */}
                                        {[0, 1, 5, 10, 100, 500, 1000].map((value, i) => {
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

                                        {/* Needle */}
                                        <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-100">
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
                                        <Download className={`w-8 h-8 mb-2 transition-colors duration-300 ${phase === "download" ? "text-cyan-400 animate-pulse" : phase === "upload" ? "text-purple-400" : "text-cyan-400/50"}`} />
                                        <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent transition-all duration-100">
                                            {currentSpeed > 0 ? currentSpeed.toFixed(1) : (phase === "complete" ? results.download : "0")}
                                        </span>
                                        <span className="text-sm text-gray-400 mt-1">
                                            {phase === "download" ? "Mbps download" : phase === "upload" ? "Mbps upload" : "Mbps"}
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
                                    <div className="mt-6 px-6 py-3 bg-cyan-500/10 rounded-full border border-cyan-500/30">
                                        <span className="text-cyan-400 font-medium animate-pulse">
                                            {phase === "download" ? "Testing Download..." : "Testing Upload..."}
                                        </span>
                                    </div>
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
                                <div className="bg-[#12121f] rounded-2xl p-5 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Download className="w-5 h-5 text-cyan-400" />
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Download</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-4xl font-bold text-white">
                                            {phase === "complete" || phase === "upload" ? results.download : (phase === "download" ? Math.round(currentSpeed) : "---")}
                                        </span>
                                        <span className="text-gray-500">Mbps</span>
                                    </div>
                                    <div className="h-16 bg-[#0a0a12] rounded-lg overflow-hidden">
                                        <SpeedGraph data={downloadHistory} color="#06b6d4" />
                                    </div>
                                </div>

                                {/* Upload Stats */}
                                <div className="bg-[#12121f] rounded-2xl p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Upload className="w-5 h-5 text-purple-400" />
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-sm">Upload</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className="text-4xl font-bold text-white">
                                            {phase === "complete" ? results.upload : (phase === "upload" ? Math.round(currentSpeed) : "---")}
                                        </span>
                                        <span className="text-gray-500">Mbps</span>
                                    </div>
                                    <div className="h-16 bg-[#0a0a12] rounded-lg overflow-hidden">
                                        <SpeedGraph data={uploadHistory} color="#a855f7" />
                                    </div>
                                </div>

                                {/* Ping & Jitter */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#12121f] rounded-2xl p-5 border border-green-500/10 hover:border-green-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                                            <span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Ping</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white">
                                                {isRunning || phase === "complete" ? results.ping : "---"}
                                            </span>
                                            <span className="text-gray-500 text-sm">ms</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#12121f] rounded-2xl p-5 border border-yellow-500/10 hover:border-yellow-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
                                            <span className="text-gray-400 font-medium uppercase tracking-wider text-xs">Jitter</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-white">
                                                {isRunning || phase === "complete" ? results.jitter : "---"}
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
                                                        {Math.max(3, Math.round(10 - (results.download / 100)))}s
                                                    </span>
                                                    <span className="text-green-400 text-sm">⚡ Lightning Fast</span>
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
