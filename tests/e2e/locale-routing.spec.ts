import { test, expect } from "@playwright/test";

test("serves English at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "NexPlay" })).toBeVisible();
});

test("serves Spanish at /es", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "NexPlay" })).toBeVisible();
});

test("language switcher navigates between locales and re-renders visible text", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByText("¡Únete al juego!")).toBeVisible();

  await page.getByRole("button", { name: "Inglés" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByText("Join the game!")).toBeVisible();

  await page.getByRole("button", { name: "Spanish" }).click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByText("¡Únete al juego!")).toBeVisible();
});
