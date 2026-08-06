import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const res = await auth.handler(req);
  return res;
}

export async function POST(req: NextRequest) {
  const res = await auth.handler(req);
  return res;
}