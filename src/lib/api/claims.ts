import type {
  Claim,
  CreateClaimInput,
  MutationMessage,
  UpdateClaimStatusInput,
} from "@/lib/types";
import { request } from "./client";

export async function fetchClaims() {
  return request<Claim[]>("/api/claims");
}

export async function createClaim(payload: CreateClaimInput) {
  return request<Claim>("/api/claims", {
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
