import type { LocalizedContentPack } from "@/lib/types/room";
import { IMPOSTOR_WORDS_ES } from "./es";
import { IMPOSTOR_WORDS_EN } from "./en";
import type { ImpostorWord } from "./types";

export type { ImpostorWord, HintDifficulty } from "./types";

export const impostorContent: LocalizedContentPack<ImpostorWord> = {
  locale: {
    es: IMPOSTOR_WORDS_ES,
    en: IMPOSTOR_WORDS_EN,
  },
};
