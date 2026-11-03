import type { NextConfig } from "next";

// Keep each existing service deployed independently. Only the public exchange
// APIs are forwarded to SparkExchange; IPTV endpoints stay with the player.
const player = "https://free-iptv-player-sigma.vercel.app";
const exchange = "https://www.sparkexchange.io";
const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/iptv", destination: `${player}/iptv-player/` },
        { source: "/api/changenow/:path*", destination: `${exchange}/api/changenow/:path*` },
        { source: "/api/stealthex/:path*", destination: `${exchange}/api/stealthex/:path*` },
        { source: "/api/settings/:path*", destination: `${exchange}/api/settings/:path*` },
        { source: "/api/contact", destination: `${exchange}/api/contact` },
        { source: "/api/track-visit", destination: `${exchange}/api/track-visit` },
      ],
      fallback: [{ source: "/:path*", destination: `${player}/:path*` }],
    };
  },
};

export default nextConfig;
