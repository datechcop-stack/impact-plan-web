import { test, expect } from "@playwright/test";

test("home page renders sign-in CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Impact Plan" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
