import { NextResponse, type NextRequest } from "next/server";

// The legacy admin uses insecure credentials and unauthenticated data APIs.
// Do not expose it on the unified domain until it has proper authentication.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (/^\/(?:admin|api\/admin)(?:\/|$)/i.test(path)) {
    return new NextResponse("Not found", { status: 404 });
  }
  // The public services do not need the browser's session credentials. Avoid
  // passing them to either upstream when requests cross service boundaries.
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
