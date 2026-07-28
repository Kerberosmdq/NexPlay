# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: Hotfix (unnumbered) — no task spec was written; this is
  founder-requested platform UX polish, not a roadmap milestone.
- **Title**: Leave-room warning, mid-game "return to lobby," and an
  accordion games list.

## Current Branch
- `feat/lobby-exit-and-return-ux`, branched off `main` after PR #50
  (Connect 4, M5) merged. (Confirm this matches the actual branch name
  used when this was committed — name it at commit time following
  `CONVENTIONS.md`'s `feat/<slug>` pattern if a different name was used.)

## What's in this change

Founder feedback after playing Connect 4: tapping the top-bar "✕" left the
game — and, in multi-device, the *entire room* — with no warning at all;
there was no way to switch games without fully exiting; and the games list
in the lobby stacked one full-height card per game with no ceiling,
already awkward at four games and only getting worse as `BACKLOG.md`'s
remaining three queued games ship. Three platform-level changes, no
game-specific code touched.

### 1. Exit confirmation dialog
New `components/ui/ConfirmDialog.tsx` — a real `role="alertdialog"`,
focus-trapped (Tab cycles between Cancel/Confirm only), closes on Escape
or a backdrop click (both treated the same as Cancel). Deliberately *not*
`RevealCard`'s penumbra treatment (dark ground + glow) — that look is
reserved for the secret-reveal moment per `BDR-0001`; this is a plain
neutral scrim.

`components/ui/Screen.tsx` (the shared top-bar every session screen
already renders through) now opens this dialog instead of calling its
`onExit` prop directly — `onExit` only fires once the user actually
confirms. The message differs by mode: multi-device gets
`t("exitConfirmMessage")` ("vas a salir del juego y de la sala"),
single-device gets a new `exitConfirmMessageSingleDevice` prop threaded
from `app/[locale]/page.tsx` ("vas a salir del juego" — no room to
mention there). New i18n keys: `exitConfirmTitle`, `exitConfirmMessage`,
`exitConfirmMessageSingleDevice`, `exitConfirmConfirmButton`,
`exitConfirmCancelButton`.

`components/ui/Button.tsx` needed `forwardRef` added — a plain function
component can't accept a `ref`, and `ConfirmDialog` needs one to focus the
Cancel button when it opens (a11y: focus should land somewhere sane
inside a newly-opened dialog, not stay wherever it was).

### 2. "Volver al lobby" while a game is active
This action already existed — `PLATFORM_RETURN_LOBBY`, dispatched by
`TournamentBracket`'s existing button once a tournament's champion is
decided. The gap was that it was the *only* place to trigger it; there
was no way to back out of an ordinary in-progress match. Added a second
trigger point, same action, no new platform code:
- `components/platform/MultiDeviceRoom.tsx`: a host-only button (gated on
  `isHost`, since returning to the lobby resets shared state for every
  connected device — the same reasoning `PLATFORM_START_GAME`/
  `PLATFORM_START_TOURNAMENT` are already host-gated for) rendered above
  the active game's `<View>`.
- `app/[locale]/page.tsx`'s `SingleDeviceGamePicker`: no host concept in
  single-device, so always available, rendered above the active
  `singleDevice` view.

Neither needed its own confirmation dialog — returning to the lobby keeps
you in the same room with the same roster, unlike the "✕" exit; matches
`TournamentBracket`'s existing (unconfirmed) button for the same action.

### 3. Games list: accordion instead of N stacked cards
`components/platform/RoomWaitingLobby.tsx`'s game cards used to render
fully expanded and stacked — name, description, and buttons for every
registered game, unconditionally. Presented three layout directions to
the founder (accordion / a compact selector-row-plus-single-detail-panel /
a 2-column grid of smaller cards) via `AskUserQuestion`; **accordion** was
chosen specifically because it's the smallest change from the existing
per-game card (same content once expanded) while collapsing to just a
name row by default. One local `expandedGameId: string | null` state
value; opening one game's header closes whichever was previously open
(never more than one game's full detail on screen at once). Each header
is a real `<button aria-expanded aria-controls>`, each panel a `role="region"
aria-labelledby`.

### A real regression caught before it shipped
`tests/e2e/battleship-multi-device.spec.ts` clicked `"Jugar este"`
directly, assuming it was always visible — broke immediately once the
accordion collapsed it behind Battleship's own header. Fixed the test to
click the game's name first (expanding it), then `"Jugar este"` — this is
the *correct* new interaction, not a workaround; a real user now has to do
the same extra tap.

### Live verification
Two real, separately-connected browser tabs (multi-device): exit dialog
shown for both host and guest, Cancel/Escape/confirm all behave correctly,
host-only "volver al lobby" mid-game returns *both* devices to the lobby
with the room code and full player roster intact (not a fresh room).
Single-device (one tab): the lighter single-device exit message, "volver
al lobby" back to the game picker. Accordion: only one game's detail ever
expanded on screen across three real games. Zero console errors in every
check.

## Files Modified / Added
- `components/ui/ConfirmDialog.tsx` (new)
- `components/ui/Button.tsx` (`forwardRef` added)
- `components/ui/Screen.tsx` (opens `ConfirmDialog` instead of calling
  `onExit` directly; new `exitConfirmMessage` prop)
- `components/ui/index.ts` (exports `ConfirmDialog`)
- `components/platform/MultiDeviceRoom.tsx` (host-only "volver al lobby"
  above the active `<View>`)
- `components/platform/RoomWaitingLobby.tsx` (accordion rework)
- `app/[locale]/page.tsx` (`exitConfirmMessage` for single-device; "volver
  al lobby" above the single-device active view)
- `i18n/es.json`, `i18n/en.json` (`exitConfirm*` keys under `Lobby`)
- `tests/e2e/battleship-multi-device.spec.ts` (updated for the accordion
  interaction)

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`, strict
  branch protection, GitHub Actions secrets `NEXT_PUBLIC_SUPABASE_URL`/
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured (added for PR #39's e2e job).

## A testing-methodology note worth remembering (carried forward)
Same-profile multi-tab testing needs a distinct player identity per tab,
but all tabs share one `localStorage` — navigate the new tab once, then in
the *same* script call, `localStorage.clear(); location.reload();` before
doing anything else with it, and re-check every *previously* set-up tab is
still intact afterward. New this task: when a UI change collapses or
hides a control behind user interaction (this task's accordion, e.g.),
grep `tests/e2e/` for anything that clicks that control directly — it's a
near-certain break, and the fix is almost always "expand/reveal it first
in the test," not a test workaround.

## Pending Tasks
- A dedicated founder playtest of Battleship's full feature set (M4a–M4d —
  weapons, 2-vs-2 teams, tournament) on real phones specifically is still
  worth doing — every verification in this repo's history so far has used
  up to four browser contexts on one machine, not a dedicated real-device
  pass.
- Migrating Impostor's and Who Am I's secrets onto `ADR-0005`'s private
  slice — the latent leak the ADR documents is real but not urgent.
- The three remaining games from `BACKLOG.md`'s prioritized list (Guess
  Who, Ludo, a dice-and-track race game) — each its own future milestone,
  not yet started.

## Next Suggested Task
- The founder's call: **M6 (presentable)** per `docs/ROADMAP.md`, or the
  next game from `BACKLOG.md`'s prioritized list (Guess Who is next).
  Follow the same pattern used for Connect 4 and this hotfix: a design
  conversation with the founder (exploring distinct directions per
  `PROJECT_CONSTITUTION.md` Article 10 whenever there's a real visual/UX
  decision to make) before any code.
