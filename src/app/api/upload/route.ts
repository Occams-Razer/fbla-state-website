import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isAllowedClientMime, randomImageFilename, sniffImageType } from "@/lib/upload-validate";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_WINDOW_MS = 60 * 1000;
const UPLOAD_MAX = 30;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`upload:${ip}`, UPLOAD_MAX, UPLOAD_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    if (!isAllowedClientMime(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sniff = sniffImageType(buffer);
    if (!sniff.ok) {
      return NextResponse.json({ error: sniff.reason }, { status: 400 });
    }

    if (sniff.mime !== file.type) {
      return NextResponse.json(
        { error: "File content does not match its declared type." },
        { status: 400 },
      );
    }

    const filename = randomImageFilename(sniff);
    const filePath = path.join(process.cwd(), "public", "uploads", filename);

    await writeFile(filePath, buffer);

    const response = NextResponse.json({ url: `/uploads/${filename}` });
    response.headers.set("X-RateLimit-Remaining", String(limited.remaining));
    return response;
  } catch (error) {
    console.error("[ERROR] Image upload failed:", error);
    return NextResponse.json({ error: "Error saving image" }, { status: 500 });
  }
}
