import type { LoginRequest, LoginResponse } from "@/lib/types";
import { request } from "./client";

export async function loginAdmin(payload: LoginRequest) {
  return request<LoginResponse>("/api/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function logoutAdmin() {
  return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function updateAdminProfile(payload: {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}) {
  return request<{ ok: boolean }>("/api/admin/profile", {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
