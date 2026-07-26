# TASK-0032: Language Switcher, Room-Code Share & Accessibility Pass

### Goal
Ship M3.5's code task 3b (`docs/ROADMAP.md`) — the last item before M4a
starts. Three small, independent polish items bundled because they were
scoped together in the original audit, not because they depend on each other.

### Scope — in
1. **Visible language switcher.** A real ES/EN toggle, reachable from the
   entry screen. Retires the bilingual "ES / EN" slash-separated labels that
   exist today as a stand-in for having no switcher at all (e.g.
   `RoomLobby.tsx`'s "¡ÚNETE AL JUEGO! / JOIN THE GAME!", "MULTIDISPOSITIVO",
   "CÓDIGO DE SALA / ENTER ROOM CODE") — replace each with a single
   `next-intl` key per locale, chosen by the switcher, not shown side by side.
2. **Room-code copy/share.** In the waiting lobby (`RoomWaitingLobby.tsx`),
   a control that copies the room code to the clipboard, and uses the Web
   Share API when available (mobile) so the code can be sent via WhatsApp/SMS
   in one tap instead of being read aloud or typed by hand.
3. **Accessibility pass.** Beyond the existing contrast unit tests
   (`tests/unit/design-tokens.test.ts`, `ADR-0004`): icon-only buttons get an
   `aria-label`; the room-code display and error banners use appropriate
   `aria-live`/roles so screen readers announce them; visible keyboard-focus
   states on interactive elements; confirm tap targets stay ≥44px (already the
   convention per `components/ui/Button.tsx`'s `min-h-14`, verify it wasn't
   broken anywhere).

### Scope — out (non-goals for this task)
- No new languages beyond ES/EN.
- No change to `next-intl` routing/middleware — locale is already
  URL-segment-based (`/es`, `/en`); the switcher navigates between them, it
  does not redesign how locale is resolved.
- No visual redesign beyond what's needed to fit the switcher and share
  button into the existing Paper & Felt system (`BDR-0001`/`ADR-0004`) — reuse
  `components/ui/` primitives, don't invent new ones unless nothing fits.
- No changes to game logic, reducers, or any `games/*` folder.
- M4/Battleship work of any kind — that is `TASK-0031`, a separate task.

### Files this task may touch
- `components/platform/RoomLobby.tsx`
- `components/platform/RoomWaitingLobby.tsx`
- `components/ui/**` (only if a small new primitive is genuinely needed, e.g.
  a language toggle control)
- `app/[locale]/layout.tsx` (if the switcher needs locale-navigation wiring)
- `i18n/es.json`, `i18n/en.json`
- `tests/unit/design-tokens.test.ts` (only if a11y-relevant tokens are added)
- `tests/e2e/**`
- `docs/ROADMAP.md`, `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`

### Relevant context
- `docs/ROADMAP.md` M3.5 — this is explicitly the last item before M4a.
- `ADR-0004` — design system contract; the switcher and share control must be
  built from `components/ui/` primitives and pass the existing contrast
  tests, not introduce new raw hex values.
- `PROJECT_CONSTITUTION.md` Article 9 — i18n is mandatory; this task is
  literally closing the gap where it wasn't actually switchable.

### Definition of Done
All seven items in `CONVENTIONS.md` §Definition of Done, plus:
- No bilingual slash-separated label remains anywhere in the app — grep for
  `" / "` in user-facing strings inside `components/` as a sanity check.
- Switching language actually re-renders visible text in the new language
  without a full page reload feeling jarring (client navigation between
  `/es`/`/en`), verified live in-browser in both directions.
- Copy button verified live (clipboard content checked, not just "no error").
- Share button verified to feature-detect `navigator.share` and fall back to
  copy when unavailable (desktop browsers).

### How to verify
```bash
pnpm lint && pnpm typecheck && pnpm vitest run && pnpm test:e2e
```
Manually: load the entry screen, switch language both directions, confirm no
mixed-language text remains visible; create a room, copy the code, paste it
somewhere to confirm it matches; on a mobile-width viewport, confirm the share
button either invokes the native share sheet or falls back to copy.
