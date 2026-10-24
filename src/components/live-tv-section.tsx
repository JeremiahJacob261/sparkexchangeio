"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Maximize, Search, Square, Star, Tv, Volume2 } from "lucide-react";
import type Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { tvRelayURL, tvStationKey, type TVChannel } from "@/lib/tv-playlist";
import styles from "./live-tv.module.css";

const FAVORITES_KEY = "sparkexchange-tv-favorites-v1";
const EMPTY_FAVORITES = "[]";
function subscribeFavorites(update: () => void) {
  window.addEventListener("storage", update);
  return () => window.removeEventListener("storage", update);
}
function favoriteSnapshot() {
  try { return localStorage.getItem(FAVORITES_KEY) || EMPTY_FAVORITES; } catch { return EMPTY_FAVORITES; }
}
function serverFavorites() { return EMPTY_FAVORITES; }

export function LiveTVSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);
  const userChosePlayback = useRef(false);
  const [muted, setMuted] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const [channels, setChannels] = useState<TVChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryVisible, setDirectoryVisible] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim().toLowerCase());
  const [category, setCategory] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const storedFavorites = useSyncExternalStore(subscribeFavorites, favoriteSnapshot, serverFavorites);
  const [sessionFavorites, setSessionFavorites] = useState<string[] | null>(null);
  const favorites = useMemo(() => {
    if (sessionFavorites) return new Set(sessionFavorites);
    try { const saved: unknown = JSON.parse(storedFavorites); return new Set(Array.isArray(saved) ? saved.filter((x): x is string => typeof x === "string") : []); }
    catch { return new Set<string>(); }
  }, [storedFavorites, sessionFavorites]);
  const [page, setPage] = useState(0);
  const [catalog, setCatalog] = useState({categories: [] as string[], total: 0, count: 0, page: 0});
  const favoritesKey = favoritesOnly ? JSON.stringify([...favorites].sort()) : "";
  const [selected, setSelected] = useState<TVChannel | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState("Select a channel to watch.");

  const loadChannels = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true); setDirectoryError("");
    try {
      const response = await fetch("/api/tv-channels?" + new URLSearchParams({q: search, category, page: String(page)}), {signal: controller.signal, ...(favoritesOnly ? {method: "POST", body: favoritesKey, headers: {"Content-Type": "application/json"}} : {})});
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error || "The channel directory could not load.");
      if (!Array.isArray(data.channels) || !Array.isArray(data.categories)) throw new Error("The channel directory returned an invalid response.");
      setChannels(data.channels);
      setCatalog({categories: data.categories, total: data.total, count: data.count, page: data.page});
      if (listRef.current) listRef.current.scrollTop = 0;
    } catch (error) {
      if (!controller.signal.aborted) setDirectoryError(error instanceof Error ? error.message : "Could not load channels. Please retry.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [search, category, page, favoritesOnly, favoritesKey]);

  useEffect(() => {
    // Keep the exchange landing page light: fetch the directory near the TV section.
    const section = sectionRef.current;
    let observer: IntersectionObserver | undefined;
    if (section && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); setDirectoryVisible(true); }
      }, {rootMargin: "300px"});
      observer.observe(section);
    } else { const timer = setTimeout(() => setDirectoryVisible(true), 0); return () => clearTimeout(timer); }
    return () => { observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (directoryVisible) void loadChannels();
    return () => requestRef.current?.abort();
  }, [directoryVisible, loadChannels]);

  // Preload the directory at 300px; start media only within 120px of the section.
  useEffect(() => {
    if (!channels.length || autoStarted.current || userChosePlayback.current) return;
    const section = sectionRef.current;
    if (!section) return;
    let near = false;
    let observer: IntersectionObserver | undefined;
    const attempt = () => {
      if (!near || document.hidden || autoStarted.current || userChosePlayback.current) return;
      autoStarted.current = true;
      if (videoRef.current) videoRef.current.muted = true;
      setMuted(true);
      setSelected({...channels[0]});
      setPlaybackStatus("Starting " + channels[0].name + " with sound muted…");
      observer?.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
    const checkPosition = () => {
      const rect = section.getBoundingClientRect();
      near = rect.top <= window.innerHeight + 120 && rect.bottom >= 0;
      attempt();
    };
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => { near = entries.some(entry => entry.isIntersecting); attempt(); }, {rootMargin: "120px"});
      observer.observe(section);
    } else {
      window.addEventListener("scroll", checkPosition, {passive: true});
      window.addEventListener("resize", checkPosition);
      checkPosition();
    }
    const onVisible = () => { if (observer) attempt(); else checkPosition(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [channels]);

  const categories = catalog.categories;

  useEffect(() => {
    const video = videoRef.current;
    if (!selected || !video) return;
    let disposed = false, connection = 0, hls: Hls | undefined;
    let feed = selected, relayed = requiresRelay(feed), fallbackBusy = false, recovered = false;
    const tried = new Set([selected.url]);
    let candidates: TVChannel[] | undefined;
    const alternativesRequest = new AbortController();
    function requiresRelay(channel: TVChannel) { return channel.url.startsWith("http:") || Boolean(channel.userAgent || channel.referer); }
    function current(epoch: number) { return !disposed && connection === epoch; }
    function clearMedia() {
      video!.onerror = null; video!.onplaying = null;
      hls?.destroy(); hls = undefined;
      video!.pause(); video!.removeAttribute("src"); video!.load();
    }
    async function fallback(epoch: number) {
      if (!current(epoch) || fallbackBusy) return;
      fallbackBusy = true;
      if (!relayed) { relayed = true; setPlaybackStatus("Retrying through the media relay…"); await connect(); return; }
      if (!candidates) {
        try {
          const response = await fetch("/api/tv-channels?" + new URLSearchParams({station: tvStationKey(selected!)}), {signal: alternativesRequest.signal});
          const data = await response.json();
          candidates = response.ok && Array.isArray(data.channels) ? data.channels : [];
        } catch { candidates = []; }
      }
      if (!current(epoch)) return;
      const next = candidates!.find(channel => !tried.has(channel.url));
      if (next && tried.size < 3) {
        feed = next; tried.add(feed.url); relayed = requiresRelay(feed);
        setPlaybackStatus("Trying another public feed of this channel…"); await connect(); return;
      }
      clearMedia();
      setPlaybackStatus("This channel is offline, restricted, or unavailable from this region. Try another channel.");
    }
    async function connect() {
      if (disposed) return;
      const epoch = ++connection;
      fallbackBusy = false; recovered = false; clearMedia();
      const start = () => {
        if (!current(epoch)) return;
        void video!.play().catch(error => {
          if (!current(epoch) || error.name === "AbortError") return;
          if (error.name === "NotAllowedError") setPlaybackStatus("Press Play in the video controls to start watching.");
          else void fallback(epoch);
        });
      };
      video!.onplaying = () => { if (current(epoch)) setPlaybackStatus(tried.size > 1 ? "Playing an alternative public feed." : "Playing live."); };
      const source = relayed ? tvRelayURL(feed) : feed.url;
      const isHLS = !/\.(?:mp4|mp3|aac|webm|ogg|mov|ts)(?:[?#]|$)/i.test(feed.url);
      try {
        if (isHLS && !video!.canPlayType("application/vnd.apple.mpegurl")) {
          const {default: HlsPlayer} = await import("hls.js");
          if (!current(epoch)) return;
          if (!HlsPlayer.isSupported()) { setPlaybackStatus("This browser cannot play this stream format. Try another channel or browser."); return; }
          hls = new HlsPlayer({capLevelToPlayerSize: true, maxBufferLength: 28, maxMaxBufferLength: 30, backBufferLength: 10, manifestLoadingTimeOut: 15000, fragLoadingTimeOut: 20000, manifestLoadingMaxRetry: 0, levelLoadingMaxRetry: 1, fragLoadingMaxRetry: 1});
          hls.on(HlsPlayer.Events.MANIFEST_PARSED, start);
          hls.on(HlsPlayer.Events.ERROR, (_, data) => {
            if (!current(epoch) || !data.fatal) return;
            if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls?.recoverMediaError(); return; }
            void fallback(epoch);
          });
          hls.loadSource(source); hls.attachMedia(video!);
        } else { video!.onerror = () => { void fallback(epoch); }; video!.src = source; start(); }
      } catch { if (current(epoch)) { clearMedia(); setPlaybackStatus("The video player could not start. Select the channel again to retry."); } }
    }
    void connect();
    return () => { disposed = true; ++connection; alternativesRequest.abort(); clearMedia(); };
  }, [selected]);

  function choose(channel: TVChannel) {
    userChosePlayback.current = true;
    // A fresh object permits retrying the currently selected channel.
    setSelected({...channel}); setPlaybackStatus("Connecting to " + channel.name + "…");
    if (window.matchMedia("(max-width: 900px)").matches) videoRef.current?.scrollIntoView({block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  }
  function toggleFavorite(channel: TVChannel) {
    const next = new Set(favorites);
    if (next.has(channel.url)) next.delete(channel.url); else next.add(channel.url);
    const saved = [...next]; setSessionFavorites(saved);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(saved)); } catch { /* Favorites still work for this visit. */ }
  }
  async function fullScreen() {
    const video = videoRef.current as (HTMLVideoElement & {webkitEnterFullscreen?: () => void}) | null;
    try {
      if (video?.requestFullscreen) await video.requestFullscreen();
      else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else setPlaybackStatus("Use the video's full-screen control to expand it.");
    } catch { setPlaybackStatus("Use the video's full-screen control to expand it."); }
  }

  return (
    <section id="live-tv" ref={sectionRef} className={styles.section} aria-labelledby="live-tv-heading">
      <div className="container mx-auto px-4">
        <div className={styles.heading}>
          <div>
            <h2 id="live-tv-heading" className="text-3xl md:text-4xl font-bold mb-4">Live TV on <span className="text-primary">SparkExchange</span></h2>
            <p className="text-lg text-muted-foreground">Find a channel, settle in, and watch right here.</p>
          </div>
          <a href="https://free-iptv-player-sigma.vercel.app/iptv-player/" target="_blank" rel="noopener noreferrer" className={styles.fullPlayer}>Open full IPTV player <span className="sr-only">(opens in a new tab)</span></a>
        </div>
        <p className={styles.directoryStatus} role="status">
          {loading ? "Loading channels…" : directoryError || `${catalog.total.toLocaleString()} channels loaded. Select a channel to watch.`}
        </p>
        {directoryError ? <Button type="button" variant="outline" className="mb-6 min-h-11" onClick={() => void loadChannels()}>Retry loading channels</Button> : null}
        <div className={styles.player} aria-label="Live TV player">
          <aside className={styles.sidebar} aria-label="Channel browser" aria-busy={loading}>
            <label htmlFor="tv-search" className="sr-only">Filter channels</label>
            <div className={styles.search}>
              <Search aria-hidden="true" size={20} />
              <input id="tv-search" type="search" placeholder="Filter channels" value={query} onChange={event => {setQuery(event.target.value); setPage(0);}} />
            </div>
            <label className={styles.favoriteFilter}>
              <input type="checkbox" checked={favoritesOnly} onChange={event => {setFavoritesOnly(event.target.checked); setPage(0);}} /> Favorite channels
            </label>
            <label htmlFor="tv-category" className="sr-only">Channel category</label>
            <select id="tv-category" value={category} onChange={event => {setCategory(event.target.value); setPage(0);}}>
              <option value="">All channels</option>
              {categories.map(group => <option key={group} value={group}>{group}</option>)}
            </select>
            <p className={styles.count}>{catalog.count.toLocaleString()} channels</p>
            <div ref={listRef} className={styles.channelList}>
              {channels.map(channel => (
                <div key={channel.url} className={`${styles.channelRow} ${selected?.url === channel.url ? styles.active : ""}`}>
                  <button type="button" className={styles.channelPlay} onClick={() => choose(channel)} aria-pressed={selected?.url === channel.url}>
                    {/^https?:\/\//i.test(channel.logo) ? (
                      // Playlist logos use many provider hosts and cannot be enumerated in next/image config.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={channel.logo} alt="" loading="lazy" width={36} height={32} onError={event => {event.currentTarget.style.visibility = "hidden";}} />
                    ) : <Tv size={28} aria-hidden="true" />}
                    <span>{channel.name}</span>
                  </button>
                  <button type="button" className={styles.favoriteButton} aria-label={`${favorites.has(channel.url) ? "Remove from" : "Add to"} favorites: ${channel.name}`} aria-pressed={favorites.has(channel.url)} onClick={() => toggleFavorite(channel)}><Star size={20} aria-hidden="true" fill={favorites.has(channel.url) ? "currentColor" : "none"} /></button>
                </div>
              ))}
              {!loading && !channels.length ? <p className={styles.empty}>{directoryError ? "Retry loading the directory to browse channels." : favoritesOnly ? "No favorite channels match. Star a channel to save it here." : "No channels match your filters."}</p> : null}
            </div>
            <div className={styles.pagination}>
              {catalog.page > 0 ? <Button type="button" variant="outline" disabled={loading} onClick={() => setPage(Math.max(0, catalog.page - 1))}>Previous</Button> : null}
              {(catalog.page + 1) * 100 < catalog.count ? <Button type="button" variant="outline" disabled={loading} onClick={() => setPage(catalog.page + 1)}><ChevronDown aria-hidden="true" /> Next channels</Button> : null}
            </div>
            {catalog.count > 0 ? <p className={styles.count}>Showing {catalog.page * 100 + 1}–{catalog.page * 100 + channels.length} of {catalog.count.toLocaleString()}</p> : null}
          </aside>
          <div className={styles.videoPane}>
            <div className={styles.videoFrame}>
              <video ref={videoRef} onVolumeChange={event => setMuted(event.currentTarget.muted)} controls playsInline preload="none" aria-label={selected ? `Live TV: ${selected.name}` : "Live TV video player"} />
              {!selected ? <div className={styles.videoPlaceholder} aria-hidden="true"><Tv size={44} /><span>Select a channel to watch</span></div> : null}
            </div>
            <div className={styles.caption}>
              <p>{selected?.name || "Select a channel to watch"}</p>
              <div className={styles.playbackActions}>
                {muted ? <Button type="button" variant="outline" className="min-h-11" onClick={() => {if (videoRef.current) videoRef.current.muted = false; setMuted(false);}}><Volume2 aria-hidden="true" /> Enable sound</Button> : null}
                <Button type="button" variant="outline" className="min-h-11" onClick={() => void fullScreen()}><Maximize aria-hidden="true" /> Full screen</Button>
                <Button type="button" className="min-h-11 bg-primary text-black hover:bg-primary/90" disabled={!selected} onClick={() => {userChosePlayback.current = true; setSelected(null); setPlaybackStatus("Playback stopped. Select a channel to watch.");}}><Square aria-hidden="true" /> Stop</Button>
              </div>
            </div>
            <p className={styles.playbackStatus} role="status">{playbackStatus}</p>
            <p className={styles.sourceNote}>Public channels supplied by IPTV-org. Availability depends on the broadcaster and your region.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
