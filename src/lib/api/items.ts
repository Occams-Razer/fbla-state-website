import type {
  CreateItemInput,
  Item,
  ItemListQuery,
  MutationMessage,
  UpdateItemStatusInput,
} from "@/lib/types";
import { request } from "./client";

export async function fetchItems(query?: ItemListQuery) {
  return request<Item[]>("/api/items", { query });
}

export async function fetchItemById(itemId: string) {
  return request<Item>(`/api/items/${itemId}`);
}

export async function createItem(payload: CreateItemInput) {
  return request<Item>("/api/items", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function updateItemStatus(itemId: string, payload: UpdateItemStatusInput) {
  return request<Item>(`/api/items/${itemId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export async function archiveItem(itemId: string) {
  return request<MutationMessage>(`/api/items/${itemId}`, {
    method: "DELETE",
  });
}
