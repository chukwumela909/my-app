import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const RESULT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-secret-change-in-production"
);

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface StudentRow {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
}

interface AccessTokenRow {
  id: string;
  student_id: string;
  pin_hash: string;
  usage_limit: number;
  used_count: number;
}

export async function POST(request: NextRequest) {
  let body: { admissionNumber?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { admissionNumber, pin } = body;

  if (!admissionNumber || !pin) {
    return NextResponse.json(
      { error: "Admission number and PIN are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Find the student by admission number
  const { data, error: studentError } = await supabase
    .from("students")
    .select("id, admission_number, first_name, last_name")
    .eq("admission_number", admissionNumber)
    .single();

  const student = data as StudentRow | null;

  if (studentError || !student) {
    return NextResponse.json(
      { error: "Invalid Student ID or PIN. Please try again." },
      { status: 401 }
    );
  }

  // Find a valid access token for this student
  const hashedPin = await hashPin(pin);

  const { data: tokenData, error: tokenError } = await supabase
    .from("access_tokens")
    .select("*")
    .eq("student_id", student.id)
    .eq("pin_hash", hashedPin)
    .single();

  const token = tokenData as AccessTokenRow | null;

  if (tokenError || !token) {
    return NextResponse.json(
      { error: "Invalid Student ID or PIN. Please try again." },
      { status: 401 }
    );
  }

  // Check usage limit
  if (token.used_count >= token.usage_limit) {
    return NextResponse.json(
      { error: "This PIN has exceeded its usage limit. Please contact the school for a new PIN." },
      { status: 403 }
    );
  }

  // Increment usage count
  await supabase
    .from("access_tokens")
    .update({ used_count: token.used_count + 1 } as never)
    .eq("id", token.id);

  // Create a short-lived token so only authenticated students can view results
  const resultToken = await new SignJWT({ studentId: student.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(RESULT_SECRET);

  return NextResponse.json({
    success: true,
    studentId: student.id,
    resultToken,
    student: {
      firstName: student.first_name,
      lastName: student.last_name,
      admissionNumber: student.admission_number,
    },
  });
}
