import type { LocalizedContentPack } from "@/lib/types/room";
import { WHO_AM_I_WORDS_ES } from "./es";
import { WHO_AM_I_WORDS_EN } from "./en";
import type { WhoAmIWord } from "./types";

export type { WhoAmIWord } from "./types";

export const whoAmIContent: LocalizedContentPack<WhoAmIWord> = {
  locale: {
    es: WHO_AM_I_WORDS_ES,
    en: WHO_AM_I_WORDS_EN,
  },
};
