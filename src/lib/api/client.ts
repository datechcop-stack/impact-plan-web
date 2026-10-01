const API_URL = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

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

let csrfToken: string | null = null;

export async function ensureCsrf(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
  });
  const data = (await response.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
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
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: { message: string } }).error.message)
        : "Request failed";
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
