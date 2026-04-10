import type {
  Claim,
  ClaimsListResponse,
  CreateClaimInput,
  MutationMessage,
  UpdateClaimStatusInput,
} from "@/lib/types";
import { request } from "./client";

export async function fetchClaims(query?: { page?: number; limit?: number }) {
  return request<ClaimsListResponse>("/api/claims", {
    query: {
      page: 1,
      limit: 100,
      ...query,
    },
  });
}

export async function createClaim(payload: CreateClaimInput) {
  return request<Claim & { message?: string }>("/api/claims", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function updateClaimStatus(claimId: string, payload: UpdateClaimStatusInput) {
  return request<Claim>(`/api/claims/${claimId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export async function deleteClaim(claimId: string) {
  return request<MutationMessage>(`/api/claims/${claimId}`, {
    method: "DELETE",
  });
}

export async function clearClaimsByStatus(status: "APPROVED" | "REJECTED") {
  return request<{ cleared: number }>(`/api/claims?status=${status}`, {
    method: "DELETE",
  });
}
