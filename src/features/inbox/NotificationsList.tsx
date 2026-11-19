import { useQuery } from "@tanstack/react-query";
import { brewQueries } from "../../api/brews/brews.queries";
import { broQueries } from "../../api/bros/bros.queries";
import { eventQueries } from "../../api/events/events.queries";
import { roasterQueries } from "../../api/roasters/roasters.queries";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { dayHeading } from "../../lib/format";
import { EventRow } from "./EventRow";

/** The Inbox's Notifications tab: every bro's brews, roasts and endorsements, by day. */
export function NotificationsList() {
  const { data: events } = useQuery(eventQueries.list());
  // Event rows read these from the cache; waiting here keeps names from popping in
  const { data: bros } = useQuery(broQueries.list());
  const { data: brewing } = useQuery(brewQueries.brewingNow());
  const { data: roasts } = useQuery(roastQueries.list());
  const { data: roasters } = useQuery(roasterQueries.list());
  if (!events || !bros || !brewing || !roasts || !roasters) return null;

  if (events.length === 0) {
    return (
      <EmptyState title="Quiet in the lounge.">
        Brews, roasts and endorsements land here.
      </EmptyState>
    );
  }

  return groupByDay(events).map(([day, events]) => (
    <Section key={day} label={day}>
      {events.map((e) => (
        <EventRow key={`${e.type}-${e.ref_id}`} event={e} />
      ))}
    </Section>
  ));
}

function groupByDay<T extends { created_at: string }>(items: T[]) {
  const groups: [string, T[]][] = [];
  for (const item of items) {
    const day = dayHeading(item.created_at);
    const last = groups.at(-1);
    if (last?.[0] === day) last[1].push(item);
    else groups.push([day, [item]]);
  }
  return groups;
}
