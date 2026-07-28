export type HairColor = "negro" | "castaño" | "rubio" | "pelirrojo";
export type HairLength = "largo" | "corto" | "calvo";
export type FacialHair = "barba" | "bigote" | "ninguno";

export interface GuessWhoTraits {
  glasses: boolean;
  hat: boolean;
  hairColor: HairColor;
  hairLength: HairLength;
  facialHair: FacialHair;
  earrings: boolean;
}

// Character names are not per-locale content — unlike Impostor/Who Am I's
// words (which *are* the translated content), proper names transfer fine
// between Spanish and English, so this is one shared list rather than a
// `LocalizedContentPack`. `imagePath` is intentionally omitted from this
// type: real portraits are a deliberate follow-up task (see
// TASK-0038-guess-who.md), and views fall back to a trait-based
// placeholder card when none exists — adding real art later is a pure
// content change, no reducer/view code to touch.
export interface GuessWhoCharacter {
  id: string;
  name: string;
  traits: GuessWhoTraits;
}
