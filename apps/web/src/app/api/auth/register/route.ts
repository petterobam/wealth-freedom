import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const result = registerUser(email, password, name || email.split("@")[0]);
  return NextResponse.json(result);
}
