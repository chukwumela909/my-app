import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface StudentRow {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  current_class_id: string;
  photo_url: string | null;
  created_at: string;
  classes: { id: string; name: string; level: string } | null;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");

  let query = supabase
    .from("students")
    .select("*, classes(id, name, level)")
    .order("first_name");

  if (classId) {
    query = query.eq("current_class_id", classId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const students = (data as unknown as StudentRow[]) ?? [];
  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    admission_number?: string;
    first_name?: string;
    last_name?: string;
    current_class_id?: string;
    photo_url?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { admission_number, first_name, last_name, current_class_id } = body;
  if (!admission_number || !first_name || !last_name || !current_class_id) {
    return NextResponse.json(
      { error: "admission_number, first_name, last_name, and current_class_id are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("students")
    .insert({
      admission_number,
      first_name,
      last_name,
      current_class_id,
      photo_url: body.photo_url ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    admission_number?: string;
    first_name?: string;
    last_name?: string;
    current_class_id?: string;
    photo_url?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Student id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (body.admission_number) updates.admission_number = body.admission_number;
  if (body.first_name) updates.first_name = body.first_name;
  if (body.last_name) updates.last_name = body.last_name;
  if (body.current_class_id) updates.current_class_id = body.current_class_id;
  if (body.photo_url !== undefined) updates.photo_url = body.photo_url;

  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: data });
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Student id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
