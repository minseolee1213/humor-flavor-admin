/**
 * Assignment 5 Step 4 caption API — request body (exact contract).
 *
 * POST with `Content-Type: application/json` and camelCase keys only:
 * - `imageId` (UUID string)
 * - `humorFlavorId` (UUID string)
 *
 * Do not send snake_case or `profile_id` on this request.
 */
export type CaptionGenerateRequestBody = {
  imageId: string;
  humorFlavorId: string;
};

export function buildCaptionGenerateRequestBody(input: {
  imageId: string;
  humorFlavorId: string;
}): CaptionGenerateRequestBody {
  return {
    imageId: input.imageId,
    humorFlavorId: input.humorFlavorId,
  };
}

/** Hyphenated UUID string (matches typical Postgres `uuid` text form). */
export function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}
