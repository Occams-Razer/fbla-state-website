import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { claimPatchSchema, formatZodError } from "@/lib/schemas";

async function syncItemClaimState(itemId: string) {
  const approvedClaims = await prisma.claim.count({
    where: {
      itemId,
      status: "APPROVED",
      isDeleted: false,
    },
  });

  if (approvedClaims > 0) {
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "CLAIMED" },
    });
    return;
  }

  await prisma.item.updateMany({
    where: {
      id: itemId,
      status: "CLAIMED",
    },
    data: { status: "APPROVED" },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = claimPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const existingClaim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            status: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!existingClaim || existingClaim.isDeleted) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (
      parsed.data.status === "APPROVED" &&
      (!existingClaim.item ||
        existingClaim.item.isDeleted ||
        !["APPROVED", "CLAIMED"].includes(existingClaim.item.status))
    ) {
      return NextResponse.json(
        { error: "Only active approved items can have approved claims." },
        { status: 409 },
      );
    }

    await prisma.claim.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await syncItemClaimState(existingClaim.itemId);

    const hydratedClaim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!hydratedClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(hydratedClaim);
  } catch (error) {
    console.error("[claims/:id PATCH]", error);
    return NextResponse.json({ error: "Failed to update claim status" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const existingClaim = await prisma.claim.findUnique({
      where: { id },
      select: {
        id: true,
        itemId: true,
        isDeleted: true,
      },
    });

    if (!existingClaim || existingClaim.isDeleted) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    await prisma.claim.update({
      where: { id },
      data: { isDeleted: true },
    });

    await syncItemClaimState(existingClaim.itemId);

    return NextResponse.json({ message: "Claim archived successfully" });
  } catch (error) {
    console.error("[claims/:id DELETE]", error);
    return NextResponse.json({ error: "Failed to archive claim" }, { status: 500 });
  }
}
