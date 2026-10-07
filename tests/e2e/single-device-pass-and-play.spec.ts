import { test, expect } from "@playwright/test";

// TASK-0039: single-device pass-and-play can't skip a player, remembers the
// family's names, and offers one way back plus one way out.
test("Impostor pass-and-play gates each reveal and remembers names", async ({ page }) => {
  await page.goto("/es");

  await page.getByRole("button", { name: "Un teléfono" }).click();
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Empezar con un teléfono" }).click();

  // Every game is listed, including the ones that need several phones.
  await expect(page.getByText("Necesita varios teléfonos")).toBeVisible();

  // How to play opens and closes.
  await page.getByRole("button", { name: "¿Cómo se juega?" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Entendido" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("button", { name: "Jugar este" }).first().click();

  // The entry-screen name is prefilled; no red error before typing.
  const nameInputs = page.getByPlaceholder(/Jugador \d/);
  await expect(nameInputs.first()).toHaveValue("Ana");
  await expect(page.getByRole("button", { name: "¡Empezar!" })).toBeDisabled();
  await nameInputs.nth(1).fill("Leo");
  await nameInputs.nth(2).fill("Papá");
  await page.getByRole("button", { name: "¡Empezar!" }).click();

  // Handoff screen first, then the reveal; "next" stays locked until seen.
  await page.getByRole("button", { name: "Soy Ana" }).click();
  const next = page.getByRole("button", { name: "Ya lo vi · le toca a Leo" });
  await expect(next).toBeDisabled();
  // A handle, not a locator: the card's text (its accessible name) changes
  // while it's held open, so a name-based locator would lose it mid-press.
  const card = await page.getByRole("button", { name: /Mantené apretado/ }).elementHandle();
  await card!.dispatchEvent("pointerdown");
  await card!.dispatchEvent("pointerup");
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("button", { name: "Soy Leo" })).toBeVisible();

  // Finish the reveals; the shared discussion screen must show the same
  // tip whoever speaks — the impostor's tip would out them to the table.
  for (const [name, nextLabel] of [
    ["Leo", "Ya lo vi · le toca a Papá"],
    ["Papá", "Ya lo vi · empezar a hablar"],
  ]) {
    await page.getByRole("button", { name: `Soy ${name}` }).click();
    const nextCard = await page.getByRole("button", { name: /Mantené apretado/ }).elementHandle();
    await nextCard!.dispatchEvent("pointerdown");
    await nextCard!.dispatchEvent("pointerup");
    await page.getByRole("button", { name: nextLabel }).click();
  }
  for (let turn = 0; turn < 3; turn++) {
    await expect(page.getByText("Decí una palabra relacionada con la palabra secreta, sin decirla.")).toBeVisible();
    await expect(page.getByText("¡Hacé como que sabés la palabra!", { exact: false })).toHaveCount(0);
    await page.getByRole("button", { name: "Ya dije mi palabra" }).click();
  }

  // One way back to the games list, in the top bar.
  await page.getByRole("button", { name: "Volver a la lista de juegos" }).click();
  await page.getByRole("button", { name: "Jugar este" }).first().click();

  // Names entered last game are remembered.
  await expect(page.getByPlaceholder(/Jugador \d/).nth(1)).toHaveValue("Leo");
  await expect(page.getByPlaceholder(/Jugador \d/).nth(2)).toHaveValue("Papá");
});
