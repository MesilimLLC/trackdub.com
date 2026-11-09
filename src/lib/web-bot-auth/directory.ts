import { appendSignature, component, createSignature } from "http-message-sig";
import { generateNonce } from "web-bot-auth";

import { DIRECTORY_MEDIA_TYPE, type WebBotAuthEnv, directoryJwks, loadSigner } from "./keys";

const DIRECTORY_TAG = "http-message-signatures-directory";
const DIRECTORY_TTL_MS = 300_000;

export async function httpMessageSignaturesDirectoryResponse(
  request: Request,
  env?: WebBotAuthEnv,
): Promise<Response> {
  const body = JSON.stringify(await directoryJwks(env), null, 2) + "\n";
  const headers = new Headers({
    "content-type": DIRECTORY_MEDIA_TYPE,
    "cache-control": "public, max-age=86400",
    "access-control-allow-origin": "*",
  });

  const unsigned = new Response(request.method === "HEAD" ? null : body, {
    status: 200,
    headers,
  });

  const now = new Date();
  const signer = await loadSigner(env);
  const fields = await createSignature(
    {
      kind: "response",
      status: 200,
      fields: [{ name: "content-type", value: DIRECTORY_MEDIA_TYPE }],
      request,
    },
    {
      label: "sig1",
      components: [component("@authority", { req: true })],
      parameters: {
        alg: "ed25519",
        keyid: signer.keyid,
        created: Math.floor(now.getTime() / 1000),
        expires: Math.floor((now.getTime() + DIRECTORY_TTL_MS) / 1000),
        nonce: generateNonce(),
        tag: DIRECTORY_TAG,
      },
      signer,
    },
  );
  const signedHeaders = appendSignature(new Headers(unsigned.headers), fields);
  return new Response(unsigned.body, {
    status: unsigned.status,
    headers: signedHeaders,
  });
}
