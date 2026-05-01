import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

// GET /api/investments
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const investments = await prisma.investment.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(investments);
}

// POST /api/investments
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const investment = await prisma.investment.create({
    data: {
      userId,
      name: body.name || "未命名投资",
      type: body.type || "stock",
      amount: Number(body.amount) || 0,
      currentValue: Number(body.currentValue) || 0,
      buyDate: body.buyDate || new Date().toISOString().slice(0, 10),
      note: body.note || null,
    },
  });
  return NextResponse.json(investment, { status: 201 });
}

// PUT /api/investments
export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...body } = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.currentValue !== undefined) data.currentValue = Number(body.currentValue);
  if (body.buyDate !== undefined) data.buyDate = body.buyDate;
  if (body.note !== undefined) data.note = body.note;
  const investment = await prisma.investment.update({ where: { id, userId }, data });
  return NextResponse.json(investment);
}

// DELETE /api/investments
export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.investment.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
