import type { BrewWithRoast } from "../brews/brews.types";
import type { PreferredRecipeWithRoast } from "../preferred/preferred.types";

/** The six marks a message can get, in the order they're offered. Matches the DB check. */
export const REACTIONS = ["☕", "👍", "❤️", "😂", "🔥", "😮"] as const;

export type Emoji = (typeof REACTIONS)[number];

export type Reaction = { bro_id: string; emoji: Emoji };

/** One post on the shared board: a bro's, or Bloom's own (release notes, insights). */
export type Message = {
  id: string;
  kind: "bro" | "bloom";
  /** Null for Bloom posts. */
  bro_id: string | null;
  /** A Bloom post's eyebrow, e.g. "What's new". */
  label: string | null;
  body: string;
  mentions: string[];
  mention_all: boolean;
  recipe_id: string | null;
  brew_id: string | null;
  photo_path: string | null;
  photo_w: number | null;
  photo_h: number | null;
  edited_at: string | null;
  created_at: string;
  reactions: Reaction[];
  /** The shared item, joined (null once it's deleted). */
  recipe: PreferredRecipeWithRoast | null;
  brew: BrewWithRoast | null;
};

/** Who a body mentions, parsed from its `@Name` / `@everyone`. */
export type Mentions = Pick<Message, "mentions" | "mention_all">;

/** A post: text, and at most one of a photo or a shared recipe or brew (the body may be empty). */
export type NewMessage = Mentions & { bro_id: string; body: string } & Partial<
    Pick<Message, "recipe_id" | "brew_id" | "photo_path" | "photo_w" | "photo_h">
  >;

export type MessageEdit = Mentions & { id: string; body: string };

/** Add (`on`) or take back one of your reactions. */
export type ReactionToggle = { message_id: string; bro_id: string; emoji: Emoji; on: boolean };
