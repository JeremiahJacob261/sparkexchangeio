"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type Ref } from 'react';
const TV = dynamic(() => import('./live-tv-section').then(module => module.LiveTVSection), {loading: () => <Placeholder kind="tv" />});
const Speedtest = dynamic(() => import('./speedtest-section').then(module => module.SpeedtestSection), {loading: () => <Placeholder kind="speedtest" />});

function Placeholder({kind, observeRef}: {kind: 'tv' | 'speedtest'; observeRef?: Ref<HTMLDivElement>}) {
  return <div ref={observeRef} id={kind === 'tv' ? 'live-tv' : 'speedtest'} style={{minHeight: kind === 'tv' ? 960 : 900, scrollMarginTop: 88}} aria-label={kind === 'tv' ? 'Live TV' : 'Internet speed test'} />;
}

export function DeferredLandingSection({kind}: {kind: 'tv' | 'speedtest'}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (!("IntersectionObserver" in window)) { const timer = setTimeout(() => setReady(true), 0); return () => clearTimeout(timer); }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); setReady(true); }
    }, {rootMargin: '300px'});
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ready ? (kind === 'tv' ? <TV /> : <Speedtest />) : (
    <Placeholder kind={kind} observeRef={ref} />
  );
}
