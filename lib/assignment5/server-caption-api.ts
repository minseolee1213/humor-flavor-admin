import "server-only";

import type { CaptionGenerateRequestBody } from "@/lib/assignment5/caption-request-body";

export type CaptionApiSuccess = {
  ok: true;
  status: number;
  body: unknown;
};

export type CaptionApiFailure = {
  ok: false;
  status: number;
  bodyText: string;
};

const DEFAULT_CAPTION_API_URL =
  "https://api.almostcrackd.ai/pipeline/generate-captions";

/**
 * POST to Assignment 5 caption API. Runs only on the server.
 *
 * `accessToken` must be the logged-in user's Supabase JWT (`session.access_token`),
 * sent as `Authorization: Bearer <token>`.
 *
 * `ASSIGNMENT5_CAPTION_API_URL` overrides the URL; default matches Assignment 5.
 */
export async function postCaptionGenerate(
  payload: CaptionGenerateRequestBody,
  accessToken: string,
): Promise<CaptionApiSuccess | CaptionApiFailure> {
  const url =
    process.env.ASSIGNMENT5_CAPTION_API_URL?.trim() || DEFAULT_CAPTION_API_URL;

  const token = accessToken.trim();
  if (!token) {
    return {
      ok: false,
      status: 0,
      bodyText: "No Supabase session access token. Sign in again.",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Server log only (terminal); payload is the JSON body (no Authorization).
  console.log(
    "[caption-api] outgoing payload:",
    JSON.stringify(payload),
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, status: 0, bodyText: msg };
  }

  const bodyText = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, bodyText };
  }

  let body: unknown = bodyText;
  try {
    body = bodyText.length > 0 ? JSON.parse(bodyText) : null;
  } catch {
    body = { _raw_text: bodyText };
  }

  return { ok: true, status: res.status, body };
}
