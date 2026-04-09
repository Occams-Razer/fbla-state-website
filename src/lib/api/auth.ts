import type { LoginRequest, LoginResponse } from "@/lib/types";
import { request } from "./client";

export async function loginAdmin(payload: LoginRequest) {
  return request<LoginResponse>("/api/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
