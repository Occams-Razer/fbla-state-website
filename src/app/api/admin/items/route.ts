import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { adminItemsQuerySchema, formatZodError } from "@/lib/schemas";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = adminItemsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }
    const { status, page, limit } = parsed.data;

    const whereClause: Prisma.ItemWhereInput = {
      isDeleted: false,
      ...(status ? { status } : {}),
    };

    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
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
  } catch {
    return NextResponse.json({ error: "Failed to fetch admin moderation queue" }, { status: 500 });
  }
}
