import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Read the URL to see if the admin is requesting a specific status
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const statusOptions = ['PENDING', 'APPROVED', 'REJECTED', 'CLAIMED'];

    // If a status is provided (like 'PENDING'), filter by it. Otherwise, return everything.
    const whereClause: Record<string, unknown> =
      status && statusOptions.includes(status) ? { status } : {};

    const items = await prisma.item.findMany({
      where: whereClause,
      // Show newest submissions at the top of the queue
      orderBy: { createdAt: 'desc' as const },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[ERROR] Failed to fetch admin moderation queue", error);
    return NextResponse.json({ error: "Failed to fetch admin moderation queue" }, { status: 500 });
  }
}
