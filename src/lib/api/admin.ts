import type { Item } from "@/lib/types";
import { request } from "./client";

interface AdminItemQuery {
  status?: string;
}

export async function fetchAdminItems(query?: AdminItemQuery) {
  return request<Item[]>("/api/admin/items", { query });
}
