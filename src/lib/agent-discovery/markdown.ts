import { CONTENT_SIGNAL_VALUE, SITE_ORIGIN } from "./constants";

const LLMS_MARKDOWN = `# Trackdub

> Local-first Windows desktop workstation for AI video dubbing. Translate, voice, and mix video into other languages with every stage inspectable and editable.

Trackdub runs the entire dubbing pipeline — ASR, translation, diarization, TTS voice cloning, alignment, and mix — on the user's machine by default. Cloud endpoints are strictly opt-in per project and per stage. Acceleration via DirectML, TensorRT RTX, CUDA, CoreML, Windows ML, or CPU fallback.

## Pages

- [Home](${SITE_ORIGIN}/): Product overview, pipeline, performance, pricing, and FAQ.
- [Pricing](${SITE_ORIGIN}/pricing): Free, Pro ($149 one-time), and Studio (in development). No subscriptions.
- [Docs](${SITE_ORIGIN}/docs): CLI usage, pipeline stages, execution providers, and the bundled model manifest.
- [Changelog](${SITE_ORIGIN}/changelog): Real, dated engineering milestones. Building in public pre-launch.
- [Privacy](${SITE_ORIGIN}/privacy): What Trackdub stores, what stays on your machine, and what is opt-in.
- [Guides](${SITE_ORIGIN}/guides): Index of practical AI video dubbing explainers.
- [AI dubbing guide](${SITE_ORIGIN}/guides/ai-dubbing-guide): How dubbing AI works stage by stage, buyer criteria, limitations, and how local compares to cloud.

## Agent discovery

- API catalog: ${SITE_ORIGIN}/.well-known/api-catalog
- MCP server card: ${SITE_ORIGIN}/.well-known/mcp/server-card.json
- Agent skills: ${SITE_ORIGIN}/.well-known/agent-skills/index.json
- Web Bot Auth directory: ${SITE_ORIGIN}/.well-known/http-message-signatures-directory
- Auth notes: ${SITE_ORIGIN}/auth.md
`;

const PAGE_MARKDOWN: Record<string, { title: string; description: string; body: string }> = {
  "/": {
    title: "Trackdub · Dub videos without giving up control",
    description:
      "A Windows desktop workstation for AI video dubbing. Translate, voice, and mix in one workflow.",
    body: LLMS_MARKDOWN,
  },
  "/pricing": {
    title: "Pricing · Trackdub",
    description:
      "Free, Pro ($149 one-time), and Studio (in development). No subscriptions, no per-minute billing.",
    body: `# Pricing · Trackdub

## Personal — Free

Commercial use allowed. Full desktop app, every pipeline stage, all languages and bundled models, CLI access. Exports watermarked, 5-minute max.

## Pro — $149

One-time purchase, 2 machine activations. Everything in Personal, no watermark, no duration limit, commercial use license, lifetime updates within v1.x.

## Studio — In development

Post-launch, not sold yet. Batch and multi-GPU processing, 4K-optimized export, commercial redistribution rights.

Join the waitlist: ${SITE_ORIGIN}/#waitlist
`,
  },
  "/docs": {
    title: "Docs · Trackdub",
    description: "CLI usage, pipeline stages, execution providers, and the bundled model manifest.",
    body: `# Docs · Trackdub

Trackdub ships as a local-first Windows desktop workstation and CLI. Pipeline stages (ASR, translation, diarization, TTS, alignment, mix) run on-device by default.

See also: ${SITE_ORIGIN}/llms.txt
`,
  },
  "/changelog": {
    title: "Changelog · Trackdub",
    description: "Dated engineering milestones. Building in public pre-launch.",
    body: `# Changelog · Trackdub

Public engineering milestones for Trackdub. See ${SITE_ORIGIN}/changelog for the rendered list.
`,
  },
  "/privacy": {
    title: "Privacy · Trackdub",
    description: "What Trackdub stores, what stays on your machine, and what is opt-in.",
    body: `# Privacy · Trackdub

Trackdub is local-first. Project media and pipeline artifacts stay on the user's machine by default. Cloud endpoints are opt-in. Full policy: ${SITE_ORIGIN}/privacy
`,
  },
  "/guides": {
    title: "Guides · Trackdub",
    description: "Practical AI video dubbing explainers.",
    body: `# Guides · Trackdub

- [AI dubbing guide](${SITE_ORIGIN}/guides/ai-dubbing-guide)
`,
  },
  "/guides/ai-dubbing-guide": {
    title: "AI dubbing guide · Trackdub",
    description: "How dubbing AI works stage by stage, buyer criteria, and local vs cloud.",
    body: `# AI dubbing guide · Trackdub

How AI video dubbing works stage by stage, buyer criteria, limitations, and how local processing compares to cloud. Full guide: ${SITE_ORIGIN}/guides/ai-dubbing-guide
`,
  },
};

