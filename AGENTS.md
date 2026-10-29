<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Linear (agents)

Track work in Linear workspace [mesalimllc](https://linear.app/mesalimllc) under project **Marketing Site** (label `repo:web`). Agents must search/create/update Linear issues autonomously as progress is made. Link Figma Design System and Notion Specs on visual work. See public-core `docs/operations/linear-workflow.md` when available.

## Cursor Cloud specific instructions

TanStack Start / Vite / Bun / Cloudflare. Local: `bun install`, then `bun run dev` or `bun run build`.

- Install with Bun (lockfile is `bun.lock`), not npm.
- Secrets often needed for full local/cloud runs: `WEB_BOT_AUTH_PRIVATE_JWK` (`.dev.vars`), plus `TURNSTILE_SECRET`, `SITE_KEY`, `RESEND_API_KEY` (`.env`). Put these in Cursor Secrets for cloud agents; do not commit values.
- Deploy path: `bun run deploy` (build + wrangler). Prefer verifying with `bun run build` in agents unless deploy is explicitly requested.

## Website reliability

- Keep boot monitoring as an inline, dependency-free head script with bounded offline delivery directly to an insert-only Cloud table; it must run when the application bundle fails, collect no visitor identifiers or free-text errors, and never block rendering.
- Reliability event rows and daily aggregates have no public read policy; review trends through the project's Backend, not a public dashboard.
- Keep server-rendered content readable without JavaScript, delay the splash on fast loads, and load waitlist verification near its viewport; optional work must not block the first screen.
- Serve the desktop screenshot as lossless WebP with lazy loading and fixed dimensions; preserve inspectable UI detail while reducing transfer size.
