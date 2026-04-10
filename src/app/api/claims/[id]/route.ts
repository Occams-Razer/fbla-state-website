import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { claimPatchSchema, formatZodError } from "@/lib/schemas";
import { sendClaimApprovedEmail, sendClaimPickedUpEmail } from "@/lib/email";

async function syncItemClaimState(itemId: string) {
  const activeClaimedStates = await prisma.claim.count({
    where: {
      itemId,
      status: { in: ["APPROVED", "PICKED_UP"] },
      isDeleted: false,
    },
  });

  if (activeClaimedStates > 0) {
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

    if (parsed.data.status === "PICKED_UP" && existingClaim.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved claims can be marked as picked up." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.claim.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      // Keep ownership resolution consistent: only one non-deleted approved claim per item.
      if (parsed.data.status === "APPROVED") {
        await tx.claim.updateMany({
          where: {
            itemId: existingClaim.itemId,
            id: { not: id },
            isDeleted: false,
            status: { in: ["PENDING", "APPROVED"] },
          },
          data: { status: "REJECTED" },
        });
      }
    });

    await syncItemClaimState(existingClaim.itemId);

    const hydratedClaim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!hydratedClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (parsed.data.status === "APPROVED" && hydratedClaim.item) {
      void sendClaimApprovedEmail(
        { id: hydratedClaim.id, name: hydratedClaim.name, email: hydratedClaim.email },
        {
          title: hydratedClaim.item.title,
          category: hydratedClaim.item.category,
          location: hydratedClaim.item.location,
        },
      );
    }

    if (parsed.data.status === "PICKED_UP" && hydratedClaim.item) {
      void sendClaimPickedUpEmail(
        { id: hydratedClaim.id, name: hydratedClaim.name, email: hydratedClaim.email },
        {
          title: hydratedClaim.item.title,
          category: hydratedClaim.item.category,
          location: hydratedClaim.item.location,
        },
      );
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
