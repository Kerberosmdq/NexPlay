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
//
// Also runs in a second, standalone mode over already-generated assets
// (`node scripts/generate-guesswho-assets.mjs --clean public/guess-who/c26.png ...`),
// which applies only the detached-fragment cleanup below. That mode exists
// because the founder-provided source sheets are not committed to the repo,
// so a crop-level defect found after a batch has landed can't be fixed by
// re-slicing the original.
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
 * across gaps up to `gapTolerance` px (anti-aliased edges, a character's own
 * internal negative space) so each character is one contiguous range instead
 * of several. `xStart`/`xEnd` restrict the scan to a sub-region (used to
 * re-scan inside an already-merged blob at zero tolerance — see
 * `findTrueSubBoundaries`). `rowStep` trades precision for speed: 2 is
 * enough for the initial full-sheet pass, but re-scanning a narrow merged
 * blob to find the *exact* touch point needs every row (step 1), since a
 * gap that's only real for a couple of rows is exactly what's being hunted. */
function findColumnRanges(data, width, height, channels, bg, gapTolerance, xStart = 0, xEnd = width - 1, rowStep = 2) {
  const columnHasContent = new Array(width).fill(false);
  for (let x = xStart; x <= xEnd; x++) {
    for (let y = 0; y < height; y += rowStep) {
      if (distance(colorAt(data, width, channels, x, y), bg) > BG_DISTANCE_THRESHOLD) {
        columnHasContent[x] = true;
        break;
      }
    }
  }

  const ranges = [];
  let start = null;
  let gap = 0;
  for (let x = xStart; x <= xEnd; x++) {
    if (columnHasContent[x]) {
      if (start === null) start = x;
      gap = 0;
    } else if (start !== null) {
      gap++;
      if (gap > gapTolerance) {
        ranges.push([start, x - gap]);
        start = null;
        gap = 0;
      }
    }
  }
  if (start !== null) ranges.push([start, xEnd]);
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

/** Some generated sheets have two or more characters touching with only a
 * whisker-thin background gap at the tolerance-scanned rows (found live in
 * batch 2: a cap brim, a beret, and a beanie all touched at the shoulders;
 * batch 3: a real ~6px gap existed but was swallowed by COLUMN_GAP_TOLERANCE,
 * and only showed up at a handful of rows near the collar, not near the
 * head). Re-scanning that merged blob's own x-range at zero gap tolerance
 * and *every* row (not every-other) usually reveals the true touch points —
 * blindly dividing into N equal-width slices instead (an earlier version of
 * this script did) cut into a neighbor's hair on both edges. Falls back to
 * equal-width division only if the precise re-scan doesn't find exactly
 * `parts` sub-ranges, with a loud warning — that fallback needs the same
 * manual visual check the imprecise version always needed. */
function findTrueSubBoundaries(data, width, height, channels, bg, xStart, xEnd, parts) {
  const subRanges = findColumnRanges(data, width, height, channels, bg, 0, xStart, xEnd, 1);
  if (subRanges.length === parts) return subRanges;
  console.warn(
    `  Precise re-scan of [${xStart},${xEnd}] found ${subRanges.length} sub-ranges, not the expected ${parts} — ` +
      `falling back to equal-width division. Inspect the resulting crops closely.`
  );
  const sliceWidth = Math.floor((xEnd - xStart + 1) / parts);
  const slices = [];
  for (let p = 0; p < parts; p++) {
    const sliceStart = xStart + p * sliceWidth;
    const sliceEnd = p === parts - 1 ? xEnd : sliceStart + sliceWidth - 1;
    slices.push([sliceStart, sliceEnd]);
  }
  return slices;
}

function applyManualSplits(ranges, splitArgs, data, width, height, channels, bg) {
  let result = ranges;
  for (const arg of splitArgs) {
    const [indexStr, partsStr] = arg.split(":");
    const index = Number(indexStr);
    const parts = Number(partsStr);
    const [xStart, xEnd] = result[index];
    const slices = findTrueSubBoundaries(data, width, height, channels, bg, xStart, xEnd, parts);
    result = [...result.slice(0, index), ...slices, ...result.slice(index + 1)];
  }
  return result;
}

const ALPHA_SOLID = 40; // alpha above which a pixel counts as real content, for fragment detection

/** Erases opaque blobs that are disconnected from the character and touch a
 * left/right edge of the crop — the signature of a neighbouring character
 * bleeding in (a hat brim, most often), since that's the axis the sheet is
 * sliced along. Batches 1–4 shipped three of these (c26 on both sides, c29,
 * c31); they went unnoticed because the card used to crop portraits to a
 * circle, which cut off exactly the margin the slivers sat in. The card now
 * shows the whole portrait, so they have to actually be gone.
 *
 * Requiring an edge touch is what makes this safe to run blind: a legitimately
 * detached feature (an earring drawn clear of the head, a glasses lens) sits in
 * the interior and is never considered. The largest blob is always kept, so a
 * character whose own art happens to reach an edge can't erase itself. */
function removeDetachedFragments(pixels, width, height) {
  const solid = (i) => pixels[i * 4 + 3] > ALPHA_SOLID;
  const seen = new Uint8Array(width * height);
  const blobs = [];

  for (let start = 0; start < width * height; start++) {
    if (!solid(start) || seen[start]) continue;
    const members = [];
    const stack = [start];
    seen[start] = 1;
    let touchesSideEdge = false;
    while (stack.length) {
      const p = stack.pop();
      members.push(p);
      const x = p % width;
      const y = (p - x) / width;
      if (x === 0 || x === width - 1) touchesSideEdge = true;
      if (x > 0) { const n = p - 1; if (!seen[n] && solid(n)) { seen[n] = 1; stack.push(n); } }
      if (x < width - 1) { const n = p + 1; if (!seen[n] && solid(n)) { seen[n] = 1; stack.push(n); } }
      if (y > 0) { const n = p - width; if (!seen[n] && solid(n)) { seen[n] = 1; stack.push(n); } }
      if (y < height - 1) { const n = p + width; if (!seen[n] && solid(n)) { seen[n] = 1; stack.push(n); } }
    }
    blobs.push({ members, touchesSideEdge });
  }

  if (blobs.length < 2) return 0;
  blobs.sort((a, b) => b.members.length - a.members.length);
  let erased = 0;
  for (const blob of blobs.slice(1)) {
    if (!blob.touchesSideEdge) continue;
    for (const p of blob.members) pixels[p * 4 + 3] = 0;
    erased += blob.members.length;
  }
  return erased;
}

/** `--clean` mode: re-run only the fragment cleanup over existing PNGs. */
async function cleanExisting(files) {
  for (const file of files) {
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const erased = removeDetachedFragments(data, info.width, info.height);
    if (erased === 0) {
      console.log(`${file}: no detached edge fragments found, left untouched`);
      continue;
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(file);
    console.log(`${file}: erased ${erased}px of detached edge fragments`);
  }
}

async function main() {
  const [, , src, ...rest] = process.argv;

  if (src === "--clean") {
    if (rest.length === 0) {
      console.error("Usage: node scripts/generate-guesswho-assets.mjs --clean <file1.png> <file2.png> ...");
      process.exit(1);
    }
    await cleanExisting(rest);
    return;
  }

  const splitArgs = [];
  const characterIds = [];
  for (const arg of rest) {
    if (arg.startsWith("--split=")) splitArgs.push(arg.slice("--split=".length));
    else characterIds.push(arg);
  }
  if (!src || characterIds.length === 0) {
    console.error("Usage: node scripts/generate-guesswho-assets.mjs <sheetPath> [--split=<rangeIndex>:<parts>] <id1> <id2> ...");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const { data, width, height, channels } = await loadRaw(src);
  const bg = colorAt(data, width, channels, 2, 2); // sample a corner pixel as the background reference
  console.log(`Background sampled as rgb(${bg.r}, ${bg.g}, ${bg.b})`);

  const rawRanges = findColumnRanges(data, width, height, channels, bg, COLUMN_GAP_TOLERANCE, 0, width - 1, 2);
  const ranges = applyManualSplits(rawRanges, splitArgs, data, width, height, channels, bg);
  if (ranges.length !== characterIds.length) {
    throw new Error(
      `Expected ${characterIds.length} character column ranges, found ${ranges.length} (${rawRanges.length} raw): ${JSON.stringify(ranges)}. ` +
        `Adjust BG_DISTANCE_THRESHOLD/COLUMN_GAP_TOLERANCE, add --split, or the source image's layout doesn't match the id list given.`
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

    // Padding is clamped to the neighbour's detected range above, but that
    // only stops *this* crop from reaching into a neighbour whose content was
    // detected — a hat brim overhanging into this character's own range still
    // lands inside the crop, so it gets erased here instead.
    const id = characterIds[i];
    const erased = removeDetachedFragments(pixels, cropped.info.width, cropped.info.height);

    await sharp(pixels, { raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 } })
      .png()
      .toFile(`${OUT_DIR}/${id}.png`);
    console.log(
      `Wrote ${OUT_DIR}/${id}.png (${cropped.info.width}x${cropped.info.height})` +
        (erased > 0 ? ` — erased ${erased}px of neighbouring-character bleed` : "")
    );
  }

  console.log("Guess Who character assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
