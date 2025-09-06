// src/components/Chip.tsx
"use client";

import * as React from "react";

type AsTag = "span" | "a" | "button" | "div";

type BaseProps = {
  className?: string;
  children: React.ReactNode;
};

type ChipPropsFor<T extends AsTag> =
  BaseProps &
    (T extends "a"
      ? React.AnchorHTMLAttributes<HTMLAnchorElement>
      : T extends "button"
      ? React.ButtonHTMLAttributes<HTMLButtonElement>
      : React.HTMLAttributes<HTMLElement>) & {
      as?: T;
    };

// Default: span
export default function Chip<T extends AsTag = "span">(
  props: ChipPropsFor<T>
) {
  const { as, className, children, ...rest } = props as ChipPropsFor<AsTag>;
  const As = (as ?? "span") as keyof JSX.IntrinsicElements;

  return (
    <As className={["chip", className ?? ""].filter(Boolean).join(" ")} {...(rest as any)}>
      {children}
    </As>
  );
}
