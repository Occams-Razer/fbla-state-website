import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const specificItem = await prisma.item.findUnique({
      where: { id: params.id }
    });

    if (!specificItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(specificItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    const updatedItem = await prisma.item.update({
      where: { id: params.id },
      data: { status: body.status }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.item.update({
      where: { id: params.id },
      data: { isDeleted: true }
    });
    console.log(`[ADMIN] Item ${params.id} soft-deleted.`); // Professional Logging
    return NextResponse.json({ message: "Item archived successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to archive item" }, { status: 500 });
  }
}