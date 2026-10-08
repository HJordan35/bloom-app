import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

type Props = {
  /** The view's own root style, so FadeIn replaces the root element instead of wrapping it. */
  xstyle?: stylex.StyleXStyles;
  as?: "div" | "main";
  children: ReactNode;
};

/**
 * A view's entrance: its top-level blocks fade in and rise, staggered top to bottom
 * (`.bloom-enter` in theme/global.css). Use it as a view's root, after the view's loading
 * check, so it plays once the data is ready — whether it came from the cache or the network.
 */
export function FadeIn({ xstyle, as: Element = "div", children }: Props) {
  const { className, ...rest } = stylex.props(xstyle);
  return (
    <Element {...rest} className={className ? `bloom-enter ${className}` : "bloom-enter"}>
      {children}
    </Element>
  );
}
