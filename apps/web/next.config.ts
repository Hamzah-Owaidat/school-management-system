import type { NextConfig } from "next";

// Locally the API runs on its own port; the web app forwards /api to it so the
// browser only ever talks to one origin (same as Caddy in production).
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
