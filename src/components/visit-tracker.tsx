"use client";
import { useEffect } from "react";
export function VisitTracker() {
  useEffect(() => { void fetch('/api/track-visit', {method: 'POST'}).catch(() => {}); }, []);
  return null;
}
