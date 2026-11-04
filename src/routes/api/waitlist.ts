import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

type CloudflareEnv = {
  WAITLIST_DB?: {
    prepare: (sql: string) => {
      bind: (...args: unknown[]) => { run: () => Promise<unknown> };
    };
  };
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

const bodySchema = z.object({
  email: z.string().trim().min(3).max(320).email(),
  turnstileToken: z.string().min(1),
  interest: z.enum(["personal", "pro", "studio"]).optional(),
});

const DEFAULT_FROM = "Trackdub <noreply@trackdub.com>";

// trackdub.dev (ChatGPT Sites) has no server bindings of its own, so its
// waitlist form posts cross-origin to this canonical API. Everything else
// (same-origin requests, curl, etc.) needs no CORS header at all.
const ALLOWED_ORIGINS = new Set(["https://trackdub.dev", "https://www.trackdub.dev"]);

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

const INTEREST_LABEL: Record<"personal" | "pro" | "studio", string> = {
  personal: "Personal",
  pro: "Pro",
  studio: "Studio",
};

async function verifyTurnstile(token: string, secret: string, remoteIp: string) {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

async function sendWaitlistConfirmation(
  apiKey: string,
  from: string,
  to: string,
  interest: "personal" | "pro" | "studio" | null,
) {
  const interestLabel = interest ? INTEREST_LABEL[interest] : null;
  const planLineText = interestLabel
    ? `We'll reach out when the ${interestLabel} track opens up.`
    : "We'll reach out when Pro is ready.";
  const planLineHtml = interestLabel
    ? `We'll reach out when the <strong>${interestLabel}</strong> track opens up.`
    : "We'll reach out when Pro is ready.";
  const subject = "You're on the Trackdub waitlist";
  const text = ["Thanks for joining the Trackdub waitlist.", planLineText, "— Trackdub"].join(" ");
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5ede0;color:#23170f;font-family:-apple-system,BlinkMacSystemFont,'IBM Plex Sans',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <h1 style="font-family:Georgia,'Instrument Serif',serif;font-size:32px;line-height:1.1;margin:0 0 16px;color:#23170f;font-weight:400;">
        You're on the list.
      </h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 12px;color:#3b2a1c;">
        Thanks for joining the Trackdub waitlist. ${planLineHtml}
      </p>
      <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6b5847;">
        — Trackdub
      </p>
    </div>
  </body>
</html>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`resend ${res.status}: ${detail.slice(0, 500)}`);
  }
}

export const Route = createFileRoute("/api/waitlist")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => {
        const origin = request.headers.get("origin");
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        const cors = corsHeaders(origin);
        const env = (globalThis as { __env__?: CloudflareEnv }).__env__;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Invalid request body" },
            { status: 400, headers: cors },
          );
        }

        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" },
            { status: 400, headers: cors },
          );
        }
        const { email, turnstileToken, interest } = parsed.data;

        const turnstileSecret = env?.TURNSTILE_SECRET;
        if (!turnstileSecret) {
          console.error("[waitlist] Missing TURNSTILE_SECRET binding");
          return Response.json(
            { ok: false, error: "Server misconfigured" },
            { status: 500, headers: cors },
          );
        }

        const remoteIp = request.headers.get("cf-connecting-ip") ?? "";
        const human = await verifyTurnstile(turnstileToken, turnstileSecret, remoteIp);
        if (!human) {
          return Response.json(
            { ok: false, error: "Verification failed" },
            { status: 403, headers: cors },
          );
        }

        const db = env?.WAITLIST_DB;
        if (!db) {
          console.error("[waitlist] Missing WAITLIST_DB binding");
          return Response.json(
            { ok: false, error: "Server misconfigured" },
            { status: 500, headers: cors },
          );
        }

        try {
          await db
            .prepare(
              `INSERT INTO waitlist_emails (email, interest) VALUES (?, ?)
               ON CONFLICT(email) DO UPDATE SET interest = excluded.interest
               WHERE excluded.interest IS NOT NULL`,
            )
            .bind(email.toLowerCase(), interest ?? null)
            .run();
        } catch (err) {
          console.error("[waitlist] D1 insert failed", err);
          return Response.json(
            { ok: false, error: "Could not save email" },
            { status: 500, headers: cors },
          );
        }

        // Email confirmation is non-blocking: the D1 row is already saved, so a
        // Resend failure must not undo the signup. We log and move on; the user
        // is still on the waitlist regardless of whether the email lands.
        const apiKey = env?.RESEND_API_KEY;
        if (!apiKey) {
          console.warn("[waitlist] RESEND_API_KEY missing; skipping confirmation email");
        } else {
          const from = env?.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
          try {
            await sendWaitlistConfirmation(apiKey, from, email.toLowerCase(), interest ?? null);
          } catch (err) {
            console.error("[waitlist] Resend send failed; DB row preserved", err);
          }
        }

        return Response.json({ ok: true }, { headers: cors });
      },
    },
  },
});
