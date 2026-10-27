export const runtime = 'nodejs';
export const maxDuration = 60;

// The existing relay validates public DNS/IPs and media, and rewrites HLS child URLs.
// Forward only media parameters and Range, never Sparkexchange cookies or authorization.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get('url');
  if (!source) return Response.json({error: 'A channel URL is required.'}, {status: 400});
  const upstreamURL = new URL('https://free-iptv-player-sigma.vercel.app/api/stream');
  for (const key of ['url', 'ua', 'referrer']) {
    const value = params.get(key);
    if (value) upstreamURL.searchParams.set(key, value);
  }
  try {
    const headers = new Headers();
    const range = request.headers.get('range');
    if (range) headers.set('Range', range);
    const response = await fetch(upstreamURL, {headers, cache: 'no-store', signal: request.signal, redirect: 'error'});
    const resultHeaders = new Headers({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
    for (const key of ['content-type', 'content-range', 'accept-ranges']) {
      const value = response.headers.get(key);
      if (value) resultHeaders.set(key, value);
    }
    return new Response(response.body, {status: response.status, headers: resultHeaders});
  } catch {
    return Response.json({error: 'The media relay is temporarily unavailable. Try another channel.'}, {status: 502});
  }
}
