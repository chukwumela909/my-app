import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generatePin(): string {
  const chars = "0123456789";
  let pin = "";
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  for (let i = 0; i < 6; i++) {
    pin += chars[array[i] % chars.length];
  }
  return pin;
}

interface TokenRow {
  id: string;
  student_id: string;
  pin_hash: string;
  usage_limit: number;
  used_count: number;
  created_at: string;
  students: { id: string; first_name: string; last_name: string; admission_number: string } | null;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");

  let query = supabase
    .from("access_tokens")
    .select("*, students(id, first_name, last_name, admission_number)")
    .order("created_at", { ascending: false });

  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tokens = (data as unknown as TokenRow[]) ?? [];
  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { student_id?: string; usage_limit?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.student_id) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  const plainPin = generatePin();
  const pinHash = await hashPin(plainPin);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("access_tokens")
    .insert({
      student_id: body.student_id,
      pin_hash: pinHash,
      pin: plainPin,
      usage_limit: body.usage_limit ?? 5,
      used_count: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the plain PIN only once — admin must save/share it immediately
  return NextResponse.json({ token: data, plain_pin: plainPin }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Token id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("access_tokens").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
