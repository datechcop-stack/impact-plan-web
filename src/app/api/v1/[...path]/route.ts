import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upstream API origin only — no /api or /v1 suffix. */
function apiOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  return raw.replace(/\/api(?:\/v1)?$/i, "");
}

type SameSite = "lax" | "strict" | "none";

function applySetCookie(response: NextResponse, raw: string): void {
  const parts = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const nameValue = parts[0];
  if (!nameValue) return;

  const eq = nameValue.indexOf("=");
  if (eq <= 0) return;

  const name = nameValue.slice(0, eq);
  const value = nameValue.slice(eq + 1);
  const options: {
    httpOnly?: boolean;
    secure?: boolean;
    path?: string;
    sameSite?: SameSite;
    expires?: Date;
    maxAge?: number;
  } = {};

  for (const attr of parts.slice(1)) {
    const sep = attr.indexOf("=");
    const key = (sep === -1 ? attr : attr.slice(0, sep)).trim().toLowerCase();
    const val = sep === -1 ? undefined : attr.slice(sep + 1).trim();

    if (key === "httponly") options.httpOnly = true;
    else if (key === "secure") options.secure = true;
    else if (key === "path" && val) options.path = val;
    else if (key === "samesite" && val) {
      const sameSite = val.toLowerCase();
      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        options.sameSite = sameSite;
      }
    } else if (key === "expires" && val) {
      const expires = new Date(val);
      if (!Number.isNaN(expires.getTime())) options.expires = expires;
    } else if (key === "max-age" && val) {
      const maxAge = Number(val);
      if (Number.isFinite(maxAge)) options.maxAge = maxAge;
    }
  }

  // Always scope cookies to the web origin via the BFF (never forward Domain).
  response.cookies.set(name, value, {
    ...options,
    path: options.path ?? "/",
  });
}

function upstreamSetCookies(upstream: Response): string[] {
  if (typeof upstream.headers.getSetCookie === "function") {
    return upstream.headers.getSetCookie();
  }
  const single = upstream.headers.get("set-cookie");
  return single ? [single] : [];
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const target = new URL(`${apiOrigin()}/v1/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const csrf = request.headers.get("x-csrf-token");
  if (csrf) headers.set("x-csrf-token", csrf);

  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const body = await upstream.arrayBuffer();

  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });

  for (const setCookie of upstreamSetCookies(upstream)) {
    applySetCookie(response, setCookie);
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
