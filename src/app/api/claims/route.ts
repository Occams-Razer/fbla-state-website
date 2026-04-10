import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { claimCreateSchema, claimsListQuerySchema, formatZodError } from "@/lib/schemas";
import { normalizeEmail, sendNewClaimAdminEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const CLAIM_POST_WINDOW_MS = 60 * 1000;
const CLAIM_POST_MAX = 15;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`claim-post:${ip}`, CLAIM_POST_MAX, CLAIM_POST_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many claim submissions. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = await request.json();
    const parsed = claimCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { itemId, name, email, proofOfOwnership, locationLost } = parsed.data;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        status: true,
        isDeleted: true,
      },
    });

    if (!item || item.isDeleted || item.status !== "APPROVED") {
      return NextResponse.json(
        { error: "This item is not available for claims." },
        { status: 409 },
      );
    }

    const newClaim = await prisma.claim.create({
      data: {
        itemId,
        name,
        email: normalizeEmail(email),
        proofOfOwnership,
        locationLost,
      },
    });

    void sendNewClaimAdminEmail(
      {
        id: newClaim.id,
        name: newClaim.name,
        email: newClaim.email,
        proofOfOwnership: newClaim.proofOfOwnership,
        locationLost: newClaim.locationLost,
      },
      item.title,
    );

    return NextResponse.json(
      {
        id: newClaim.id,
        status: newClaim.status,
        createdAt: newClaim.createdAt,
        message:
          "Claim received. You can check status with your email and claim ID from the status page.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[claims POST]", error);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = claimsListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const whereClause = { isDeleted: false };

    const [claims, total] = await prisma.$transaction([
      prisma.claim.findMany({
        where: whereClause,
        include: { item: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.claim.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      claims,
      total,
      page,
      pageSize: limit,
      totalPages,
    });
  } catch (error) {
    console.error("[claims GET]", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}
