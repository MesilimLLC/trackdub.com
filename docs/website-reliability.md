# Website reliability monitoring

In the project's **Backend**, open `website_reliability_events` to review individual records. `website_reliability_daily` groups counts and average elapsed time by UTC day, page category, event, and failure category. Neither is publicly readable.

Events: `retry_shown` (12-second boot timeout or an immediately detected script/stylesheet failure), `load_failure` (boot script/stylesheet/runtime or page boundary failure), `retry_clicked`, and `load_recovered` (app mounts after a problem). These are event counts, not unique visitors or a failure-rate denominator; healthy visits send nothing.

The splash waits 800 ms before appearing so fast loads do not flash or cover readable HTML. It disappears immediately when the application mounts. Without JavaScript, the splash stays hidden and server-rendered content remains readable. The waitlist security script loads only as its form approaches the viewport.

Delivery is best-effort, non-blocking, and deduplicated by event UUID. A maximum of 12 pending events are kept locally for seven days and retried on reopening or connectivity recovery. Script-blocking, an unreachable initial HTML document, disabled JavaScript, or storage cleared before delivery cannot be monitored by this script. No background uptime checks are included.

Records omit full URLs, query strings, error messages, user identifiers, IP addresses, browser details, and media. Hosting providers may retain ordinary request metadata separately. Stored event history remains until deleted by the project owner. Preview tests also enter this history; this is a diagnostic log, not audited analytics.