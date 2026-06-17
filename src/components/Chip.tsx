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

export default function Chip<T extends AsTag = "span">(
  props: ChipPropsFor<T>
) {
  const { as, className, children, ...rest } =
    props as ChipPropsFor<AsTag>;

  const Component = (as ?? "span") as React.ElementType;

  return (
    <Component
      className={["chip", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}
