export type TVChannel = {
  name: string;
  url: string;
  group: string;
  logo: string;
  id: string;
  userAgent: string;
  referer: string;
};

// Same M3U metadata and URL handling used by our standalone IPTV player.
export function parseTVPlaylist(text: string, base: string): TVChannel[] {
  const channels: TVChannel[] = [];
  const byURL = new Map<string, TVChannel>();
  let info: Partial<TVChannel> = {};
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/).map(x => x.trim())) {
    if (line.startsWith('#EXTINF:')) {
      const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
      let quoted = false, comma = -1;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') quoted = !quoted;
        if (line[i] === ',' && !quoted) { comma = i; break; }
      }
      info = {
        name: (comma < 0 ? '' : line.slice(comma + 1).trim()) || attrs['tvg-name'] || 'Channel',
        logo: attrs['tvg-logo'] || '', group: attrs['group-title'] || '', id: attrs['tvg-id'] || '',
        userAgent: attrs['http-user-agent'] || '', referer: attrs['http-referrer'] || attrs['http-referer'] || '',
      };
    } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      info.userAgent = line.slice(line.indexOf('=') + 1);
    } else if (/^#EXTVLCOPT:http-referr?er=/.test(line)) {
      info.referer = line.slice(line.indexOf('=') + 1);
    } else if (line && !line.startsWith('#')) {
      if (/[<>]/.test(line) || (!info.name && !/^https?:\/\//i.test(line))) continue;
      try {
        const url = new URL(line, base);
        if (/^https?:$/.test(url.protocol)) {
          const existing = byURL.get(url.href);
          if (existing) existing.group = [...new Set([...existing.group.split(';'), ...(info.group || '').split(';')].filter(Boolean))].join(';');
          else {
            const channel = {name: info.name || 'Channel ' + (channels.length + 1), group: info.group || '', logo: info.logo || '', id: info.id || '', userAgent: info.userAgent || '', referer: info.referer || '', url: url.href};
            channels.push(channel); byURL.set(url.href, channel);
          }
        }
      } catch { /* Invalid or non-browser URLs do not become channel controls. */ }
      info = {};
    }
  }
  return channels;
}

export function tvStationKey(channel: TVChannel) {
  return channel.id ? channel.id.split('@')[0].toLowerCase() : 'name:' + channel.name.replace(/\[[^\]]*\]/g, '').replace(/\((?:\d+p|\d+x\d+|hd|sd|uhd|4k)\)/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function tvRelayURL(channel: TVChannel) {
  const params = new URLSearchParams({url: channel.url});
  if (channel.userAgent) params.set('ua', channel.userAgent);
  if (channel.referer) params.set('referrer', channel.referer);
  return '/api/stream?' + params;
}
