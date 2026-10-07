import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** ADR-0004 §2: the shared raised-surface container every panel/card uses.
 * BDR-0002: a white plastic panel sitting on its molded edge. */
export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface-raised rounded-[1.75rem] p-6 shadow-[0_var(--edge-lg)_0_var(--color-edge-raised)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
