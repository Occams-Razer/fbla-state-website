import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { z } from "zod";
import { formatZodError } from "@/lib/schemas";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const PROFILE_WINDOW_MS = 15 * 60 * 1000;
const PROFILE_MAX = 10;

const profileUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newUsername: z.string().min(1).max(64).optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
  })
  .strict()
  .refine((data) => data.newUsername || data.newPassword, {
    message: "Provide at least a new username or new password",
  });

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`profile:${ip}`, PROFILE_MAX, PROFILE_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const sessionOrError = await requireAdminSession(request);
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const { currentPassword, newUsername, newPassword } = parsed.data;

    const admin = await prisma.admin.findUnique({ where: { id: sessionOrError.sub } });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    if (newUsername && newUsername !== admin.username) {
      const existing = await prisma.admin.findUnique({ where: { username: newUsername } });
      if (existing) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
      }
    }

    const updates: { username?: string; password?: string } = {};
    if (newUsername) updates.username = newUsername;
    if (newPassword) updates.password = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({ where: { id: admin.id }, data: updates });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/profile]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
