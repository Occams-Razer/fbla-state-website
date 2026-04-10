import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { itemCreateSchema, itemListQuerySchema, formatZodError } from "@/lib/schemas";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { sendNewItemAdminEmail } from "@/lib/email";

const ITEM_POST_WINDOW_MS = 60 * 1000;
const ITEM_POST_MAX = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = itemListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { search, category, sort, page, limit } = parsed.data;

    const whereClause: Prisma.ItemWhereInput = {
      status: "APPROVED",
      isDeleted: false,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const orderByClause: Prisma.ItemOrderByWithRelationInput =
      sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.item.count({ where: whereClause }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize: limit,
      totalPages,
    });
  } catch (error) {
    console.error("[ERROR] Failed to fetch items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`item-post:${ip}`, ITEM_POST_MAX, ITEM_POST_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limited.retryAfterSec),
        },
      },
    );
  }

  try {
    const body = await request.json();
    const parsed = itemCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const data = parsed.data;

    const newItem = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        dateFound: data.dateFound,
        imageUrl: data.imageUrl,
      },
    });

    void sendNewItemAdminEmail(newItem);

    const response = NextResponse.json(
      {
        ...newItem,
        message: "Item submitted for review. It will appear after approval.",
      },
      { status: 201 },
    );
    Object.entries(rateLimitHeaders(limited)).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  } catch (error) {
    console.error(`[ERROR] Item creation failed:`, error);
    return NextResponse.json({ error: "Failed to submit item" }, { status: 500 });
  }
}