function estimateTokens(text: string): number {
  // Rough GPT-style estimate used for x-markdown-tokens.
  return Math.max(1, Math.ceil(text.length / 4));
}

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept.split(",").map((part) => {
    const [type, ...params] = part.trim().split(";");
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q" && value) q = Number(value) || 0;
    }
    return { type: (type ?? "").trim().toLowerCase(), q };
  });

  const markdown = parts
    .filter((p) => p.type === "text/markdown" || p.type === "text/*" || p.type === "*/*")
    .sort((a, b) => b.q - a.q)[0];
  const html = parts.filter((p) => p.type === "text/html").sort((a, b) => b.q - a.q)[0];

  if (!markdown) return false;
  if (markdown.type === "text/markdown") {
    if (!html) return markdown.q > 0;
    return markdown.q >= html.q && markdown.q > 0;
  }
  return false;
}

export function requestPrefersMarkdown(request: Request): boolean {
  return request.method === "GET" && prefersMarkdown(request.headers.get("accept"));
}

function withFrontmatter(title: string, description: string, body: string): string {
  return `---
title: ${JSON.stringify(title).slice(1, -1)}
description: ${JSON.stringify(description).slice(1, -1)}
---

${body.trim()}\n`;
}

export function markdownForPath(pathname: string): Response | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const page = PAGE_MARKDOWN[normalized];
  if (!page) return null;

  const markdown = withFrontmatter(page.title, page.description, page.body);
  const tokens = estimateTokens(markdown);
  return new Response(markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
      vary: "accept",
      "x-markdown-tokens": String(tokens),
      "content-signal": CONTENT_SIGNAL_VALUE,
    },
  });
}

/** Strip scripts/styles and rough-convert HTML to Markdown when no curated page exists. */
export function htmlToRoughMarkdown(html: string, url: URL): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);

  let body = html;
  let previous = "";

  do {
    previous = body;
    body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, "");
  } while (body !== previous);

  do {
    previous = body;
    body = body.replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi, "");
  } while (body !== previous);

  do {
    previous = body;
    body = body.replace(/<(?:nav|footer)\b[^>]*>[\s\S]*?<\/(?:nav|footer)[^>]*>/gi, "");
  } while (body !== previous);

  body = body
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h1[^>]*>/gi, "\n# ")
    .replace(/<h2[^>]*>/gi, "\n## ")
    .replace(/<h3[^>]*>/gi, "\n### ")
    .replace(/<li[^>]*>/gi, "\n- ");

  do {
    previous = body;
    body = body.replace(/<[^>]+>/g, "");
  } while (body !== previous);

  const HTML_ENTITIES: Record<string, string> = {
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&#x27;": "'",
    "&quot;": '"',
    "&amp;": "&",
  };

  body = body
    .replace(/&(?:nbsp|lt|gt|#x27|quot|amp);/g, (match) => HTML_ENTITIES[match] ?? match)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (body.length > 12_000) body = `${body.slice(0, 12_000)}\n\n…`;

  return withFrontmatter(
    titleMatch?.[1]?.trim() || url.pathname,
    descMatch?.[1]?.trim() || "",
    body || `Content for ${url.href}`,
  );
}

export function markdownResponseFromHtml(html: string, url: URL): Response {
  const markdown = htmlToRoughMarkdown(html, url);
  return new Response(markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
      vary: "accept",
      "x-markdown-tokens": String(estimateTokens(markdown)),
      "content-signal": CONTENT_SIGNAL_VALUE,
    },
  });
}

export function rewriteAcceptForHtmlOrigin(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.set("accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8");
  return new Request(request, { headers });
}
