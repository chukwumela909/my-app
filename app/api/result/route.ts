import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const RESULT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-secret-change-in-production"
);

interface StudentWithClass {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  photo_url: string | null;
  current_class_id: string;
  classes: { name: string; level: string } | null;
}

interface ResultWithSubject {
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
  subjects: { name: string; code: string } | null;
}

interface TermMetadata {
  id: string;
  student_id: string;
  session: string;
  term: string;
  school_days_opened: string | null;
  attendance: string | null;
  next_term_begins: string | null;
  overall_remark: string | null;
  teacher_comment: string | null;
  principal_comment: string | null;
  total_score: string | null;
  average_score: string | null;
  overall_grade: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get("studentId");
  const session = searchParams.get("session");
  const term = searchParams.get("term");

  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  // Verify the result access token
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized — please check your result from the login page" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, RESULT_SECRET);
    if (payload.studentId !== studentId) {
      return NextResponse.json({ error: "Unauthorized — token mismatch" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Session expired — please check your result again" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch student with class info
  const { data: studentData, error: studentError } = await supabase
    .from("students")
    .select("*, classes(name, level)")
    .eq("id", studentId)
    .single();

  const student = studentData as unknown as StudentWithClass | null;

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Build results query
  let resultsQuery = supabase
    .from("results")
    .select("*, subjects(name, code)")
    .eq("student_id", studentId);

  if (session) resultsQuery = resultsQuery.eq("session", session);
  if (term) resultsQuery = resultsQuery.eq("term", term);

  const { data: resultsData, error: resultsError } = await resultsQuery;

  if (resultsError) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }

  const results = (resultsData || []) as unknown as ResultWithSubject[];

  // Fetch term metadata
  let termMetadata: TermMetadata | null = null;
  if (session && term) {
    const { data: metaData } = await supabase
      .from("term_metadata")
      .select("*")
      .eq("student_id", studentId)
      .eq("session", session)
      .eq("term", term)
      .maybeSingle();

    termMetadata = metaData as unknown as TermMetadata | null;
  }

  // Transform results
  const formattedResults = results.map((r) => ({
    subject: r.subjects?.name || "Unknown",
    firstAss: r.first_ass,
    secondAss: r.second_ass,
    exam: r.exam_score,
    total: r.total,
    grade: r.grade,
    classAverage: r.class_average,
    teacherRemark: r.teacher_remark,
  }));

  const className = student.classes?.name || "Unknown";

  return NextResponse.json({
    student: {
      id: student.id,
      firstName: student.first_name,
      middleName: student.middle_name,
      lastName: student.last_name,
      admissionNumber: student.admission_number,
      class: className,
      photoUrl: student.photo_url,
    },
    results: formattedResults,
    termMetadata: termMetadata
      ? {
          schoolDaysOpened: termMetadata.school_days_opened,
          attendance: termMetadata.attendance,
          nextTermBegins: termMetadata.next_term_begins,
          overallRemark: termMetadata.overall_remark,
          teacherComment: termMetadata.teacher_comment,
          principalComment: termMetadata.principal_comment,
          totalScore: termMetadata.total_score,
          averageScore: termMetadata.average_score,
          overallGrade: termMetadata.overall_grade,
        }
      : null,
  });
}
