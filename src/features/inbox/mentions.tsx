import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import type { Mentions } from "../../api/messages/messages.types";
import { colors } from "../../theme/tokens.stylex";

type Named = Pick<Bro, "id" | "first_name">;

export const EVERYONE = "everyone";

// "@Henry" / "@everyone" (at the start or after a space, so emails don't count), or a URL
// (without trailing punctuation). split() keeps the matches at odd indexes.
const TOKENS = /((?<=^|\s)@\p{L}+|https?:\/\/[^\s<]+[^\s<.,:;!?)"'])/u;
const TOKENS_ALL = new RegExp(TOKENS.source, "gu");

/** The bro whose first name this is (names are unique among the bros). */
function broNamed(bros: Named[], name: string) {
  const lower = name.toLowerCase();
  return bros.find((bro) => bro.first_name.toLowerCase() === lower);
}

/** Who a message mentions, for the push: bros by `@Name` (never yourself), all by `@everyone`. */
export function parseMentions(body: string, bros: Named[], meId: string): Mentions {
  const ids = new Set<string>();
  let all = false;
  for (const [token] of body.matchAll(TOKENS_ALL)) {
    if (!token.startsWith("@")) continue;
    const name = token.slice(1);
    if (name.toLowerCase() === EVERYONE) all = true;
    const bro = broNamed(bros, name);
    if (bro && bro.id !== meId) ids.add(bro.id);
  }
  return { mentions: [...ids], mention_all: all };
}

/** The word being typed at the caret when it's a mention ("@He|" → "he"), else null. */
export function mentionQuery(text: string, caret: number) {
  const match = text.slice(0, caret).match(/(?:^|\s)@(\p{L}*)$/u);
  return match ? match[1].toLowerCase() : null;
}

/** A message's text: mentions in brass (a bro's opens their profile), URLs as quiet links. */
export function MessageText({ body, bros }: { body: string; bros: Named[] }) {
  return body.split(TOKENS).map((part, index) => {
    // The text between tokens, and tokens never reorder, so their place is their key
    const key = `${index}`;
    if (index % 2 === 0) return part;
    if (part.startsWith("@")) {
      const name = part.slice(1);
      if (name.toLowerCase() === EVERYONE) {
        return (
          <span key={key} {...stylex.props(styles.mention)}>
            {part}
          </span>
        );
      }
      const bro = broNamed(bros, name);
      if (!bro) return part;
      return (
        <Link key={key} to={`/bros/${bro.id}`} {...stylex.props(styles.mention)}>
          {part}
        </Link>
      );
    }
    return (
      <a key={key} href={part} target="_blank" rel="noreferrer" {...stylex.props(styles.link)}>
        {part}
      </a>
    );
  });
}

const styles = stylex.create({
  mention: {
    color: colors.brass,
  },
  link: {
    textDecorationLine: "underline",
    textDecorationColor: colors.faint,
    textUnderlineOffset: 3,
    overflowWrap: "anywhere",
  },
});
