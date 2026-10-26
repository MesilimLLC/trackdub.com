import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DIRECTORY_MEDIA_TYPE,
  DIRECTORY_PATH,
  SIGNATURE_AGENT_HEADER_VALUE,
  generateEd25519PrivateJwk,
  httpMessageSignaturesDirectoryResponse,
  publicJwkFromPrivate,
  webBotAuthHeaders,
} from "./index";

test("directory publishes a signed Ed25519 JWKS", async () => {
  const privateJwk = await generateEd25519PrivateJwk();
  const request = new Request(`https://trackdub.com${DIRECTORY_PATH}`);
  const response = await httpMessageSignaturesDirectoryResponse(request, {
    WEB_BOT_AUTH_PRIVATE_JWK: JSON.stringify(privateJwk),
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /http-message-signatures-directory\+json/);
  assert.ok(response.headers.get("signature"));
  assert.match(response.headers.get("signature-input") ?? "", /http-message-signatures-directory/);
  assert.match(response.headers.get("signature-input") ?? "", /@authority/);

  const body = (await response.json()) as { keys: Array<{ kty?: string; crv?: string; x?: string; d?: string }> };
  assert.equal(body.keys.length, 1);
  assert.deepEqual(body.keys[0], publicJwkFromPrivate(privateJwk));
  assert.equal((body.keys[0] as { d?: string }).d, undefined);
});

test("outbound bot requests include Signature-Agent and Signature-Input", async () => {
  const privateJwk = await generateEd25519PrivateJwk();
  const headers = await webBotAuthHeaders("https://example.com/robots.txt", { method: "GET" }, {
    WEB_BOT_AUTH_PRIVATE_JWK: JSON.stringify(privateJwk),
  });

  assert.equal(headers["Signature-Agent"], SIGNATURE_AGENT_HEADER_VALUE);
  assert.match(headers["Signature-Input"], /web-bot-auth/);
  assert.match(headers["Signature-Input"], /@authority/);
  assert.match(headers["Signature-Input"], /signature-agent/);
  assert.match(headers.Signature, /^sig/);
});

test("directory media type constant matches the well-known path", () => {
  assert.equal(DIRECTORY_PATH, "/.well-known/http-message-signatures-directory");
  assert.equal(DIRECTORY_MEDIA_TYPE, "application/http-message-signatures-directory+json");
});
