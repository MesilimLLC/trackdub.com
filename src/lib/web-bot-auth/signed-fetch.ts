import { generateNonce, sign } from "web-bot-auth";

import { SIGNATURE_AGENT_HEADER_VALUE, type WebBotAuthEnv, loadSigner } from "./keys";

const REQUEST_TTL_MS = 300_000;

export async function signedFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  env?: WebBotAuthEnv,
): Promise<Response> {
  const request = new Request(input, init);
  request.headers.set("Signature-Agent", SIGNATURE_AGENT_HEADER_VALUE);

  const now = new Date();
  const fields = await sign(request, {
    signer: await loadSigner(env),
    created: now,
    expires: new Date(now.getTime() + REQUEST_TTL_MS),
    nonce: generateNonce(),
  });

  request.headers.set("Signature", fields.signature);
  request.headers.set("Signature-Input", fields.signatureInput);
  return fetch(request);
}

export async function webBotAuthHeaders(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  env?: WebBotAuthEnv,
): Promise<{ "Signature-Agent": string; Signature: string; "Signature-Input": string }> {
  const request = new Request(input, init);
  request.headers.set("Signature-Agent", SIGNATURE_AGENT_HEADER_VALUE);

  const now = new Date();
  const fields = await sign(request, {
    signer: await loadSigner(env),
    created: now,
    expires: new Date(now.getTime() + REQUEST_TTL_MS),
    nonce: generateNonce(),
  });

  return {
    "Signature-Agent": SIGNATURE_AGENT_HEADER_VALUE,
    Signature: fields.signature,
    "Signature-Input": fields.signatureInput,
  };
}
