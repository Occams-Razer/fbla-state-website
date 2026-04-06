import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // The "locationLost" field is now included to fix your TypeScript error
    const newClaim = await prisma.claim.create({
      data: {
        itemId: body.itemId,
        name: body.name,
        email: body.email,
        proofOfOwnership: body.proofOfOwnership,
        locationLost: body.locationLost, // This line fixes the error in image_8e8501.png
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
      include: { item: true }
    });
    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}