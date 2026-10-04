import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Upstream API origin only — no /api or /v1 suffix. */
function apiOrigin(): string {
  const raw = (
    process.env.API_UPSTREAM_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/+$/, "");
  return raw.replace(/\/api(?:\/v1)?$/i, "");
}

function collectSetCookies(headers: IncomingMessage["headers"]): string[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Rebuild Set-Cookie for the web origin.
 * Drops Domain (must be host-only on Vercel), forces SameSite=Lax,
 * and Secure when the browser request is HTTPS.
 */
function rewriteCookieForWeb(raw: string, secure: boolean): string | null {
  const parts = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const nameValue = parts[0];
  if (!nameValue || !nameValue.includes("=")) return null;

  let httpOnly = false;
  let maxAge: number | undefined;
  let expires: string | undefined;

  for (const attr of parts.slice(1)) {
    const sep = attr.indexOf("=");
    const key = (sep === -1 ? attr : attr.slice(0, sep)).trim().toLowerCase();
    const val = sep === -1 ? undefined : attr.slice(sep + 1).trim();

    if (key === "httponly") httpOnly = true;
    else if (key === "max-age" && val && Number.isFinite(Number(val))) maxAge = Number(val);
    else if (key === "expires" && val) expires = val;
  }

  const out = [`${nameValue}`, "Path=/", "SameSite=Lax"];
  if (httpOnly) out.push("HttpOnly");
  if (secure) out.push("Secure");
  if (maxAge != null) out.push(`Max-Age=${maxAge}`);
  else if (expires) out.push(`Expires=${expires}`);
  return out.join("; ");
}

function upstreamRequest(
  target: URL,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: Buffer;
  },
): Promise<{ statusCode: number; headers: IncomingMessage["headers"]; body: Buffer }> {
  const transport = target.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = transport(
      target,
      {
        method: options.method,
        headers: {
          ...options.headers,
          ...(options.body ? { "content-length": String(options.body.length) } : {}),
          accept: options.headers.accept ?? "application/json",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 502,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = new URL(`${apiOrigin()}/v1/${path.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers: Record<string, string> = {};
  const cookie =
    request.headers.get("cookie") ??
    request.cookies
      .getAll()
      .map((entry) => `${entry.name}=${entry.value}`)
      .join("; ");
  if (cookie) headers.cookie = cookie;

  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const csrf = request.headers.get("x-csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;

  const accept = request.headers.get("accept");
  if (accept) headers.accept = accept;

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined;

  // Node http(s) — not Next's patched fetch — so Cookie is never stripped.
  const upstream = await upstreamRequest(targetUrl, { method, headers, body });

  const secure = request.nextUrl.protocol === "https:";
  const headerPairs: [string, string][] = [
    ["content-type", String(upstream.headers["content-type"] ?? "application/json; charset=utf-8")],
    ["cache-control", "no-store"],
  ];

  for (const raw of collectSetCookies(upstream.headers)) {
    const rewritten = rewriteCookieForWeb(raw, secure);
    if (rewritten) headerPairs.push(["set-cookie", rewritten]);
  }

  return new Response(new Uint8Array(upstream.body), {
    status: upstream.statusCode,
    headers: headerPairs,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
