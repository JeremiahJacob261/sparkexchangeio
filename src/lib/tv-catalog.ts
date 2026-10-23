import { parseTVPlaylist, tvStationKey, type TVChannel } from './tv-playlist';

type Catalog = {channels: TVChannel[]; categories: string[]; index: {channel: TVChannel; name: string; groups: string[]; station: string}[]};
let cached: {value: Catalog; expires: number} | undefined;
let pending: Promise<Catalog> | undefined;

export async function tvCatalog(): Promise<Catalog> {
  if (cached && cached.expires > Date.now()) return cached.value;
  if (!pending) pending = (async () => {
    const source = 'https://iptv-org.github.io/iptv/index.category.m3u';
    const response = await fetch('https://free-iptv-player-sigma.vercel.app/api/playlist?url=' + encodeURIComponent(source), {
      cache: 'no-store', signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    if (!response.ok) throw new Error('The channel directory is temporarily unavailable. Please retry.');
    const data = await response.json();
    if (typeof data.text !== 'string' || typeof data.url !== 'string') throw new Error('The channel directory returned an invalid response.');
    const channels = parseTVPlaylist(data.text, data.url);
    if (!channels.length) throw new Error('No channels were returned. Please retry.');
    const index = channels.map(channel => ({channel, name: channel.name.toLowerCase(), groups: channel.group.split(';'), station: tvStationKey(channel)}));
    const categories = [...new Set(index.flatMap(row => row.groups).filter(Boolean))].sort();
    const value = {channels, categories, index};
    cached = {value, expires: Date.now() + 300000};
    return value;
  })().finally(() => { pending = undefined; });
  return pending;
}

export async function tvPage(params: URLSearchParams, favoriteURLs?: string[]) {
  const catalog = await tvCatalog();
  const query = (params.get('q') || '').trim().toLowerCase().slice(0, 120);
  const category = params.get('category') || '';
  const station = params.get('station') || '';
  const requested = Math.max(0, Math.min(100000, Number.parseInt(params.get('page') || '0', 10) || 0));
  const favorites = favoriteURLs ? new Set(favoriteURLs) : null;
  const rows = catalog.index.filter(row => (!query || row.name.includes(query)) && (!category || row.groups.includes(category)) && (!station || row.station === station) && (!favorites || favorites.has(row.channel.url)));
  const page = Math.min(requested, Math.max(0, Math.ceil(rows.length / 100) - 1));
  return {channels: rows.slice(page * 100, (page + 1) * 100).map(row => row.channel), categories: catalog.categories, total: catalog.channels.length, count: rows.length, page, pageSize: 100};
}
