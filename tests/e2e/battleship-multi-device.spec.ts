import { test, expect } from "@playwright/test";

// TASK-0031's manual verification steps cover privacy (no ship data crosses
// the wire) and the disconnect/reconnect waiting state — those need real
// separate devices/network inspection to mean anything and are done by
// hand. This e2e test covers the part that's a straightforward regression
// risk: two real browser contexts (never sharing storage, unlike a same-tab
// dev-sandbox test) actually joining one room, placing fleets, and firing a
// shot end to end over real Supabase Realtime.
test("two players join a room, place fleets, and fire a shot in Battleship", async ({ browser }) => {
  test.setTimeout(60_000); // two full page loads + real Realtime round-trips, not a fixed budget worth tightening
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  try {
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    await hostPage.goto("/es");
    await hostPage.getByPlaceholder("Ej. Mateo, Sofía, Papá").fill("Host");
    await hostPage.getByRole("button", { name: "Crear nueva sala" }).click();

    const roomCode = await hostPage.locator(".font-mono.text-7xl").innerText();
    expect(roomCode).toMatch(/^[A-Z]{4}$/);

    await guestPage.goto("/es");
    await guestPage.getByPlaceholder("Ej. Mateo, Sofía, Papá").fill("Guest");
    // CodeInput's real <input> is visually hidden (sr-only) behind a row of
    // tiles — it has a label, not a placeholder.
    await guestPage.getByLabel("Código de Sala").fill(roomCode);
    await guestPage.getByRole("button", { name: "Unirse a sala" }).click();

    await expect(hostPage.getByText("Guest")).toBeVisible({ timeout: 15_000 });

    // The games list is an accordion (collapsed by default, one open at a
    // time) so it stays compact as more games are registered — the game's
    // own name is the header that expands it, revealing "Jugar este".
    await hostPage.getByRole("button", { name: "Batalla Naval" }).click();
    await hostPage.getByRole("button", { name: "Jugar este" }).click();

    await expect(hostPage.getByText("Coloca tu flota")).toBeVisible({ timeout: 15_000 });
    await expect(guestPage.getByText("Coloca tu flota")).toBeVisible({ timeout: 15_000 });

    for (const page of [hostPage, guestPage]) {
      await page.getByRole("button", { name: "Colocar al azar" }).click();
      await page.getByRole("button", { name: "¡Listo!" }).click();
    }

    await expect(hostPage.getByText("¡A hundir la flota!")).toBeVisible({ timeout: 15_000 });
    await expect(guestPage.getByText("¡A hundir la flota!")).toBeVisible({ timeout: 15_000 });

    // Whichever side moves first (fleet setup is randomized so ordering by
    // real turn isn't guaranteed to be the host) fires; the assertions
    // below only care that a shot resolves and the turn state converges on
    // both devices, not which side happened to go first.
    const [firstMover, secondMover] = (await hostPage.getByText("Tu turno").isVisible())
      ? [hostPage, guestPage]
      : [guestPage, hostPage];

    await firstMover.getByRole("button", { name: "A1" }).click();

    await expect(firstMover.getByText("Turno de tu rival")).toBeVisible({ timeout: 15_000 });
    await expect(secondMover.getByText("Tu turno")).toBeVisible({ timeout: 15_000 });
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
