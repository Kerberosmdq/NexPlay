import { test, expect } from "@playwright/test";

test("serves English at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "NexPlay" })).toBeVisible();
});

test("serves Spanish at /es", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "NexPlay" })).toBeVisible();
});
