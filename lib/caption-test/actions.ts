"use server";

import {
  buildCaptionGenerateRequestBody,
  isLikelyUuid,
} from "@/lib/assignment5/caption-request-body";
import { postCaptionGenerate } from "@/lib/assignment5/server-caption-api";
import { createClient } from "@/lib/supabase/server";

export type CaptionRowBrief = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  image_id: string;
};

export type TestHumorFlavorState =
  | { status: "idle" }
  | { status: "error"; message: string; detail?: string }
  | {
      status: "success";
      httpStatus: number;
      apiResponse: unknown;
      captionsForImageAndFlavor: CaptionRowBrief[];
      recentCaptionsForFlavor: CaptionRowBrief[];
    };

export async function runHumorFlavorCaptionTest(
  _prev: TestHumorFlavorState,
  formData: FormData,
): Promise<TestHumorFlavorState> {
  const humorFlavorIdRaw = String(formData.get("humor_flavor_id") ?? "").trim();
  const imageId = String(formData.get("image_id") ?? "").trim();

  if (!humorFlavorIdRaw || !/^\d+$/.test(humorFlavorIdRaw)) {
    return { status: "error", message: "Invalid humor flavor id." };
  }
  const humorFlavorIdNum = Number(humorFlavorIdRaw);
  if (!Number.isInteger(humorFlavorIdNum) || humorFlavorIdNum < 1) {
    return { status: "error", message: "Invalid humor flavor id (not a positive integer)." };
  }

  if (!imageId) {
    return {
      status: "error",
      message: "Choose an image before generating captions.",
    };
  }
  if (!isLikelyUuid(imageId)) {
    return {
      status: "error",
      message: "Invalid image id (expected a UUID).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "You are not signed in." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    return {
      status: "error",
      message:
        "Could not read your Supabase session token. Sign out and sign in again.",
    };
  }

  const payload = buildCaptionGenerateRequestBody({
    imageId,
    humorFlavorId: humorFlavorIdRaw,
  });

  const api = await postCaptionGenerate(payload, accessToken);
  if (!api.ok) {
    return {
      status: "error",
      message:
        api.status === 0
          ? "Caption API request failed."
          : `Caption API returned ${api.status}.`,
      detail: api.bodyText.slice(0, 8000),
    };
  }

  const { data: forPair, error: pairErr } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("humor_flavor_id", humorFlavorIdRaw)
    .eq("image_id", imageId)
    .order("created_datetime_utc", { ascending: false })
    .limit(30);

  const { data: recent, error: recentErr } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("humor_flavor_id", humorFlavorIdRaw)
    .order("created_datetime_utc", { ascending: false })
    .limit(25);

  const captionsForImageAndFlavor = (
    pairErr ? [] : (forPair ?? [])
  ) as CaptionRowBrief[];
  const recentCaptionsForFlavor = (
    recentErr ? [] : (recent ?? [])
  ) as CaptionRowBrief[];

  return {
    status: "success",
    httpStatus: api.status,
    apiResponse: api.body,
    captionsForImageAndFlavor,
    recentCaptionsForFlavor,
  };
}
