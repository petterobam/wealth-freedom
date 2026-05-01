import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";


async function getUserId() {
  const session = (await auth());
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

// GET /api/accounts
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(accounts);
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const account = await prisma.account.create({ data: { userId, ...data } });
  return NextResponse.json(account, { status: 201 });
}

// PUT /api/accounts
export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...data } = await req.json();
  const account = await prisma.account.update({ where: { id, userId }, data });
  return NextResponse.json(account);
}

// DELETE /api/accounts
export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.account.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
