import { tvPage } from '@/lib/tv-catalog';

async function pageResponse(request: Request, favoriteURLs?: string[]) {
  try {
    const data = await tvPage(new URL(request.url).searchParams, favoriteURLs);
    return Response.json(data, {headers: {
      'Cache-Control': favoriteURLs ? 'private, no-store' : 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    }});
  } catch {
    return Response.json({error: 'The channel directory is temporarily unavailable. Please retry.'}, {status: 502, headers: {'Cache-Control': 'no-store'}});
  }
}

export async function GET(request: Request) { return pageResponse(request); }

// Favorites are browser-local; POST keeps their URLs out of shared CDN cache keys.
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 131072) return Response.json({error: 'The favorites list is too large.'}, {status: 413});
  try {
    const body = await request.text();
    if (body.length > 131072) return Response.json({error: 'The favorites list is too large.'}, {status: 413});
    const data: unknown = JSON.parse(body);
    if (!Array.isArray(data) || data.length > 1000 || data.some(url => typeof url !== 'string' || url.length > 4096)) return Response.json({error: 'Invalid favorites list.'}, {status: 400});
    return pageResponse(request, data);
  } catch { return Response.json({error: 'Invalid favorites list.'}, {status: 400}); }
}
