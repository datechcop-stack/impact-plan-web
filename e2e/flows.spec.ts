import { test, expect } from "@playwright/test";
import { inviteUser, uiLogin } from "./helpers";

test.describe("invite → activate", () => {
  test("admin invite and password activation lands on plan", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `e2e.invite.${stamp}@devafrique.com`;
    const { inviteToken } = await inviteUser(request, {
      fullName: `E2E Invite ${stamp}`,
      email,
    });

    await page.goto(`/activate/${inviteToken}`);
    await expect(page.getByRole("heading", { name: /Welcome,/i })).toBeVisible();
    await page.getByRole("button", { name: /Set a password/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();

    await expect(page.getByRole("heading", { name: /Set your password/i })).toBeVisible();
    await page.getByLabel("New password").fill("E2ePass1!");
    await page.getByLabel("Confirm password").fill("E2ePass1!");
    await page.getByRole("button", { name: /Activate account/i }).click();

    await expect(page).toHaveURL(/\/app\/plan/);
  });
});

test.describe("edit unlock", () => {
  test("staff requests edit and admin unlocks whole plan", async ({ page }) => {
    await uiLogin(page, "t.bello@devafrique.com", "StaffPass1!");
    await expect(page).toHaveURL(/\/app\/plan/);

    const requestButton = page.getByRole("button", { name: /Request edit access/i }).first();
    if (await requestButton.isVisible()) {
      await requestButton.click();
      await expect(page.getByRole("heading", { name: /Request edit access/i })).toBeVisible();
      await page.getByRole("button", { name: /The whole plan/i }).click();
      await page.getByLabel("Reason").fill("E2E unlock: need to update a project objective.");
      await page.getByRole("button", { name: /Send request/i }).click();
      await expect(page.getByRole("heading", { name: /Request edit access/i })).toBeHidden({
        timeout: 10_000,
      });

      await page.goto("/sign-in");
      await uiLogin(page, "admin@devafrique.com", "AdminPass1!");
      await expect(page).toHaveURL(/\/admin/);
      await page.goto("/admin/edit-requests");
      await expect(page.getByText(/Tunde Bello/i).first()).toBeVisible({ timeout: 10_000 });
      await page
        .getByRole("button", { name: /Unlock whole plan/i })
        .first()
        .click();
      await expect(page.getByText(/Nothing here|Tunde Bello/i).first()).toBeVisible({
        timeout: 10_000,
      });

      await page.goto("/sign-in");
      await uiLogin(page, "t.bello@devafrique.com", "StaffPass1!");
    }

    await expect(page).toHaveURL(/\/app\/plan/);
    await expect(
      page
        .getByRole("button", { name: /Save changes & notify admin/i })
        .or(page.getByText(/\+ Add another entry/i)),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("review chain", () => {
  test("PM projects queue and LM finalize page load for seeded IN_REVIEW plan", async ({
    page,
  }) => {
    await uiLogin(page, "t.bello@devafrique.com", "StaffPass1!");
    await page.goto("/app/projects");
    await expect(page.getByRole("heading", { name: /Projects I Manage/i })).toBeVisible();

    await page.goto("/app/people");
    await expect(page.getByRole("heading", { name: /People I Manage/i })).toBeVisible();
    await expect(page.getByText(/Amaka Obi/i).first()).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("link", { name: /Review & finalize|View plan|View/i })
      .first()
      .click();
    await expect(page.getByText(/Your overall comment|Finalize plan/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
