import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { reportQueries } from "../../api/reports/reports.queries";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { monthTitle } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";

/** Every month's Brewsletter, newest first; unread ones carry a dot. */
export function ReportsPage() {
  const { data: months } = useQuery(reportQueries.months());
  const { data: views } = useQuery(reportQueries.views());
  if (!months || !views) return null;

  return (
    <FadeIn>
      {months.length === 0 ? (
        <EmptyState title="No Brewsletters yet.">The first lands on the 1st.</EmptyState>
      ) : (
        months.map((month) => (
          <Link key={month} to={`/reports/${month}`} {...stylex.props(styles.row)}>
            <span {...stylex.props(styles.dot, views.includes(month) && styles.read)} />
            <span {...stylex.props(styles.month)}>{monthTitle(month)}</span>
            <span {...stylex.props(styles.arrow)}>→</span>
          </Link>
        ))
      )}
    </FadeIn>
  );
}

const styles = stylex.create({
  row: {
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  dot: {
    flexShrink: 0,
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: colors.ember,
  },
  read: {
    backgroundColor: "transparent",
  },
  month: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  arrow: {
    color: colors.muted,
  },
});
