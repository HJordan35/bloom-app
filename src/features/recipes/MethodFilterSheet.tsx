import * as stylex from "@stylexjs/stylex";
import { HeaderAction } from "../../components/HeaderAction";
import { Sheet } from "../../components/Sheet";
import { colors, fonts, space } from "../../theme/tokens.stylex";

type Props = {
  /** Each method with how many recipes it has, in list order. */
  methods: { method: string; count: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
};

/** Tick any number of methods; the list filters as you go. None ticked means all. */
export function MethodFilterSheet({ methods, selected, onChange, onClose }: Props) {
  function toggle(method: string) {
    onChange(
      selected.includes(method) ? selected.filter((m) => m !== method) : [...selected, method],
    );
  }

  return (
    <Sheet title="Methods" onClose={onClose}>
      <div>
        <div {...stylex.props(styles.head)}>
          <span {...stylex.props(styles.hint)}>Show recipes for</span>
          {selected.length > 0 && <HeaderAction onClick={() => onChange([])}>Clear</HeaderAction>}
        </div>
        {methods.map(({ method, count }) => {
          const on = selected.includes(method);
          return (
            <button
              key={method}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(method)}
              {...stylex.props(styles.row)}
            >
              <span {...stylex.props(styles.check)}>{on ? "✓" : ""}</span>
              <span {...stylex.props(styles.name, on && styles.nameOn)}>{method}</span>
              <span {...stylex.props(styles.count)}>{count}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

const styles = stylex.create({
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    width: "100%",
    minHeight: 52,
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    textAlign: "left",
    cursor: "pointer",
  },
  check: {
    width: 16,
    color: colors.brass,
  },
  name: {
    flex: 1,
    color: colors.muted,
    transition: "color 150ms",
  },
  nameOn: {
    color: colors.text,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
});
