"use client";

import { useEffect, useRef } from "react";
import { ExchangeWidget } from "@/components/exchange-widget";
import "./embed.css";

export default function EmbedPage() {
  const frame = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.parent === window) return;
    let parentOrigin: string;
    try { parentOrigin = new URL(document.referrer).origin; } catch { return; }
    if (!["https://plasmax.io", "https://www.plasmax.io"].includes(parentOrigin)) return;
    const notifySize = () => {
      const height = Math.ceil(frame.current?.scrollHeight || 0);
      if (height > 0) window.parent.postMessage({ type: "sparkexchange:resize", height }, parentOrigin);
    };
    const observer = new ResizeObserver(notifySize);
    if (frame.current) observer.observe(frame.current);
    notifySize();
    return () => observer.disconnect();
  }, []);

  return <main ref={frame} className="bg-background px-1 py-2 md:px-6 md:py-3">
    <ExchangeWidget compact />
  </main>;
}
