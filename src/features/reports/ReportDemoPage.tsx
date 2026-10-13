// Draft-only: the report rendered from mock.ts, for working out the look. Delete with mock.ts.
import { MOCK_BROS, MOCK_HISTORY, MOCK_INSIGHTS, MOCK_ME, MOCK_MONTH } from "./mock";
import { ReportView } from "./ReportView";

export function ReportDemoPage() {
  return (
    <ReportView
      month={MOCK_MONTH}
      stats={MOCK_HISTORY[MOCK_HISTORY.length - 1]}
      history={MOCK_HISTORY}
      insights={MOCK_INSIGHTS}
      bros={MOCK_BROS}
      meId={MOCK_ME}
    />
  );
}
