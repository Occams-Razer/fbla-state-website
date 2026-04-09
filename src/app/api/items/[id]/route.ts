import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ItemRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: ItemRouteContext) {
  try {
    const { id } = await params;
    const specificItem = await prisma.item.findUnique({
      where: { id }
    });

    if (!specificItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(specificItem);
  } catch (error) {
    console.error("[ERROR] Failed to fetch item", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: ItemRouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status: body.status }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("[ERROR] Failed to update item", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: ItemRouteContext) {
  try {
    const { id } = await params;
    await prisma.item.update({
      where: { id },
      data: { isDeleted: true }
    });
    console.log(`[ADMIN] Item ${id} soft-deleted.`); // Professional Logging
    return NextResponse.json({ message: "Item archived successfully" });
  } catch (error) {
    console.error("[ERROR] Failed to archive item", error);
    return NextResponse.json({ error: "Failed to archive item" }, { status: 500 });
  }
}
