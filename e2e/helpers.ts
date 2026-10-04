import type { APIRequestContext, Page } from "@playwright/test";

async function getCsrf(request: APIRequestContext): Promise<string> {
  const response = await request.get("/api/auth/csrf");
  const body = (await response.json()) as { csrfToken: string };
  return body.csrfToken;
}

export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const csrf = await getCsrf(request);
  const response = await request.post("/api/auth/login", {
    headers: { "x-csrf-token": csrf },
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${await response.text()}`);
  }
}

export async function apiLogout(request: APIRequestContext): Promise<void> {
  const csrf = await getCsrf(request);
  await request.post("/api/auth/logout", {
    headers: { "x-csrf-token": csrf },
    data: {},
  });
}

export async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

export async function inviteUser(
  request: APIRequestContext,
  input: { fullName: string; email: string; jobTitle?: string },
): Promise<{ inviteToken: string; userId: string }> {
  await apiLogin(request, "admin@devafrique.com", "AdminPass1!");
  const csrf = await getCsrf(request);
  const response = await request.post("/api/admin/users", {
    headers: { "x-csrf-token": csrf },
    data: {
      fullName: input.fullName,
      email: input.email,
      jobTitle: input.jobTitle ?? "E2E Analyst",
      role: "STAFF",
      remindCreatePlan: false,
    },
  });
  if (!response.ok()) {
    throw new Error(`Invite failed: ${response.status()} ${await response.text()}`);
  }
  const body = (await response.json()) as {
    user: { id: string };
    inviteToken?: string;
  };
  if (!body.inviteToken) {
    throw new Error("inviteToken missing — set EXPOSE_DEV_SECRETS=true on the API for e2e");
  }
  return { inviteToken: body.inviteToken, userId: body.user.id };
}
