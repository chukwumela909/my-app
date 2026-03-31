import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface ResultWithRelations {
  id: string;
  student_id: string;
  subject_id: string;
  session: string;
  term: string;
  first_ass: number;
  second_ass: number;
  exam_score: number;
  total: number;
  grade: string;
  class_average: string | null;
  teacher_remark: string | null;
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
    first_ass?: number;
    second_ass?: number;
    exam_score?: number;
    class_average?: string;
    teacher_remark?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { student_id, subject_id, session: sessionVal, term, first_ass, second_ass, exam_score, class_average, teacher_remark } = body;
  if (!student_id || !subject_id || !sessionVal || !term || first_ass == null || second_ass == null || exam_score == null) {
    return NextResponse.json(
      { error: "student_id, subject_id, session, term, first_ass, second_ass, and exam_score are required" },
      { status: 400 }
    );
  }

  const total = first_ass + second_ass + exam_score;
  const grade = computeGrade(total);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("results")
    .insert({
      student_id,
      subject_id,
      session: sessionVal,
      term,
      first_ass,
      second_ass,
      exam_score,
      total,
      grade,
      class_average: class_average || null,
      teacher_remark: teacher_remark || null,
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
    first_ass?: number;
    second_ass?: number;
    exam_score?: number;
    class_average?: string;
    teacher_remark?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Result id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch current values for recomputation
  const { data: current } = await supabase
    .from("results")
    .select("first_ass, second_ass, exam_score")
    .eq("id", body.id)
    .single();

  const row = current as { first_ass: number; second_ass: number; exam_score: number } | null;
  const fa = body.first_ass ?? row?.first_ass ?? 0;
  const sa = body.second_ass ?? row?.second_ass ?? 0;
  const exam = body.exam_score ?? row?.exam_score ?? 0;
  const total = fa + sa + exam;
  const grade = computeGrade(total);

  const updates: Record<string, unknown> = {
    first_ass: fa,
    second_ass: sa,
    exam_score: exam,
    total,
    grade,
  };

  if (body.class_average !== undefined) updates.class_average = body.class_average || null;
  if (body.teacher_remark !== undefined) updates.teacher_remark = body.teacher_remark || null;

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
