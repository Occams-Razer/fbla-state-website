import type { Claim, ClaimStatus, Item, ItemStatus } from "./domain";

export type ItemSortOrder = "newest" | "oldest";

export interface ItemListQuery {
  search?: string;
  category?: string;
  sort?: ItemSortOrder;
}

export interface CreateItemInput {
  title: string;
  category: string;
  imageUrl: string;
  description?: string;
  location?: string;
  dateFound?: string;
  submitterName?: string;
  submitterEmail?: string;
}

export interface UpdateItemStatusInput {
  status: ItemStatus;
}

export interface CreateClaimInput {
  itemId: string;
  name: string;
  email: string;
  proofOfOwnership: string;
  locationLost: string;
}

export interface UpdateClaimStatusInput {
  status: ClaimStatus;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  authenticated: boolean;
  username?: string;
}

export interface UploadImageResponse {
  url: string;
}

export interface MutationMessage {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

/** Public catalog + admin item queues return this shape (paginated). */
export interface ItemListResponse {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClaimsListResponse {
  claims: Claim[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClaimStatusLookupResponse {
  claimId: string;
  status: ClaimStatus;
  createdAt: string;
  item: {
    id: string;
    title: string;
    itemStatus: ItemStatus;
  } | null;
}
