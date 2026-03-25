/**
 * Assignment 5 Step 4 caption API — request body (exact contract).
 *
 * POST with `Content-Type: application/json` and camelCase keys only:
 * - `imageId` (UUID string)
 * - `humorFlavorId` (number)
 *
 * Do not send snake_case or `profile_id` on this request.
 */
export type CaptionGenerateRequestBody = {
  imageId: string;
  humorFlavorId: number;
};

export function buildCaptionGenerateRequestBody(input: {
  imageId: string;
  humorFlavorId: string;
}): CaptionGenerateRequestBody {
  const humorFlavorId = Number(input.humorFlavorId);
  return {
    imageId: input.imageId,
    humorFlavorId,
  };
}

/** Hyphenated UUID string (matches typical Postgres `uuid` text form). */
export function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}
