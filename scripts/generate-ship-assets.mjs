// One-off script for TASK-0033 (Battleship M4a polish): slices the
// founder-provided public/Battleship_Ships.png (5 ships side by side, one
// image, opaque parchment background) into 5 individual per-ship-type PNG
// assets with the background made transparent, at
// public/battleship/<type>.png.
//
// Not part of the app's runtime — run once (`node scripts/generate-ship-assets.mjs`),
// re-run if the source image ever changes. Same pattern as
// scripts/generate-icons.mjs (sharp required from its pnpm store path,
// since it's a transitive Next.js dependency not resolvable via a plain
// import in a standalone script).
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";
import { mkdirSync } from "node:fs";

const SRC = "public/Battleship_Ships.png";
const OUT_DIR = "public/battleship";

// Left-to-right order the founder generated them in, matching
// games/battleship/placement.ts's FLEET_8/FLEET_10 ship types.
const SHIP_TYPES = ["carrier", "battleship", "destroyer", "submarine", "patrol"];

const BG_DISTANCE_THRESHOLD = 28; // color distance below which a pixel counts as "background", for column/row detection
const COLUMN_GAP_TOLERANCE = 6; // px of background allowed inside one ship's bounding box before treating it as a real gap
const PADDING = 14; // px of breathing room kept around each cropped ship

// The source has a soft drop shadow under each ship — a gradient blending
// from ship-dark to background, not a hard edge. A single distance cutoff
// either leaves a visible halo (too low) or eats into the ship's own dark
// outline (too high). Instead, alpha ramps smoothly between these two
// distances: fully transparent at/below CUTOUT_LOW, fully opaque at/above
// CUTOUT_HIGH, linearly in between — so the shadow fades out naturally
// instead of being clipped.
const CUTOUT_LOW = 18;
const CUTOUT_HIGH = 70;

async function loadRaw() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function colorAt(data, width, channels, x, y) {
  const i = (y * width + x) * channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

function distance(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/** Finds the horizontal ranges containing non-background content, merging
 * across small gaps (anti-aliased edges, a ship's own internal negative
 * space) so each ship is one contiguous range instead of several. */
function findColumnRanges(data, width, height, channels, bg) {
  const columnHasContent = new Array(width).fill(false);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y += 2) {
      // every other row is enough to detect content, and much faster
      if (distance(colorAt(data, width, channels, x, y), bg) > BG_DISTANCE_THRESHOLD) {
        columnHasContent[x] = true;
        break;
      }
    }
  }

  const ranges = [];
  let start = null;
  let gap = 0;
  for (let x = 0; x < width; x++) {
    if (columnHasContent[x]) {
      if (start === null) start = x;
      gap = 0;
    } else if (start !== null) {
      gap++;
      if (gap > COLUMN_GAP_TOLERANCE) {
        ranges.push([start, x - gap]);
        start = null;
        gap = 0;
      }
    }
  }
  if (start !== null) ranges.push([start, width - 1]);
  return ranges;
}

function findVerticalBounds(data, width, height, channels, bg, xStart, xEnd) {
  let top = null;
  let bottom = null;
  for (let y = 0; y < height; y++) {
    let hasContent = false;
    for (let x = xStart; x <= xEnd; x++) {
      if (distance(colorAt(data, width, channels, x, y), bg) > BG_DISTANCE_THRESHOLD) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      if (top === null) top = y;
      bottom = y;
    }
  }
  return { top, bottom };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const { data, width, height, channels } = await loadRaw();
  const bg = colorAt(data, width, channels, 2, 2); // sample a corner pixel as the background reference
  console.log(`Background sampled as rgb(${bg.r}, ${bg.g}, ${bg.b})`);

  const ranges = findColumnRanges(data, width, height, channels, bg);
  if (ranges.length !== SHIP_TYPES.length) {
    throw new Error(
      `Expected ${SHIP_TYPES.length} ship column ranges, found ${ranges.length}: ${JSON.stringify(ranges)}. ` +
        `Adjust BG_DISTANCE_THRESHOLD/COLUMN_GAP_TOLERANCE, or the source image's layout changed.`
    );
  }

  for (let i = 0; i < ranges.length; i++) {
    const [xStart, xEnd] = ranges[i];
    const { top, bottom } = findVerticalBounds(data, width, height, channels, bg, xStart, xEnd);

    const left = Math.max(0, xStart - PADDING);
    const top2 = Math.max(0, top - PADDING);
    const cropWidth = Math.min(width - left, xEnd - xStart + 1 + PADDING * 2);
    const cropHeight = Math.min(height - top2, bottom - top + 1 + PADDING * 2);

    // Chroma-key the background out of just this ship's crop, not the
    // whole source image — cheaper, and keeps each ship's own buffer small.
    const cropped = await sharp(SRC).extract({ left, top: top2, width: cropWidth, height: cropHeight }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const pixels = cropped.data;
    for (let p = 0; p < pixels.length; p += 4) {
      const px = { r: pixels[p], g: pixels[p + 1], b: pixels[p + 2] };
      const d = distance(px, bg);
      const ramp = Math.max(0, Math.min(1, (d - CUTOUT_LOW) / (CUTOUT_HIGH - CUTOUT_LOW)));
      pixels[p + 3] = Math.round(pixels[p + 3] * ramp);
    }

    const type = SHIP_TYPES[i];
    await sharp(pixels, { raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 } })
      .png()
      .toFile(`${OUT_DIR}/${type}.png`);
    console.log(`Wrote ${OUT_DIR}/${type}.png (${cropped.info.width}x${cropped.info.height})`);
  }

  console.log("Ship assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
