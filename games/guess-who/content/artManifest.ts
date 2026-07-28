// Which character ids have real portrait art at public/guess-who/<id>.png,
// generated in batches from founder-provided reference sheets (see
// scripts/generate-guesswho-assets.mjs) and reviewed against the roster's
// traits before being added here. Every id not listed still renders via
// CharacterCard's placeholder representation — this set is the single
// switch between the two, updated once per landed batch.
export const CHARACTER_IDS_WITH_ART: ReadonlySet<string> = new Set([
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "c10",
  "c11",
  "c12",
  "c13",
  "c14",
  "c15",
  "c16",
  "c17",
  "c18",
  "c19",
  "c20",
  "c21",
  "c22",
  "c23",
  "c24",
]);
