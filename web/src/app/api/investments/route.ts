import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


async function getUserId() {
  const session = (await auth());
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const investments = await prisma.investment.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(investments);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const inv = await prisma.investment.create({ data: { userId, ...data } });
  return NextResponse.json(inv, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...data } = await req.json();
  const inv = await prisma.investment.update({ where: { id, userId }, data });
  return NextResponse.json(inv);
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.investment.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
