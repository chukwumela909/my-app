import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function computeGrade(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

interface BulkResultRow {
  student_id: string;
  subject_id: string;
  session: string;
  term: string;
  first_ass: number;
  second_ass: number;
  exam_score: number;
  class_average?: string;
  teacher_remark?: string;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { results?: BulkResultRow[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { results } = body;
  if (!results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: "results array is required and must not be empty" }, { status: 400 });
  }

  // Validate all rows before saving (all-or-nothing)
  const errors: { index: number; message: string }[] = [];
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    if (!row.student_id || !row.subject_id || !row.session || !row.term) {
      errors.push({ index: i, message: "student_id, subject_id, session, and term are required" });
      continue;
    }
    if (row.first_ass == null || row.second_ass == null || row.exam_score == null) {
      errors.push({ index: i, message: "first_ass, second_ass, and exam_score are required" });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  // Prepare rows with computed total and grade
  const upsertRows = results.map((row) => {
    const total = row.first_ass + row.second_ass + row.exam_score;
    return {
      student_id: row.student_id,
      subject_id: row.subject_id,
      session: row.session,
      term: row.term,
      first_ass: row.first_ass,
      second_ass: row.second_ass,
      exam_score: row.exam_score,
      total,
      grade: computeGrade(total),
      class_average: row.class_average || null,
      teacher_remark: row.teacher_remark || null,
    };
  });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("results")
    .upsert(upsertRows, {
      onConflict: "student_id,subject_id,session,term",
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data?.length ?? 0 }, { status: 200 });
}
