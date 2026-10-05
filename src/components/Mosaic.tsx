import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Ranking, RoastLevel } from "../lib/types";
import { colors, fonts, radius, space } from "../theme/tokens.stylex";
import { RatingDots } from "./RatingDots";

export function Mosaic({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.grid)}>{children}</div>;
}

type TileProps = {
  /** Link target, or `onClick` to use the tile as a button (e.g. picking a roast). */
  to?: string;
  onClick?: () => void;
  title: string;
  /** Short facts, joined on one line ("Colombia · medium"). */
  lines: (string | null | false)[];
  ranking?: Ranking;
  level?: RoastLevel;
  /** Who has brewed it (an AvatarStack), bottom left. */
  people?: ReactNode;
  /** Replaces the default "N brews" caption, bottom right. */
  caption?: string;
};

export function Tile({ to, onClick, title, lines, ranking, level, people, caption }: TileProps) {
  const brews = ranking?.brew_count ?? 0;
  const facts = lines.filter(Boolean).join(" · ");
  const content = (
    <>
      {level && <span {...stylex.props(styles.level, levelStyles[level])} />}
      <span {...stylex.props(styles.title)}>{title}</span>
      <RatingDots rating={ranking?.avg_rating} />
      {facts && <span {...stylex.props(styles.line, styles.facts)}>{facts}</span>}
      <span {...stylex.props(styles.footer)}>
        <span>{people}</span>
        <span {...stylex.props(styles.line, styles.caption)}>
          {caption ?? `${brews} ${brews === 1 ? "brew" : "brews"}`}
        </span>
      </span>
    </>
  );

  return to ? (
    <Link to={to} {...stylex.props(styles.tile)}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} {...stylex.props(styles.tile, styles.button)}>
      {content}
    </button>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: space.sm,
  },
  tile: {
    position: "relative",
    minHeight: 148,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: space.md,
    backgroundColor: { default: colors.surface, ":active": colors.surfaceRaised },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  button: {
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
  level: {
    width: 20,
    height: 2,
    marginBottom: space.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 1.25,
    overflowWrap: "anywhere",
    marginBottom: space.sm,
  },
  line: {
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  caption: {
    flexShrink: 0,
  },
  facts: {
    marginTop: space.sm,
  },
  footer: {
    marginTop: "auto",
    paddingTop: space.md,
    minHeight: 26, // an xs avatar plus its ring, so tiles without avatars line up
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
});

export const levelStyles = stylex.create({
  light: { backgroundColor: colors.levelLight },
  medium: { backgroundColor: colors.levelMedium },
  dark: { backgroundColor: colors.levelDark },
});
