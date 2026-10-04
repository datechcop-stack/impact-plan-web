import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API traffic goes through src/app/api/v1/[...path]/route.ts so Set-Cookie
  // (session + CSRF) is forwarded correctly. Do not rely on rewrites for auth.
};

export default nextConfig;
