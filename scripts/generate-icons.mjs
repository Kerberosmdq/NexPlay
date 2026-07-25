// One-off script for TASK-0030 (M3.5 code task 3): generate favicon/PWA/
// apple-touch icons from public/NexPlay_Logo.png. Not part of the app's
// runtime — run once, then delete (or keep for regenerating if the source
// logo ever changes; see docs/09_ai/tasks/TASK-0030-*.md).
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";
import { mkdirSync } from "node:fs";

const SRC = "public/NexPlay_Logo.png";
// Tight bounding box of the non-transparent hexagon mark within the
// source PNG (669x373), found by scanning alpha channel.
const BBOX = { left: 192, top: 42, width: 285, height: 291 };

const PARCHMENT = "#efe6d6";

async function renderSquare(size, { background = { r: 0, g: 0, b: 0, alpha: 0 } }, pad = 0.82) {
  const target = Math.round(size * pad);
  const resized = await sharp(SRC)
    .extract(BBOX)
    .resize(target, target, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync("public/icons", { recursive: true });

  // app/icon.png — Next.js App Router auto-serves this as the favicon.
  await sharp(await renderSquare(512, {})).toFile("app/icon.png");

  // app/apple-icon.png — iOS home screen icon. Opaque background:
  // transparent apple-touch-icons render with a black fill on iOS.
  await sharp(await renderSquare(180, { background: hexToRgba(PARCHMENT) }, 0.72)).toFile(
    "app/apple-icon.png"
  );

  // PWA manifest icons — "any" purpose (transparent, browser handles it).
  await sharp(await renderSquare(192, {})).toFile("public/icons/icon-192.png");
  await sharp(await renderSquare(512, {})).toFile("public/icons/icon-512.png");

  // Maskable PWA icon — must be opaque per spec (Android applies its own
  // shape mask over the full square, so transparent corners would show
  // through as holes) and needs extra padding so the mark survives being
  // cropped to a circle/rounded-square safe zone.
  await sharp(await renderSquare(512, { background: hexToRgba(PARCHMENT) }, 0.6)).toFile(
    "public/icons/icon-maskable-512.png"
  );

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
