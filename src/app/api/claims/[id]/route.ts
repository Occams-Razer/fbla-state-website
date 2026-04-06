import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // 1. Update the claim status (e.g., 'APPROVED' or 'REJECTED')
    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: { status: body.status }
    });

    // 2. If the admin approves the claim, automatically mark the actual item as 'CLAIMED'
    if (body.status === 'APPROVED') {
      await prisma.item.update({
        where: { id: updatedClaim.itemId },
        data: { status: 'CLAIMED' }
      });
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update claim status" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Delete the specific claim from the database
    await prisma.claim.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Claim deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}