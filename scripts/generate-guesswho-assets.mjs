// One-off script for TASK-0038 follow-up (Guess Who real character art):
// slices a founder-provided reference sheet (N character portraits side by
// side in one row, solid parchment background) into individual per-character
// PNG assets with the background made transparent, at
// public/guess-who/<characterId>.png.
//
// Mirrors scripts/generate-ship-assets.mjs's exact approach (column-range
// detection via background-color distance, then per-range vertical bounds,
// then a smoothly-ramped chroma key so anti-aliased edges don't leave a
// halo) — reused as-is since the reference-sheet layout is the same shape
// (N items side by side on one flat background color), just characters
// instead of ships. Not part of the app's runtime — run once per batch
// (`node scripts/generate-guesswho-assets.mjs <sheetPath> <id1> <id2> ...`).
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";
import { mkdirSync } from "node:fs";

const OUT_DIR = "public/guess-who";

const BG_DISTANCE_THRESHOLD = 28; // color distance below which a pixel counts as "background", for column/row detection
const COLUMN_GAP_TOLERANCE = 6; // px of background allowed inside one character's bounding box before treating it as a real gap
const PADDING = 14; // px of breathing room kept around each cropped character

// Same soft-edge problem the ship art had (there, a drop shadow; here,
// anti-aliased hair/glasses edges against the flat background) — a single
// distance cutoff either leaves a visible halo (too low) or eats into hair
// strands (too high). Alpha ramps smoothly between these two distances.
const CUTOUT_LOW = 18;
const CUTOUT_HIGH = 70;

async function loadRaw(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
 * across small gaps (anti-aliased edges, a character's own internal negative
 * space) so each character is one contiguous range instead of several. */
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
  const [, , src, ...characterIds] = process.argv;
  if (!src || characterIds.length === 0) {
    console.error("Usage: node scripts/generate-guesswho-assets.mjs <sheetPath> <id1> <id2> ...");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const { data, width, height, channels } = await loadRaw(src);
  const bg = colorAt(data, width, channels, 2, 2); // sample a corner pixel as the background reference
  console.log(`Background sampled as rgb(${bg.r}, ${bg.g}, ${bg.b})`);

  const ranges = findColumnRanges(data, width, height, channels, bg);
  if (ranges.length !== characterIds.length) {
    throw new Error(
      `Expected ${characterIds.length} character column ranges, found ${ranges.length}: ${JSON.stringify(ranges)}. ` +
        `Adjust BG_DISTANCE_THRESHOLD/COLUMN_GAP_TOLERANCE, or the source image's layout doesn't match the id list given.`
    );
  }

  for (let i = 0; i < ranges.length; i++) {
    const [xStart, xEnd] = ranges[i];
    const { top, bottom } = findVerticalBounds(data, width, height, channels, bg, xStart, xEnd);

    // Padding must never cross into a neighboring character's own detected
    // range — otherwise a sliver of their hair/clothing bleeds into this
    // crop (found live: c1's right edge showed a fragment of c2's sweater).
    const prevRangeEnd = i > 0 ? ranges[i - 1][1] : -Infinity;
    const nextRangeStart = i < ranges.length - 1 ? ranges[i + 1][0] : Infinity;

    const left = Math.max(0, xStart - PADDING, prevRangeEnd + 1);
    const right = Math.min(width - 1, xEnd + PADDING, nextRangeStart - 1);
    const top2 = Math.max(0, top - PADDING);
    const cropWidth = right - left + 1;
    const cropHeight = Math.min(height - top2, bottom - top + 1 + PADDING * 2);

    // Chroma-key the background out of just this character's crop, not the
    // whole source image — cheaper, and keeps each buffer small.
    const cropped = await sharp(src).extract({ left, top: top2, width: cropWidth, height: cropHeight }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const pixels = cropped.data;
    for (let p = 0; p < pixels.length; p += 4) {
      const px = { r: pixels[p], g: pixels[p + 1], b: pixels[p + 2] };
      const d = distance(px, bg);
      const ramp = Math.max(0, Math.min(1, (d - CUTOUT_LOW) / (CUTOUT_HIGH - CUTOUT_LOW)));
      pixels[p + 3] = Math.round(pixels[p + 3] * ramp);
    }

    const id = characterIds[i];
    await sharp(pixels, { raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 } })
      .png()
      .toFile(`${OUT_DIR}/${id}.png`);
    console.log(`Wrote ${OUT_DIR}/${id}.png (${cropped.info.width}x${cropped.info.height})`);
  }

  console.log("Guess Who character assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
