import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { claimPatchSchema, formatZodError } from "@/lib/schemas";

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

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    if (parsed.data.status === "APPROVED") {
      await prisma.item.update({
        where: { id: updatedClaim.itemId },
        data: { status: "CLAIMED" },
      });
    }

    return NextResponse.json(updatedClaim);
  } catch {
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
    await prisma.claim.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "Claim archived successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to archive claim" }, { status: 500 });
  }
}
