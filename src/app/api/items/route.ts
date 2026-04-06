import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // 1. The Waiter asks the Filing Clerk (Prisma) for the files
  const items = await prisma.item.findMany({
    where: {
      status: 'APPROVED'
    }
  });

  // 2. The Waiter serves the files back to the user on a silver platter (JSON format)
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  // 1. The Waiter takes the digital box of information from the user
  const body = await request.json();

  // 2. The Waiter asks the Filing Clerk to create a brand new file folder
  const newItem = await prisma.item.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      location: body.location,
      imageUrl: body.imageUrl,
    }
  });

  // 3. The Waiter hands the user a "receipt" showing the item was successfully filed
  return NextResponse.json(newItem);
}