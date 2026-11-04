#!/usr/bin/env node
/**
 * Apply DNS-AID HTTPS records + ensure Markdown for Agents for trackdub.com.
 *
 * Requires Wrangler OAuth or CLOUDFLARE_API_TOKEN with:
 * - Zone:Read, Zone:Edit (DNS)
 * - Zone Settings:Edit (content_converter)
 *
 * Usage:
 *   node scripts/apply-agent-dns.mjs
 */
import { execSync } from "node:child_process";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "21cac5947e11018d571c18792118b8b0";
const ZONE_NAME = "trackdub.com";

function api(path, { method = "GET", body } = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is required (run wrangler login, or export a Zone-capable token)",
    );
  }
  return fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const data = await res.json();
    if (!data.success) {
      const msg = (data.errors || []).map((e) => e.message).join("; ") || res.statusText;
      const endpoint = path.split("?")[0];
      throw new Error(`${method} ${endpoint}: ${msg}`);
    }
    return data;
  });
}

async function getZoneId() {
  const data = await api(`/zones?name=${ZONE_NAME}&account.id=${ACCOUNT_ID}`);
  const zone = data.result?.[0];
  if (!zone) throw new Error(`Zone ${ZONE_NAME} not found for account`);
  return zone.id;
}

async function upsertHttpsRecord(zoneId, name, target, svcParams) {
  const fqdn = name.endsWith(".") ? name : `${name}.${ZONE_NAME}`;
  const list = await api(
    `/zones/${zoneId}/dns_records?type=HTTPS&name=${encodeURIComponent(fqdn)}`,
  );
  const existing = list.result?.[0];
  const payload = {
    type: "HTTPS",
    name,
    ttl: 3600,
    data: {
      priority: 1,
      target,
      value: svcParams,
    },
  };

  if (existing) {
    console.log(`Updating HTTPS ${fqdn}`);
    await api(`/zones/${zoneId}/dns_records/${existing.id}`, { method: "PUT", body: payload });
  } else {
    console.log(`Creating HTTPS ${fqdn}`);
    await api(`/zones/${zoneId}/dns_records`, { method: "POST", body: payload });
  }
}

async function enableMarkdownForAgents(zoneId) {
  console.log("Enabling Markdown for Agents (content_converter=on)");
  await api(`/zones/${zoneId}/settings/content_converter`, {
    method: "PATCH",
    body: { value: "on" },
  });
}

async function main() {
  // Prefer freshly logged-in wrangler token if env token lacks zone perms.
  try {
    const whoami = execSync("npx wrangler whoami", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(whoami.split("\n").slice(0, 12).join("\n"));
  } catch {
    console.warn("wrangler whoami failed; continuing with CLOUDFLARE_API_TOKEN");
  }

  const zoneId = await getZoneId();
  console.log("zone", zoneId);

  // Organizational index + MCP agent entry (DNS-AID / RFC 9460 HTTPS).
  await upsertHttpsRecord(zoneId, "_index._agents", "trackdub.com", 'alpn="h2,h3" port=443');
  await upsertHttpsRecord(zoneId, "_mcp._agents", "trackdub.com", 'alpn="h2,h3" port=443');

  try {
    await enableMarkdownForAgents(zoneId);
  } catch (error) {
    console.warn(
      "Markdown for Agents setting skipped:",
      error instanceof Error ? error.message : error,
    );
    console.warn(
      "Enable manually: Dashboard → trackdub.com → AI Crawl Control → Markdown for Agents",
    );
  }

  console.log("Done. Verify:");
  console.log("  dig HTTPS _index._agents.trackdub.com");
  console.log("  dig HTTPS _mcp._agents.trackdub.com");
  console.log('  curl -sI -H "Accept: text/markdown" https://trackdub.com/');
}

main().catch((error) => {
  console.error(
    "apply-agent-dns failed:",
    error instanceof Error ? error.message : "Unexpected error",
  );
  process.exitCode = 1;
});
