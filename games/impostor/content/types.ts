export type HintDifficulty = "none" | "hard" | "easy";

export interface ImpostorWord {
  id: string;
  word: string;
  category: string; // Hard hint
  easyHint: string; // Easy hint
}
