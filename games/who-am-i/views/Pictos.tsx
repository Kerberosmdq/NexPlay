import { Picto, type PictoProps } from "@/components/ui";

/** BDR-0002: Who Am I's pictograms, replacing the decorative emoji it used
 * (🎉 😬 ✅ ❌). The emoji that travel *with each word* stay: they are
 * content — the picture next to the word for the youngest player
 * (FEEL.md) — not decoration. */

/** The game itself: a head with a question mark. */
export function WhoPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="17" r="11" />
      <path d="M8 44c1.5-9 7.5-13 16-13s14.5 4 16 13" />
      <path d="M20.5 14.5a3.6 3.6 0 1 1 5.3 3.2c-1.1.6-1.8 1.4-1.8 2.6v.7" strokeWidth="3" />
      <circle cx="24" cy="24.6" r="1.3" fill="currentColor" stroke="none" />
    </Picto>
  );
}

/** Phone on the forehead, screen facing out. */
export function ForeheadPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="29" r="12" />
      <rect x="15" y="4" width="18" height="13" rx="3" />
      <path d="M20 10.5h8" />
    </Picto>
  );
}

/** Guessed it. */
export function GotItPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M15 24.5l6 6 12-13" />
    </Picto>
  );
}

/** Didn't guess it. */
export function MissedPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M17 17l14 14M31 17L17 31" />
    </Picto>
  );
}
