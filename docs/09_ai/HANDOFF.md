# Agent Handoff

Document template for transferring task execution context between AI sessions and developer agents.

## Last Completed Task
- **Task ID**: TASK-0030
- **Title**: Hexagon Identity & PWA Icons (M3.5 code task 3a)

## Current Branch
- `feat/hexagon-identity-and-pwa`, branched off `main` after `PR #26`
  (`TASK-0029`, Paper & Felt direction) merged.

## What's in this task
`BDR-0001` §4 said "the hexagon is real... used as the app icon, favicon,
and PWA install icon." This task makes that literally true, rather than
the placeholder inline SVG hexagon accent `TASK-0029` added to the lobby
header as a preview.

**The mark itself came from the founder, not from code.** In conversation,
we looked at two existing hexagon marks from the founder's other Nex-
family apps and worked out the shared grammar together: a point-up
hexagon outline, two small circular "connector node" pins sitting on the
left/right mid-height vertices (each linked inward by a short stub line —
a circuit-board-pin motif), and an app-specific interior icon in a single
brand color. I wrote an image-generation prompt applying that grammar to
NexPlay specifically (felt green `#1F6B52`, a six-sided die face as the
interior icon — the most universal "tabletop game" symbol, fitting
`BDR-0001`'s physical Paper & Felt world). The founder ran that prompt
through an external image tool and dropped the result at
`public/NexPlay_Logo.png`.

**This task's actual work was turning that one source PNG into a real
icon set:**
1. Found the mark's tight bounding box within the (non-square, mostly
   transparent) source image by scanning its alpha channel in-browser via
   canvas.
2. `sharp` — a transitive dependency Next.js already installs for image
   optimization, but not resolvable via a plain top-level `require`
   (verified: `Cannot find module 'sharp'`) — was reachable by requiring
   its actual `node_modules/.pnpm/sharp@0.34.5/node_modules/sharp` path
   directly. `scripts/generate-icons.mjs` uses that to crop, resize, and
   composite onto appropriately-backgrounded square canvases: `app/icon.png`
   (512px, transparent — Next.js App Router auto-serves this as the
   favicon), `app/apple-icon.png` (180px, **opaque parchment background**
   — transparent apple-touch-icons render with a black fill on iOS, so
   this one deliberately isn't transparent like the others),
   `public/icons/icon-192.png`/`icon-512.png` (PWA manifest, "any"
   purpose, transparent), `public/icons/icon-maskable-512.png` (PWA
   manifest, "maskable" purpose — opaque background *and* extra padding,
   since Android's shape mask crops right to the icon's edges and a
   maskable icon must survive that crop with its mark still intact).
3. `app/manifest.ts` (Next.js's file-based, auto-linked convention — no
   manual `<link rel="manifest">` needed) wires those icons plus
   `theme_color` (felt green) and `background_color` (parchment).
   `viewport.themeColor` in `layout.tsx` covers the other half (mobile
   Chrome's address-bar tint, which reads from `<meta name="theme-color">`
   independently of the manifest).
4. Deleted the Next.js scaffold leftovers the original audit flagged:
   `app/favicon.ico` (the default Next.js logo — superseded by
   `app/icon.png`) and `public/{file,globe,next,vercel,window}.svg` (never
   referenced anywhere, just scaffold cruft).

**A scope note, written down rather than left implicit:** the original
`docs/ROADMAP.md` "Code task 3 — Identity & polish" entry bundled the
hexagon/PWA work with a language switcher, room-code share, and an
accessibility pass. This task split that into 3a (done here) and 3b (not
started) so the PR stayed reviewable — see `docs/ROADMAP.md`'s M3.5
section for the explicit split.

## Files Modified / Added
- `app/icon.png`, `app/apple-icon.png` (new, binary)
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
  (new, binary)
- `public/NexPlay_Logo.png` (source asset, provided by the founder)
- `app/manifest.ts` (new)
- `scripts/generate-icons.mjs` (new — kept, not throwaway, for
  regenerating the set if the source logo ever changes)
- `app/[locale]/layout.tsx` (`viewport.themeColor` added)
- Deleted: `app/favicon.ico`, `public/file.svg`, `public/globe.svg`,
  `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- `docs/09_ai/tasks/TASK-0030-hexagon-identity-and-pwa.md` (new),
  `docs/ROADMAP.md` (3a/3b split), `docs/09_ai/CURRENT_STATE.md`, this
  file

## External state (not in git, important for the next agent to know)
- Same as prior handoffs: Supabase live, Vercel auto-deploying `main`,
  strict branch protection. Unchanged by this task.
- `scripts/generate-icons.mjs` hardcodes the source mark's bounding box
  (`{ left: 192, top: 42, width: 285, height: 291 }`, found by scanning
  `public/NexPlay_Logo.png`'s alpha channel). If the founder ever
  regenerates or replaces that source PNG with a different composition,
  this bounding box needs re-deriving — don't assume it still applies to
  a new file with the same name.
- `sharp`'s only reachable path in this repo is
  `node_modules/.pnpm/sharp@0.34.5/node_modules/sharp` — a plain
  `require("sharp")`/`import "sharp"` will fail (it's a transitive
  dependency of Next.js's own image optimization, not a direct one this
  project declares). If a future task needs image processing again,
  either reuse that path or add `sharp` as a real `devDependency` instead
  of relying on the nested copy staying at this exact version.

## Pending Tasks
- **M3.5 code task 3b (Polish):** a visible language switcher (retires
  `RoomLobby.tsx`'s remaining bilingual labels — untouched by this task,
  since it's a copy/i18n concern, not an icon/manifest one), room-code
  copy/share affordance, and a final accessibility pass against
  `ADR-0004`'s contrast tests. This is the last M3.5 code task before M4.
- **Backlog, not scoped anywhere yet:** per-game hexagon-interior marks
  (`BDR-0001` §4: a mask silhouette for Impostor, a question mark for Who
  Am I, a grid for Battleship later) — decorative in-app accents for each
  game's own screens, distinct from the one app-level icon this task
  built. Worth a `docs/BACKLOG.md` entry if it isn't there already.
- Founder playtest of multi-device Who Am I on real phones (M3's last open
  item — independent of all of the above).
- M1's dedicated two-real-phones reconnection test (independent, still
  open from earlier handoffs).

## Next Suggested Task
- M3.5 code task 3b: language switcher + room-code share + accessibility
  pass — the last thing standing between M3.5 and starting M4
  (Battleship).
- Founder's multi-device Who Am I playtest remains independent and can
  happen whenever.
