import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

// GET /api/goals
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(goals);
}

// POST /api/goals
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const goal = await prisma.goal.create({
    data: {
      userId,
      name: body.name || "未命名目标",
      target: Number(body.target) || 0,
      current: Number(body.current) || 0,
      icon: body.icon || "🎯",
      deadline: body.deadline || null,
      color: body.color || "from-blue-500 to-emerald-500",
    },
  });
  return NextResponse.json(goal, { status: 201 });
}

// PUT /api/goals
export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...body } = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.target !== undefined) data.target = Number(body.target);
  if (body.current !== undefined) data.current = Number(body.current);
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.deadline !== undefined) data.deadline = body.deadline;
  if (body.color !== undefined) data.color = body.color;
  const goal = await prisma.goal.update({ where: { id, userId }, data });
  return NextResponse.json(goal);
}

// DELETE /api/goals
export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.goal.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
