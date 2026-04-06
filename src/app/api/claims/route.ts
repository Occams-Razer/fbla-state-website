import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newClaim = await prisma.claim.create({
      data: {
        itemId: body.itemId,
        name: body.name,
        email: body.email,
        proofOfOwnership: body.proofOfOwnership,
      }
    });

    return NextResponse.json(newClaim, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        item: true // This attaches the item details to the claim so admins see what was claimed
      }
    });

    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}