/** Matches PostgREST `humor_flavors` (connected schema). */
export type HumorFlavorRow = {
  id: number;
  created_datetime_utc: string;
  description: string | null;
  slug: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  modified_datetime_utc: string;
  is_pinned?: boolean;
};
