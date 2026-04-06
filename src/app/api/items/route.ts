import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');

    // Requirement: Only return APPROVED items that are NOT soft-deleted
    const whereClause: Prisma.ItemWhereInput = {
      status: 'APPROVED',
      isDeleted: false, 
    };

    // Requirement: Search Logic
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    // Requirement: Category Filtering
    if (category) {
      whereClause.category = category;
    }

    // Requirement: Date Sorting
    const orderByClause: Prisma.ItemOrderByWithRelationInput = 
      sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    console.log(`[SERVER] Fetching public items. Filter: ${category || 'none'}, Search: ${search || 'none'}`);

    const items = await prisma.item.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[ERROR] Failed to fetch items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(`[SERVER] New item submission attempt: "${body.title}"`);

    // Requirement: Robust Validation
    if (!body.title || !body.category || !body.imageUrl) {
      console.log(`[REJECTED] Missing required fields for item submission.`);
      return NextResponse.json(
        { error: "Title, category, and photo are required." }, 
        { status: 400 }
      );
    }

    const newItem = await prisma.item.create({
      data: {
        title: body.title,
        description: body.description || "",
        category: body.category,
        location: body.location || "",
        dateFound: body.dateFound || "",
        imageUrl: body.imageUrl,
        // Status defaults to PENDING in schema
        // isDeleted defaults to false in schema
      }
    });

    console.log(`[SUCCESS] Item created with ID: ${newItem.id}`);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error(`[ERROR] Item creation failed:`, error);
    return NextResponse.json({ error: "Failed to submit item" }, { status: 500 });
  }
}