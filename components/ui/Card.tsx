import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** ADR-0004 §2: the shared raised-surface container every panel/card uses. */
export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface-raised border border-line rounded-3xl p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
