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
};

/** Who a body mentions, parsed from its `@Name` / `@everyone`. */
export type Mentions = Pick<Message, "mentions" | "mention_all">;

export type NewMessage = Mentions & { bro_id: string; body: string };

export type MessageEdit = Mentions & { id: string; body: string };
