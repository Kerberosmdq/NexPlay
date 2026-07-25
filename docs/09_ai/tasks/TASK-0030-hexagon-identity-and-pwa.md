# TASK-0030: Hexagon Identity & PWA Icons (M3.5 code task 3a)

### Goal
Make `BDR-0001` §4 ("the hexagon is real") literally true: a real favicon,
PWA manifest, and app icons, replacing the Next.js scaffold defaults still
sitting in `app/` and `public/`. This is a deliberate split of the
originally-scoped "Code task 3 — Identity & polish" milestone entry in
`docs/ROADMAP.md`: this task covers the icon/PWA half; the language
switcher, room-code share affordance, and accessibility pass are a
separate follow-up (code task 3b) so each PR stays reviewable.

### Scope — in
- Founder-generated hexagon mark (`public/NexPlay_Logo.png`) processed via
  `sharp` into the actual icon set: `app/icon.png` (favicon, transparent),
  `app/apple-icon.png` (iOS home screen, opaque parchment background —
  transparent apple-touch-icons render with a black fill on iOS),
  `public/icons/icon-192.png` / `icon-512.png` (PWA manifest, "any"
  purpose), `public/icons/icon-maskable-512.png` (PWA manifest,
  "maskable" purpose — opaque background and extra padding so the mark
  survives Android's shape mask).
- `app/manifest.ts` (Next.js App Router's file convention — auto-linked,
  no manual `<link rel="manifest">` needed): name, icons, `theme_color`
  (felt green, matching `--color-action-primary`), `background_color`
  (parchment, matching `--color-surface`), `display: standalone`.
- Remove the Next.js scaffold leftovers the original audit flagged:
  `app/favicon.ico` (superseded by `app/icon.png`) and the unused
  `public/{file,globe,next,vercel,window}.svg` scaffold icons.
- `scripts/generate-icons.mjs` kept in the repo (not a throwaway) so the
  icon set can be regenerated if the source logo ever changes.

### Scope — out (non-goals for this task)
- No language switcher, no room-code share/copy button, no accessibility
  audit — code task 3b, tracked separately in `docs/ROADMAP.md`.
- No per-game hexagon-interior marks (Impostor's mask silhouette, Who Am
  I's question mark, Battleship's grid) — those are in-app decorative
  accents for each game's own screens, not the app-level icon this task
  covers. Backlog item, not scoped here.
- No changes to any reducer, view logic, or the design tokens themselves.

### Files this task may touch
- `app/icon.png`, `app/apple-icon.png` (new, binary)
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
  (new, binary)
- `public/NexPlay_Logo.png` (source asset, already added by the founder)
- `app/manifest.ts` (new)
- `scripts/generate-icons.mjs` (new)
- `app/favicon.ico` (deleted), `public/{file,globe,next,vercel,window}.svg`
  (deleted)
- `app/[locale]/layout.tsx` (if `themeColor`/viewport metadata needs
  wiring beyond what `manifest.ts` covers)
- `docs/ROADMAP.md` (split code task 3 into 3a/3b explicitly),
  `docs/09_ai/CURRENT_STATE.md`, `docs/09_ai/HANDOFF.md`, this file

### Relevant context
- `BDR-0001` §4 — the hexagon-as-app-icon requirement this task fulfills.
- The founder generated the source mark via an external image tool, from
  a prompt built collaboratively in conversation (matching the "Nex"
  family's existing hexagon-outline + two side connector-node grammar,
  seen in the founder's other apps) — not from any code in this repo.

### Definition of Done
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass (no reducer/logic
  touched, so no new test cases expected — this is a static-asset task).
- The favicon, apple touch icon, and PWA manifest are all reachable and
  correctly linked — verified by inspecting the rendered `<head>` and
  fetching each icon URL directly in the browser.
- `app/favicon.ico` and the five unused scaffold SVGs no longer exist.
- `docs/ROADMAP.md` reflects the 3a/3b split explicitly (not silently).
- `docs/09_ai/CURRENT_STATE.md` / `HANDOFF.md` updated.

### How to verify
- `pnpm lint && pnpm typecheck && pnpm test`
- In the browser: inspect `document.head` for `<link rel="icon">`,
  `<link rel="apple-touch-icon">`, and `<link rel="manifest">`; fetch
  `/manifest.webmanifest` and each icon URL directly to confirm 200s and
  correct content.
- Visual check: icons render as the hexagon mark, not the old Next.js
  default, in a real browser tab/bookmark bar.
