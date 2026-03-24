import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function gradeFromTotal(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

function remarkFromGrade(grade: string): string {
  switch (grade) {
    case "A": return "Excellent";
    case "B": return "Very Good";
    case "C": return "Good";
    case "D": return "Pass";
    default: return "Fail";
  }
}

interface StudentWithClass {
  id: string;
  admission_number: string;
  first_name: string;
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
  ca_score: number;
  exam_score: number;
  total: number;
  grade: string;
  subjects: { name: string; code: string } | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get("studentId");
  const session = searchParams.get("session");
  const term = searchParams.get("term");

  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  const supabase = await createClient();

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

  // Transform results into the format the frontend expects
  const formattedResults = results.map((r) => {
    const grade = gradeFromTotal(r.total);
    return {
      subject: r.subjects?.name || "Unknown",
      ca: r.ca_score,
      exam: r.exam_score,
      total: r.total,
      grade: r.grade || grade,
      remark: remarkFromGrade(r.grade || grade),
    };
  });

  // Calculate summary
  const totalScore = formattedResults.reduce((sum, r) => sum + r.total, 0);
  const averageScore = formattedResults.length > 0
    ? Math.round((totalScore / formattedResults.length) * 100) / 100
    : 0;

  const className = student.classes?.name || "Unknown";

  return NextResponse.json({
    student: {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      admissionNumber: student.admission_number,
      class: className,
      photoUrl: student.photo_url,
    },
    results: formattedResults,
    summary: {
      totalScore,
      averageScore,
      subjectCount: formattedResults.length,
    },
  });
}
