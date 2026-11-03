function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";
  // Absolute URLs break cookie auth (cross-site SameSite=Lax). Always stay same-origin.
  if (/^https?:\/\//i.test(raw)) {
    return "/api/v1";
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

const API_URL = resolveApiBase();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function validationDetailsSummary(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const flat = details as {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
  const parts: string[] = [...(flat.formErrors ?? [])];
  for (const [field, messages] of Object.entries(flat.fieldErrors ?? {})) {
    if (messages?.length) {
      parts.push(`${field}: ${messages.join(", ")}`);
    }
  }
  if (parts.length === 0) return null;
  return parts.slice(0, 4).join(" · ");
}

export function messageFromErrorBody(body: unknown, status: number): string {
  if (!body || typeof body !== "object") {
    if (status === 502 || status === 503) {
      return "Could not reach the API. Check that the server is running.";
    }
    return "Request failed.";
  }

  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    const msg = record.message.trim();
    if (status === 404 && /^Route (GET|POST|PUT|PATCH|DELETE):\/v1\//i.test(msg)) {
      return `${msg} — Stop the old API on port 4000 and run \`pnpm dev\` in impact-plan-api (latest main). Check GET /v1/auth/csrf returns 200 and GET /health includes "apiVersion":2.`;
    }
    return msg;
  }

  const err = record.error;
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }

  if (err && typeof err === "object") {
    const envelope = err as { message?: unknown; details?: unknown; code?: string };
    const base =
      typeof envelope.message === "string" && envelope.message.trim()
        ? envelope.message.trim()
        : null;
    const detailText = validationDetailsSummary(envelope.details);
    if (base && detailText) return `${base} ${detailText}`;
    if (base) return base;
    if (detailText) return detailText;
  }

  if (status === 404) {
    return "API route not found. Check API_UPSTREAM_URL and that the API is running.";
  }
  return `Request failed (${status}).`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message && error.message !== "undefined" && error.message !== "Request failed.") {
      return error.message;
    }
    return messageFromErrorBody(error.body, error.status);
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return "Something went wrong.";
}

function readCsrfCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )ip_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

function redirectToSignIn(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (
    path.startsWith("/sign-in") ||
    path.startsWith("/activate") ||
    path.startsWith("/forgot-password")
  ) {
    return;
  }
  const next = `${path}${window.location.search}`;
  window.location.assign(`/sign-in?next=${encodeURIComponent(next)}`);
}

export async function ensureCsrf(): Promise<string> {
  const fromCookie = readCsrfCookie();
  if (fromCookie) {
    return fromCookie;
  }
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
  });
  if (response.status === 401) {
    redirectToSignIn();
  }
  const data = (await response.json()) as { csrfToken: string };
  return data.csrfToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET" && options.method !== "HEAD") {
    const token = await ensureCsrf();
    headers.set("x-csrf-token", token);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      redirectToSignIn();
    }
    const message = messageFromErrorBody(body, response.status);
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  role: "ADMIN" | "STAFF";
  authMethod: "UNSET" | "PASSWORD" | "OTP";
  status: "INVITED" | "ACTIVE" | "DISABLED";
  lineManagerId: string | null;
};
