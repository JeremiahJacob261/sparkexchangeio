import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [{ source: "/embed", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self' https://plasmax.io https://www.plasmax.io" }] }];
  },
};

export default nextConfig;
