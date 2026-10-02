import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatScore } from "../lib/ranking";
import type { Ranking, RoastLevel } from "../lib/types";
import { colors, fonts, radius, space } from "../theme/tokens.stylex";

export function Mosaic({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.grid)}>{children}</div>;
}

type TileProps = {
  /** Link target, or `onClick` to use the tile as a button (e.g. picking a roast). */
  to?: string;
  onClick?: () => void;
  title: string;
  lines: (string | null | false)[];
  ranking?: Ranking;
  level?: RoastLevel;
  mine?: boolean;
  /** Replaces the default "N brews" footer caption. */
  caption?: string;
  /** Rank position; only the top three get a mark. */
  rank?: number;
};

export function Tile({
  to,
  onClick,
  title,
  lines,
  ranking,
  level,
  mine = false,
  caption,
  rank,
}: TileProps) {
  const content = (
    <>
      {mine && <span role="img" aria-label="In your library" {...stylex.props(styles.mine)} />}
      {level && <span {...stylex.props(styles.level, levelStyles[level])} />}
      <span {...stylex.props(styles.title)}>{title}</span>
      {lines.filter(Boolean).map((line) => (
        <span key={line as string} {...stylex.props(styles.line)}>
          {line}
        </span>
      ))}
      <span {...stylex.props(styles.footer)}>
        <span {...stylex.props(styles.score)}>
          {rank != null && rank <= 3 && <span {...stylex.props(styles.rank)}>#{rank} </span>}
          {formatScore(ranking)}
        </span>
        <span {...stylex.props(styles.line)}>
          {caption ?? `${ranking?.brew_count ?? 0} ${ranking?.brew_count === 1 ? "brew" : "brews"}`}
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
  mine: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 5,
    height: 5,
    transform: "rotate(45deg)",
    backgroundColor: colors.brass,
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
    marginBottom: space.xs,
  },
  line: {
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footer: {
    marginTop: "auto",
    paddingTop: space.sm,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.sm,
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.brass,
  },
  rank: {
    fontSize: 11,
    color: colors.text,
  },
});

export const levelStyles = stylex.create({
  light: { backgroundColor: colors.levelLight },
  medium: { backgroundColor: colors.levelMedium },
  dark: { backgroundColor: colors.levelDark },
});
