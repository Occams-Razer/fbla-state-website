import type { ItemListResponse } from "@/lib/types";
import { request } from "./client";

interface AdminItemQuery {
  status?: string;
  page?: number;
  limit?: number;
}

export async function fetchAdminItems(query?: AdminItemQuery) {
  return request<ItemListResponse>("/api/admin/items", {
    query: {
      page: 1,
      limit: 100,
      ...query,
    },
  });
}
