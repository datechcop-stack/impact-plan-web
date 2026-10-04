import type { NextConfig } from "next";

/** Upstream API origin only — no /api or /v1 suffix. */
function apiOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  return raw.replace(/\/api(?:\/v1)?$/i, "");
}

const apiUrl = apiOrigin();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Browser: /api/v1/auth/login → API: {origin}/v1/auth/login
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
