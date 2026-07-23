import { test, expect } from "@playwright/test";

test("serves English at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Platform foundations are being built.", { exact: false })).toBeVisible();
});

test("serves Spanish at /es", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByText("Estamos construyendo la base", { exact: false })).toBeVisible();
});
