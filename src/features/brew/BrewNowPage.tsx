import { EmptyState } from "../../components/EmptyState";
import { useCurrentBro } from "../../lib/auth";

export function BrewNowPage() {
  const bro = useCurrentBro();
  return (
    <EmptyState title={`Evening, ${bro.first_name}.`}>
      Nobody is brewing right now. Brewing arrives in Phase 3.
    </EmptyState>
  );
}
