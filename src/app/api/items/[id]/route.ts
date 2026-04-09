import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { itemPatchSchema, formatZodError } from "@/lib/schemas";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const specificItem = await prisma.item.findFirst({
      where: {
        id,
        status: "APPROVED",
        isDeleted: false,
      },
    });

    if (!specificItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(specificItem);
  } catch {
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
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
    const parsed = itemPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
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
    await prisma.item.update({
      where: { id },
      data: { isDeleted: true },
    });
    console.log(`[ADMIN] Item ${id} soft-deleted.`);
    return NextResponse.json({ message: "Item archived successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to archive item" }, { status: 500 });
  }
}
