import { Picto, type PictoProps } from "@/components/ui";

/** BDR-0002: Impostor's pictograms, replacing the emoji it used as
 * illustration (FEEL.md: "not emoji-as-decoration"), drawn in the shared
 * `Picto` frame. */

/** The impostor: a mask with two eye holes. */
export function MaskPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M5 14c11-7 27-7 38 0 0 15-9 25-19 25S5 29 5 14z" />
      <ellipse cx="16.5" cy="20.5" rx="4.5" ry="3.2" fill="currentColor" stroke="none" />
      <ellipse cx="31.5" cy="20.5" rx="4.5" ry="3.2" fill="currentColor" stroke="none" />
    </Picto>
  );
}

/** Talking / the innocent's word: a speech bubble. */
export function BubblePicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M10 8h28a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H22l-9 7v-7h-3a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z" />
      <path d="M15 18h18M15 24h11" />
    </Picto>
  );
}

/** Voting: a ballot going into a box. */
export function BallotPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M8 24h32v16H8z" />
      <path d="M16 24V8h16v16" />
      <path d="M20 15l3 3 5-6" />
      <path d="M14 31h20" />
    </Picto>
  );
}

/** A tie: two equal bars. */
export function TiePicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M10 18h28M10 30h28" strokeWidth="5" />
    </Picto>
  );
}

/** Done / vote registered: a check in a circle. */
export function CheckPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M15 24.5l6 6 12-13" />
    </Picto>
  );
}

/** The impostor got away: a crown. */
export function CrownPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M7 36l-2-22 11 9 8-14 8 14 11-9-2 22z" />
      <path d="M8 41h32" />
    </Picto>
  );
}

/** Caught an innocent by mistake: a worried face. */
export function OopsPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <circle cx="24" cy="24" r="18" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      <circle cx="30" cy="20" r="1.5" fill="currentColor" />
      <path d="M16 32h16" />
    </Picto>
  );
}

/** Innocents celebrating: a star. */
export function StarPicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <path d="M24 5l5.6 12 13 1.4-9.7 8.8 2.7 12.8L24 33.4 12.4 40l2.7-12.8-9.7-8.8 13-1.4z" />
    </Picto>
  );
}

/** Pass the phone: a phone with an arrow. */
export function PassPhonePicto(props: PictoProps) {
  return (
    <Picto {...props}>
      <rect x="9" y="5" width="18" height="34" rx="4" />
      <path d="M16 33h4" />
      <path d="M31 22h12M38 16l6 6-6 6" />
    </Picto>
  );
}
