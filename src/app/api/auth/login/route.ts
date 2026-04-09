import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginBodySchema, formatZodError } from "@/lib/schemas";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 20;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = await request.json();
    const parsed = loginBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { username, password } = parsed.data;

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = await createSessionToken(admin.id, admin.username);
    const response = NextResponse.json({ authenticated: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[auth/login]", error);
    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      return NextResponse.json(
        { error: "Server is missing SESSION_SECRET. Check .env." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
