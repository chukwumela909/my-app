import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ admin: session });
}
