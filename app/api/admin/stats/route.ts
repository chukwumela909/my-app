import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [studentsRes, classesRes, subjectsRes, resultsRes] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("results").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    students: studentsRes.count ?? 0,
    classes: classesRes.count ?? 0,
    subjects: subjectsRes.count ?? 0,
    results: resultsRes.count ?? 0,
  });
}
