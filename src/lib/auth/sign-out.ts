import { apiFetch, ensureCsrf } from "@/lib/api/client";

export async function signOut(): Promise<void> {
  await ensureCsrf();
  await apiFetch("/auth/logout", { method: "POST", json: {} });
  window.location.assign("/sign-in");
}
