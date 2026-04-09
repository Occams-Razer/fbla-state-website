import type { UploadImageResponse } from "@/lib/types";
import { request } from "./client";

export async function uploadItemImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadImageResponse>("/api/upload", {
    body: formData,
    method: "POST",
  });
}
