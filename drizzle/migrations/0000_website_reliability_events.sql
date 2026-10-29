CREATE TABLE public.website_reliability_events (
  id uuid PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('retry_shown', 'load_failure', 'retry_clicked', 'load_recovered')),
  page text NOT NULL CHECK (page IN ('home', 'privacy', 'guide', 'pricing', 'docs', 'changelog', 'other')),
  elapsed_ms integer NOT NULL CHECK (elapsed_ms BETWEEN 0 AND 3600000),
  failure_kind text NOT NULL DEFAULT 'none' CHECK (failure_kind IN ('none', 'script', 'stylesheet', 'runtime', 'boundary'))
);
GRANT INSERT (id, event_type, page, elapsed_ms, failure_kind) ON public.website_reliability_events TO anon, authenticated;
GRANT ALL ON public.website_reliability_events TO service_role;
ALTER TABLE public.website_reliability_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accept bounded anonymous reliability events" ON public.website_reliability_events FOR INSERT TO anon, authenticated WITH CHECK (
  event_type IN ('retry_shown', 'load_failure', 'retry_clicked', 'load_recovered')
  AND page IN ('home', 'privacy', 'guide', 'pricing', 'docs', 'changelog', 'other')
  AND elapsed_ms BETWEEN 0 AND 3600000
  AND ((event_type = 'load_failure' AND failure_kind IN ('script', 'stylesheet', 'runtime', 'boundary')) OR (event_type <> 'load_failure' AND failure_kind = 'none'))
);
CREATE INDEX website_reliability_events_received_at_idx ON public.website_reliability_events (received_at DESC);
CREATE VIEW public.website_reliability_daily WITH (security_invoker = true) AS
SELECT date_trunc('day', received_at) AS day, page, event_type, failure_kind, count(*) AS events, round(avg(elapsed_ms)) AS average_elapsed_ms
FROM public.website_reliability_events GROUP BY 1, 2, 3, 4;
REVOKE ALL ON public.website_reliability_daily FROM anon, authenticated;
GRANT SELECT ON public.website_reliability_daily TO service_role;