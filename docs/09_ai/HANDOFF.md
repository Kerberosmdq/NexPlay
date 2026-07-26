# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0032
- **Title**: Language Switcher, Room-Code Share & Accessibility Pass (M3.5 code task 3b) — **closes M3.5**

## Current Branch
- `feat/lang-switcher-share-a11y`, branched off `main` after PR #37 (the M4
  planning docs) merged.

## What's in this task

M3.5's last open item, three small independent pieces bundled because the
original audit scoped them together, not because they depend on each other.

### 1. A real language switcher
`components/ui/LanguageSwitcher.tsx` (new): renders an ES/EN toggle using
`next-intl`'s locale-aware `useRouter()`/`usePathname()` (from `@/i18n/navigation`),
calling `router.replace(pathname, { locale })` — this app has no localized
pathnames configured (`routing.ts` only sets `locales`/`defaultLocale`), so
the plain string form of `replace` is correct; don't add a `pathnames` config
unless a future task actually needs distinct per-locale URL segments.

This retires every bilingual slash-separated label `TASK-0027`'s original
audit found in `RoomLobby.tsx` — `"¡ÚNETE AL JUEGO! / JOIN THE GAME!"`,
`"MULTIDISPOSITIVO"`'s English sibling, `"TU NOMBRE / NICKNAME"`, the join/
create button labels — replacing each with a real per-locale key in
`i18n/es.json`/`en.json`. While in there, several hardcoded Spanish defaults
that had **never** gone through the catalog at all (`"Anfitrión"`,
`"Jugador"`, `"Jugador 1"`, the invalid-code error text) were moved in too —
they were the same underlying gap (no switcher, so no reason to translate)
wearing a different disguise. `RoomLobby.tsx` now calls `useTranslations("Lobby")`
throughout; grep for `" / "` in `components/` turns up nothing user-facing
anymore (only code comments).

`Screen.tsx`'s `exitLabel` prop default was changed from the hardcoded
`"Salir"` to `"Exit"` — a neutral last-resort fallback for a generic
`components/ui/` primitive that (correctly, matching `Field`/`CodeInput`'s
existing pattern) takes labels as props rather than calling
`useTranslations` itself. The real caller, `app/[locale]/page.tsx`, now
passes `exitLabel={t("exitLabel")}` explicitly.

### 2. Room-code copy/share
`components/ui/ShareCode.tsx` (new), wired into `RoomWaitingLobby.tsx`:
copies the room code via `navigator.clipboard.writeText`, and additionally
offers `navigator.share` when the browser supports it (feature-detected the
same way `lib/hooks/useWakeLock.ts` detects the Wake Lock API — check, don't
assume). Shows "¡Copiado!" for 2 seconds after a successful copy, with an
`aria-live="polite"` status region for screen readers.

**Worth recording so nobody re-chases this:** during verification, the copy
button appeared not to update to "¡Copiado!" across several manual checks in
this session's browser-testing tool. Temporarily instrumenting the actual
handler with `console.log` (since removed) proved `setCopied(true)` fired
correctly on every click. Sampling the DOM every 50ms in a single in-page
loop then showed "¡Copiado!" was in fact rendered for the full 2-second
window — every earlier check had simply landed *after* that window closed,
because each separate tool round-trip (dispatch a click, then a separate
call to read the page) took longer than 2 seconds end-to-end on its own.
**Not a product bug.** If this resurfaces in a future verification, sample
state in a single script with a short in-page delay loop rather than
chaining separate tool calls with unknown latency between them.

### 3. Accessibility pass
- `components/ui/Button.tsx`: the existing `active` prop (already driving
  `RoomLobby`'s mode switcher and now the language toggle) now also sets
  `aria-pressed={active}` automatically. This was a real, previously-unnoticed
  gap — those controls behaved as toggles but read as plain buttons to a
  screen reader. Fixing it once in the primitive means every current and
  future toggle-style `Button` gets it for free, not just the two touched in
  this task. Verified live: `aria-pressed` correctly flips on both the mode
  switcher and the language switcher after a click.
- `RoomLobby.tsx`'s error banner and `RoomWaitingLobby.tsx`'s room-code
  display both got `aria-live` regions (`role="alert"`/`aria-live="assertive"`
  for the error, `aria-live="polite"` for the code) so they're announced
  without requiring the error/code to already have focus.
- Existing focus-visible states (`Button`, `Field` already had them from
  `TASK-0028`) and 44px+ tap targets (`Button`'s `min-h-14` = 56px) were
  spot-checked, not rebuilt — they were already correct.

## Files Modified / Added
- `components/ui/LanguageSwitcher.tsx` (new)
- `components/ui/ShareCode.tsx` (new)
- `components/ui/Button.tsx` (`aria-pressed` wiring)
- `components/ui/Screen.tsx` (`exitLabel` default)
- `components/ui/index.ts` (export the two new components)
- `components/platform/RoomLobby.tsx` (full i18n pass + switcher)
- `components/platform/RoomWaitingLobby.tsx` (`ShareCode` + `aria-live`)
- `app/[locale]/page.tsx` (`exitLabel={t("exitLabel")}`)
- `i18n/es.json`, `i18n/en.json` (new `Lobby.*` keys)
- `tests/e2e/locale-routing.spec.ts` (new switcher round-trip test)
- `docs/09_ai/tasks/TASK-0032-lang-switcher-share-a11y.md` (new)
- `docs/ROADMAP.md` (M3.5 marked ✅ Complete), `docs/09_ai/CURRENT_STATE.md`,
  this file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection on `main` (enforced for the founder too). Unchanged.

## Pending Tasks
- **`TASK-0031` (M4a)** — Battleship core 1 vs 1 + `ADR-0005` private state.
  This is now unambiguously next: M3.5 is fully complete, so `ROADMAP.md`'s
  ship-in-order rule no longer has an open caveat blocking M4. Read
  `ADR-0005` in full (especially §6, its honest limits) before starting.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item, independent of the above).
- M1's dedicated two-real-phones reconnection test (open since M1,
  independent of the above).
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice, once it exists — the latent leak `ADR-0005` documents is real but
  not urgent, and was deliberately kept out of `TASK-0031`'s scope.

## Next Suggested Task
- `TASK-0031` (M4a — Battleship core).
