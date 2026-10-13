// Draft-only: the report rendered from mock.ts, for working out the look. Delete with mock.ts.
import { useQuery } from "@tanstack/react-query";
import { reportQueries } from "../../api/reports/reports.queries";
import {
  MOCK_BROS,
  MOCK_HISTORY,
  MOCK_INSIGHTS,
  MOCK_ME,
  MOCK_MONTH,
  MOCK_NEW_ROASTS,
  MOCK_ROAST_INSIGHTS,
} from "./mock";
import { ReportView } from "./ReportView";

export function ReportDemoPage() {
  // The one real piece: October's latest showcase image, so the demo shows a real group shot
  const { data: showcase } = useQuery(reportQueries.showcase(MOCK_MONTH));
  if (showcase === undefined) return null;

  return (
    <ReportView
      month={MOCK_MONTH}
      stats={MOCK_HISTORY[MOCK_HISTORY.length - 1]}
      history={MOCK_HISTORY}
      insights={MOCK_INSIGHTS}
      newRoasts={MOCK_NEW_ROASTS}
      roastInsights={MOCK_ROAST_INSIGHTS}
      showcase={showcase}
      bros={MOCK_BROS}
      meId={MOCK_ME}
    />
  );
}
