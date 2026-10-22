// Reuse the existing public IPTV service; no exchange cookies or credentials are forwarded.
export async function GET() {
  try {
    const source = 'https://iptv-org.github.io/iptv/index.category.m3u';
    const response = await fetch('https://free-iptv-player-sigma.vercel.app/api/playlist?url=' + encodeURIComponent(source), {
      next: {revalidate: 300}, signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    return new Response(response.body, {
      status: response.status,
      headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': response.ok ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store', 'X-Content-Type-Options': 'nosniff'},
    });
  } catch {
    return Response.json({error: 'The channel directory is temporarily unavailable. Please retry.'}, {status: 502});
  }
}
