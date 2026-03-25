/** Matches PostgREST `humor_flavors` (from live OpenAPI); `id` may arrive as number or string from the client. */
export type HumorFlavorRow = {
  id: number;
  created_datetime_utc: string;
  description: string | null;
  slug: string;
  created_by_user_id: string;
  modified_by_user_id: string;
  modified_datetime_utc: string;
};
