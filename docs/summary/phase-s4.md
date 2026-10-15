# Phase S4 — Monthly trigger and push

**Status:** 🔨 Built — awaiting your review

## Goal
On the 1st of each month, the Brewsletter for the month just ended generates by itself. Once every part of it is done, it's published and every bro gets a push that opens it.

Numbers stay live (`monthly_stats`, S2). There's no snapshot of them.

## Flow
```
1st, 14:00 UTC (9am Chicago in summer, 8am in winter) — pg_cron job "brewsletter"
  select start_brewsletter()                      → previous month, Chicago time
     ├─ POST /functions/v1/insights { month }   → every bro + every new coffee (unchanged fan-out)
     └─ POST /functions/v1/showcase { month }   → the group photo (or "skipped" with none)

Each run that succeeds (bro, coffee, showcase) then calls
  publish_report(month)
     └─ complete? → insert monthly_reports (month)   (on conflict do nothing: one winner)
                       └─ Database Webhook → notify → "The September Brewsletter is in" → /reports/2026-09
```

## Data: `supabase/migrations/015_monthly_reports.sql`
- **`monthly_reports`:** the publish record, just `month` (primary key, first day of the month) and `published_at`.
  - RLS: every bro can read. Only the service role writes.
  - It's added to the Realtime publication, so an open app shows the new Brewsletter and its unread badge straight away.
  - **Backfill:** every month that already has a successful insight run gets a row, so the existing list stays the same. Run the migration **before** creating the webhook, or the backfill sends pushes.
- **`publish_report(p_month date) returns boolean`:** publishes when the month is complete, and returns whether this call published it. Complete means all of:
  - every bro has a succeeded `insight_runs` row for the month;
  - every roast in `month_new_roasts` has a succeeded `roast_insights` row;
  - the month has a `showcase_runs` row that `succeeded` or was `skipped`.
- **`start_brewsletter(p_month text default <previous month in Chicago>)`:** POSTs `{ month }` to `insights` and to `showcase` with `pg_net`. It reads the project URL and the secret from **Vault**, so neither is in git. Call it by hand to force a run: `select start_brewsletter('2026-09');`
- **Cron:** `cron.schedule('brewsletter', '0 14 1 * *', 'select start_brewsletter()')`.
- Both functions are callable only by the service role and `postgres` (execute revoked from `anon` and `authenticated`).

## Edge Functions
- **`insights`:** after a bro's or a coffee's run succeeds, it calls `publish_report`. The fan-out and dry runs don't.
- **`showcase`:** after a run succeeds or is skipped, it calls `publish_report`.
- **`notify`:** gains a `monthly_reports` message.
  - **Title:** "The September Brewsletter is in".
  - **Body:** "Showcase, stats and everyone's insights".
  - **URL:** `/reports/2026-09`.
  - Inserts with no bro (this one) go to **every** device. The message lives for a day rather than an hour, since a report doesn't go stale like "is brewing".

## App
- **`fetchReportMonths`** reads `monthly_reports` instead of `insight_runs`, so a half-finished month never shows in the list or lights the badge.
- **Realtime:** a `monthly_reports` change refreshes the months list.

## Reruns and failures
- **A failed run** (a bro, a coffee, or the showcase) holds back publishing. Rerun it with the S1 or B1 curl. When it succeeds, it publishes the month and the push goes out.
- **Rerunning anything in an already-published month** changes what's shown but sends no second push (the insert conflicts).
- **Running a month by hand before it's over** publishes it as soon as it's complete. Only run past months.

## You provide
1. **Vault secrets** (SQL editor, once):
   ```sql
   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
   select vault.create_secret('<INSIGHTS_SECRET>', 'insights_secret');
   ```
2. **Run 015** (it enables `pg_cron` and schedules the job).
3. **Deploy** `insights`, `showcase` and `notify` (all with `--no-verify-jwt`).
4. **Create a fifth Database Webhook:** `monthly_reports`, Insert, POST to `notify` with the `x-notify-secret` header, the same as the other four (`docs/push/phase-p2.md`).

## Verification
1. **Before forcing a run:** the Brewsletters list shows the same months as before.
2. **Force a run for a month that has no row yet.** Delete its row if needed: `delete from monthly_reports where month = '2026-09-01';` Then run `select start_brewsletter('2026-09');`
   - `insight_runs`, `roast_insights` and `showcase_runs` fill in.
   - Exactly one `monthly_reports` row appears once the last run finishes.
   - One push arrives on a phone and opens `/reports/2026-09`.
3. **Rerun one bro** with the S1 curl: no second push.
4. **Cron:** `select * from cron.job where jobname = 'brewsletter';` shows the schedule. After the 1st, check `cron.job_run_details`.
