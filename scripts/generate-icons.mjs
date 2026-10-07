// Generates the favicon / PWA / apple-touch icons from the BDR-0002 hex
// token mark (the same drawing as components/ui/NexMark.tsx: a yellow
// plastic hexagon on its molded edge with four toy-brick studs). Not part of
// the app's runtime — rerun with `node scripts/generate-icons.mjs` whenever
// the mark or the palette changes.
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";
import { mkdirSync } from "node:fs";

// Mirrors app/tokens.css (BDR-0002 §5).
const GROUND = "#2a66e0";
const YELLOW = "#ffc928";
const YELLOW_EDGE = "#b98600";
const INK = "#13213f";

const TOKEN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110">
  <polygon points="50,10 91.6,34 91.6,82 50,106 8.4,82 8.4,34" fill="${YELLOW_EDGE}"/>
  <polygon points="50,2 91.6,26 91.6,74 50,98 8.4,74 8.4,26" fill="${YELLOW}" stroke="${YELLOW_EDGE}" stroke-width="2"/>
  <g fill="${INK}" transform="translate(22 22) scale(1.75)">
    <circle cx="10" cy="10" r="4.5"/><circle cx="22" cy="10" r="4.5"/>
    <circle cx="10" cy="22" r="4.5"/><circle cx="22" cy="22" r="4.5"/>
  </g>
</svg>`;

/** The token centered on a square canvas, `pad` = share of the side it
 * occupies. `background` is transparent unless given. */
async function renderSquare(size, pad, background) {
  const target = Math.round(size * pad);
  const token = await sharp(Buffer.from(TOKEN_SVG), { density: 600 })
    .resize(target, target, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ? hexToRgba(background) : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: token, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync("public/icons", { recursive: true });

  // app/icon.png — Next.js App Router auto-serves this as the favicon.
  await sharp(await renderSquare(512, 0.9)).toFile("app/icon.png");

  // app/apple-icon.png — iOS home screen icon. Opaque background:
  // transparent apple-touch-icons render with a black fill on iOS.
  await sharp(await renderSquare(180, 0.7, GROUND)).toFile("app/apple-icon.png");

  // PWA manifest icons — "any" purpose (transparent, browser handles it).
  await sharp(await renderSquare(192, 0.9)).toFile("public/icons/icon-192.png");
  await sharp(await renderSquare(512, 0.9)).toFile("public/icons/icon-512.png");

  // Maskable PWA icon — opaque (Android applies its own shape mask over the
  // full square) and padded so the token survives a circular crop.
  await sharp(await renderSquare(512, 0.58, GROUND)).toFile("public/icons/icon-maskable-512.png");

  console.log("Icons generated.");
}

function hexToRgba(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha: 1,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
