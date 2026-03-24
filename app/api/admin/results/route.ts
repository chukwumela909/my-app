import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface ResultWithRelations {
  id: string;
  student_id: string;
  subject_id: string;
  session: string;
  term: string;
  ca_score: number;
  exam_score: number;
  total: number;
  grade: string;
  created_at: string;
  students: { id: string; first_name: string; last_name: string; admission_number: string } | null;
  subjects: { id: string; name: string; code: string } | null;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const sessionFilter = url.searchParams.get("session");
  const termFilter = url.searchParams.get("term");

  let query = supabase
    .from("results")
    .select("*, students(id, first_name, last_name, admission_number), subjects(id, name, code)")
    .order("created_at", { ascending: false });

  if (studentId) query = query.eq("student_id", studentId);
  if (sessionFilter) query = query.eq("session", sessionFilter);
  if (termFilter) query = query.eq("term", termFilter);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = (data as unknown as ResultWithRelations[]) ?? [];
  return NextResponse.json({ results });
}

function computeGrade(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    student_id?: string;
    subject_id?: string;
    session?: string;
    term?: string;
    ca_score?: number;
    exam_score?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { student_id, subject_id, session: sessionVal, term, ca_score, exam_score } = body;
  if (!student_id || !subject_id || !sessionVal || !term || ca_score == null || exam_score == null) {
    return NextResponse.json(
      { error: "student_id, subject_id, session, term, ca_score, and exam_score are required" },
      { status: 400 }
    );
  }

  const total = ca_score + exam_score;
  const grade = computeGrade(total);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("results")
    .insert({
      student_id,
      subject_id,
      session: sessionVal,
      term,
      ca_score,
      exam_score,
      total,
      grade,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ result: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    ca_score?: number;
    exam_score?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Result id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.ca_score != null) updates.ca_score = body.ca_score;
  if (body.exam_score != null) updates.exam_score = body.exam_score;

  if (body.ca_score != null || body.exam_score != null) {
    // Need to recompute total/grade — fetch current values first
    const supabase = createAdminClient();
    const { data: current } = await supabase
      .from("results")
      .select("ca_score, exam_score")
      .eq("id", body.id)
      .single();

    const row = current as { ca_score: number; exam_score: number } | null;
    const ca = body.ca_score ?? row?.ca_score ?? 0;
    const exam = body.exam_score ?? row?.exam_score ?? 0;
    const total = ca + exam;
    updates.total = total;
    updates.grade = computeGrade(total);

    const { data, error } = await supabase
      .from("results")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ result: data });
  }

  return NextResponse.json({ error: "No fields to update" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Result id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("results").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
