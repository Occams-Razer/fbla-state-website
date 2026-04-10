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

export async function DELETE(request: Request) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    if (status !== "APPROVED" && status !== "REJECTED" && status !== "PICKED_UP") {
      return NextResponse.json(
        { error: "status must be APPROVED, REJECTED, or PICKED_UP" },
        { status: 400 },
      );
    }

    const affected = await prisma.claim.findMany({
      where: { status, isDeleted: false },
      select: { itemId: true },
    });

    if (affected.length === 0) {
      return NextResponse.json({ cleared: 0 });
    }

    const uniqueItemIds = [...new Set(affected.map((c: { itemId: string }) => c.itemId))];

    const result = await prisma.claim.updateMany({
      where: { status, isDeleted: false },
      data: { isDeleted: true },
    });

    // Re-sync item claim state for each affected item
    await Promise.all(
      uniqueItemIds.map(async (itemId) => {
        const approvedCount = await prisma.claim.count({
          where: { itemId, status: { in: ["APPROVED", "PICKED_UP"] }, isDeleted: false },
        });
        if (approvedCount > 0) {
          await prisma.item.update({ where: { id: itemId }, data: { status: "CLAIMED" } });
        } else {
          await prisma.item.updateMany({
            where: { id: itemId, status: "CLAIMED" },
            data: { status: "APPROVED" },
          });
        }
      }),
    );

    return NextResponse.json({ cleared: result.count });
  } catch (error) {
    console.error("[claims DELETE bulk]", error);
    return NextResponse.json({ error: "Failed to clear claims" }, { status: 500 });
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
