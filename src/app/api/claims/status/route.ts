import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { claimStatusQuerySchema, formatZodError } from "@/lib/schemas";
import { emailsEqual } from "@/lib/email";

/** Public: lookup claim status by id + email (no full PII in response). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = {
      claimId: searchParams.get("claimId") ?? "",
      email: searchParams.get("email") ?? "",
    };
    const parsed = claimStatusQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { claimId, email } = parsed.data;

    const claim = await prisma.claim.findFirst({
      where: { id: claimId, isDeleted: false },
      include: {
        item: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!claim || !emailsEqual(email, claim.email)) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({
      claimId: claim.id,
      status: claim.status,
      createdAt: claim.createdAt,
      item: claim.item
        ? {
            id: claim.item.id,
            title: claim.item.title,
            itemStatus: claim.item.status,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to look up claim" }, { status: 500 });
  }
}
