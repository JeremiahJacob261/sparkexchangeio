"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import createGlobe from "cobe";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";

// Marker interface
interface GlobeMarker {
    location: [number, number];
    size: number;
    city: string | null;
    country: string;
    countryCode: string;
    count: number;
}

// Country stats interface  
interface CountryStats {
    country: string;
    countryCode: string;
    visitorCount: number;
}

// Props interface
interface VisitorsGlobeProps {
    className?: string;
}

export default function VisitorsGlobe({ className = "" }: VisitorsGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

    const [markers, setMarkers] = useState<GlobeMarker[]>([]);
    const [countries, setCountries] = useState<CountryStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredMarker, setHoveredMarker] = useState<GlobeMarker | null>(null);
    const [phi, setPhi] = useState(0);
    const [theta, setTheta] = useState(0.3);
    const [isDragging, setIsDragging] = useState(false);
    const [currentCountryIndex, setCurrentCountryIndex] = useState(0);

    // Fetch visitor data
    const fetchVisitorData = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/admin/visitors');
            const data = await res.json();

            if (data.success) {
                setMarkers(data.data.markers || []);
                setCountries(data.data.countries || []);
            }
        } catch (error) {
            console.error('Failed to fetch visitor data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisitorData();
    }, [fetchVisitorData]);

    // Initialize globe
    useEffect(() => {
        if (!canvasRef.current) return;

        let width = 0;
        const onResize = () => {
            if (canvasRef.current) {
                width = canvasRef.current.offsetWidth;
            }
        };
        onResize();
        window.addEventListener('resize', onResize);

        // Convert markers to cobe format
        const cobeMarkers = markers.map(m => ({
            location: m.location,
            size: m.size
        }));

        globeRef.current = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: phi,
            theta: theta,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.1, 0.1, 0.12],
            markerColor: [0.92, 0.69, 0.03], // Gold color matching theme
            glowColor: [0.15, 0.15, 0.18],
            markers: cobeMarkers,
            onRender: (state) => {
                // Auto-rotate when not interacting
                if (!pointerInteracting.current && !isDragging) {
                    state.phi = phi + 0.003;
                    setPhi(state.phi);
                }
                state.theta = theta;
                state.width = width * 2;
                state.height = width * 2;
            }
        });

        return () => {
            globeRef.current?.destroy();
            window.removeEventListener('resize', onResize);
        };
    }, [markers, isDragging]);

    // Handle pointer events for rotation
    const handlePointerDown = (e: React.PointerEvent) => {
        pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
        setIsDragging(true);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grabbing';
        }
    };

    const handlePointerUp = () => {
        pointerInteracting.current = null;
        setIsDragging(false);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setPhi(phi + delta * 0.005);
        }

        // Check if hovering over a marker (simplified - in reality you'd need ray casting)
        // For now, we'll show the tooltip on the side
    };

    const handleWheel = (e: React.WheelEvent) => {
        setTheta(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, theta + e.deltaY * 0.001)));
    };

    // Navigate countries
    const nextCountry = () => {
        if (countries.length > 0) {
            setCurrentCountryIndex((prev) => (prev + 1) % countries.length);
        }
    };

    const prevCountry = () => {
        if (countries.length > 0) {
            setCurrentCountryIndex((prev) => (prev - 1 + countries.length) % countries.length);
        }
    };

    const currentCountry = countries[currentCountryIndex];

    return (
        <div className={`relative ${className}`}>
            {/* Globe Container */}
            <div className="relative w-full aspect-square max-w-[500px] mx-auto">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl" />

                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Globe className="w-12 h-12 text-primary animate-pulse" />
                            <span className="text-sm text-muted-foreground">Loading globe...</span>
                        </div>
                    </div>
                )}

                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab"
                    style={{
                        contain: 'layout paint size',
                        opacity: isLoading ? 0.3 : 1,
                        transition: 'opacity 0.5s ease'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerOut={handlePointerUp}
                    onPointerMove={handlePointerMove}
                    onWheel={handleWheel}
                />

                {/* Hover tooltip */}
                <AnimatePresence>
                    {hoveredMarker && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-white/10 rounded-lg px-4 py-2 shadow-xl z-20"
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="font-medium">{hoveredMarker.city || hoveredMarker.country}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>{hoveredMarker.count} visitor{hoveredMarker.count !== 1 ? 's' : ''}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats Panel */}
            {countries.length > 0 && (
                <div className="mt-6">
                    {/* Country Navigator */}
                    <div className="flex items-center justify-between bg-card/50 border border-white/10 rounded-xl p-4">
                        <button
                            onClick={prevCountry}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            disabled={countries.length <= 1}
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <div className="flex-1 text-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentCountryIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-2xl">
                                            {currentCountry?.countryCode && getFlagEmoji(currentCountry.countryCode)}
                                        </span>
                                        <span className="font-semibold text-lg">{currentCountry?.country}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-primary">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xl font-bold">{currentCountry?.visitorCount}</span>
                                        <span className="text-sm text-muted-foreground">visitor{currentCountry?.visitorCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={nextCountry}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                            disabled={countries.length <= 1}
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Country Progress Dots */}
                    {countries.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-3">
                            {countries.slice(0, 10).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentCountryIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentCountryIndex
                                            ? 'bg-primary w-4'
                                            : 'bg-white/20 hover:bg-white/40'
                                        }`}
                                />
                            ))}
                            {countries.length > 10 && (
                                <span className="text-xs text-muted-foreground ml-1">+{countries.length - 10}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && markers.length === 0 && (
                <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No visitor location data yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Location data will appear as visitors access the site
                    </p>
                </div>
            )}

            {/* Quick Stats */}
            {countries.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-card/30 border border-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">{countries.length}</div>
                        <div className="text-xs text-muted-foreground">Countries</div>
                    </div>
                    <div className="bg-card/30 border border-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-primary">{markers.length}</div>
                        <div className="text-xs text-muted-foreground">Cities</div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
