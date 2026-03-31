import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId");
  const sessionFilter = url.searchParams.get("session");
  const termFilter = url.searchParams.get("term");

  if (!studentId || !sessionFilter || !termFilter) {
    return NextResponse.json(
      { error: "studentId, session, and term are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("term_metadata")
    .select("*")
    .eq("student_id", studentId)
    .eq("session", sessionFilter)
    .eq("term", termFilter)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metadata: data });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    student_id?: string;
    session?: string;
    term?: string;
    school_days_opened?: string;
    attendance?: string;
    next_term_begins?: string;
    overall_remark?: string;
    teacher_comment?: string;
    principal_comment?: string;
    total_score?: string;
    average_score?: string;
    overall_grade?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { student_id, session: sessionVal, term } = body;
  if (!student_id || !sessionVal || !term) {
    return NextResponse.json(
      { error: "student_id, session, and term are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const upsertData = {
    student_id,
    session: sessionVal,
    term,
    school_days_opened: body.school_days_opened || null,
    attendance: body.attendance || null,
    next_term_begins: body.next_term_begins || null,
    overall_remark: body.overall_remark || null,
    teacher_comment: body.teacher_comment || null,
    principal_comment: body.principal_comment || null,
    total_score: body.total_score || null,
    average_score: body.average_score || null,
    overall_grade: body.overall_grade || null,
  };

  const { data, error } = await supabase
    .from("term_metadata")
    .upsert(upsertData, {
      onConflict: "student_id,session,term",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metadata: data });
}
