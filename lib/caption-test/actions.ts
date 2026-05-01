"use server";

import { cookies, headers } from "next/headers";

import {
  buildCaptionGenerateRequestBody,
  isLikelyUuid,
} from "@/lib/assignment5/caption-request-body";
import { postCaptionGenerate } from "@/lib/assignment5/server-caption-api";
import {
  detectStepFlavorColumn,
  loadStepsForFlavor,
} from "@/lib/humor-flavor-steps/actions";
import { isFlavorChainComplete } from "@/lib/humor-flavor-steps/step-complete";
import type { HumorFlavorStepRow } from "@/lib/humor-flavor-steps/types";
import { createClient } from "@/lib/supabase/server";

export type CaptionRowBrief = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  image_id: string;
};

export type TestHumorFlavorState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      detail?: string;
      requestPayload?: unknown;
    }
  | {
      status: "success";
      httpStatus: number;
      apiResponse: unknown;
      requestPayload: unknown;
      captionsForImageAndFlavor: CaptionRowBrief[];
      recentCaptionsForFlavor: CaptionRowBrief[];
    };

function stepSignature(step: HumorFlavorStepRow): string {
  return [
    step.llm_input_type_id,
    step.llm_output_type_id,
    step.humor_flavor_step_type_id,
    step.llm_model_id,
  ].join(":");
}

function chainSignature(steps: HumorFlavorStepRow[]): string {
  return [...steps]
    .sort((a, b) => (a.order_by === b.order_by ? a.id - b.id : a.order_by - b.order_by))
    .map((s) => stepSignature(s))
    .join(">");
}

async function loadKnownWorkingChainSignatures(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data: recentCaptionRows } = await supabase
    .from("captions")
    .select("humor_flavor_id")
    .not("humor_flavor_id", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(3000);
  const flavorIds = [
    ...new Set(
      (recentCaptionRows ?? [])
        .map((r) => r.humor_flavor_id)
        .filter((v): v is number => typeof v === "number"),
    ),
  ];
  if (flavorIds.length === 0) return new Set<string>();

  const stepFlavorColumn = await detectStepFlavorColumn(
    supabase,
    String(flavorIds[0]),
  );
  const filterValues =
    stepFlavorColumn === "humor_flavor_id"
      ? flavorIds
      : flavorIds.map((id) => String(id));
  const { data: rows } = await supabase
    .from("humor_flavor_steps")
    .select("*")
    .in(stepFlavorColumn, filterValues);

  const byFlavor = new Map<string, HumorFlavorStepRow[]>();
  for (const row of (rows ?? []) as HumorFlavorStepRow[]) {
    const key = String((row as unknown as Record<string, unknown>)[stepFlavorColumn] ?? "");
    if (!key) continue;
    const list = byFlavor.get(key) ?? [];
    list.push(row);
    byFlavor.set(key, list);
  }

  const signatures = new Set<string>();
  for (const steps of byFlavor.values()) {
    if (!isFlavorChainComplete(steps)) continue;
    signatures.add(chainSignature(steps));
  }
  return signatures;
}

export async function runHumorFlavorCaptionTest(
  _prev: TestHumorFlavorState,
  formData: FormData,
): Promise<TestHumorFlavorState> {
  const humorFlavorIdRaw = String(formData.get("humor_flavor_id") ?? "").trim();
  const imageId = String(formData.get("image_id") ?? "").trim();

  if (typeof humorFlavorIdRaw !== "string" || humorFlavorIdRaw.length === 0) {
    return { status: "error", message: "Invalid humor flavor id." };
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

  // Same helper as admin layout: `createClient()` → `connection()` + cookie-aware `createServerClient`.
  const supabase = await createClient();

  const cookieStore = await cookies();
  const headerList = await headers();
  const storeCookies = cookieStore.getAll();
  const rawCookieHeader = headerList.get("cookie");
  console.log("[caption-test/auth] incoming request cookies", {
    cookieStoreCount: storeCookies.length,
    cookieStoreSupabaseNames: storeCookies
      .map((c) => c.name)
      .filter((n) => n.includes("sb-")),
    hasCookieHeader: Boolean(rawCookieHeader && rawCookieHeader.length > 0),
    cookieHeaderLength: rawCookieHeader?.length ?? 0,
  });

  const {
    data: getUserData,
    error: getUserError,
  } = await supabase.auth.getUser();
  const user = getUserData.user;

  const {
    data: getSessionData,
    error: getSessionError,
  } = await supabase.auth.getSession();
  let session = getSessionData.session;

  console.log("[caption-test/auth] supabase.auth", {
    getUser: {
      hasUser: Boolean(user),
      userId: user?.id ?? null,
      error: getUserError?.message ?? null,
    },
    getSession: {
      hasSession: Boolean(session),
      hasAccessToken: Boolean(session?.access_token),
      error: getSessionError?.message ?? null,
    },
  });

  if (!user) {
    return { status: "error", message: "You are not signed in." };
  }

  let accessToken = session?.access_token;
  if (!accessToken) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();
    session = refreshed.session ?? session;
    accessToken = session?.access_token;
    console.log("[caption-test/auth] refreshSession after missing access_token", {
      hasAccessToken: Boolean(accessToken),
      error: refreshError?.message ?? null,
    });
  }

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

  const steps = await loadStepsForFlavor(supabase, humorFlavorIdRaw);
  if (!isFlavorChainComplete(steps)) {
    return {
      status: "error",
      message:
        steps.length === 0
          ? `No prompt steps found for flavor ${humorFlavorIdRaw}. Add and complete steps before generating captions.`
          : `Flavor ${humorFlavorIdRaw} has incomplete prompt steps. Every step needs non-empty system and user prompts plus all required model and type IDs (and valid order_by) before generating captions.`,
      requestPayload: payload,
    };
  }
  const workingChainSignatures = await loadKnownWorkingChainSignatures(supabase);
  if (workingChainSignatures.size > 0) {
    const thisChain = chainSignature(steps);
    if (!workingChainSignatures.has(thisChain)) {
      return {
        status: "error",
        message:
          `Flavor ${humorFlavorIdRaw} step structure does not match known-working templates.`,
        detail:
          "Use 'Copy steps from known-working flavor' and keep step type/model/input/output IDs aligned. Only edit humor wording in prompts.",
        requestPayload: payload,
      };
    }
  }

  const api = await postCaptionGenerate(payload, accessToken);
  if (!api.ok) {
    return {
      status: "error",
      message:
        api.status === 0
          ? "Caption API request failed."
          : `Caption API returned ${api.status}.`,
      detail: api.bodyText.slice(0, 8000),
      requestPayload: payload,
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
    requestPayload: payload,
    captionsForImageAndFlavor,
    recentCaptionsForFlavor,
  };
}
