import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-secret-change-in-production"
);

export interface AdminSession {
  id: string;
  email: string;
  role: "admin" | "super_admin";
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as "admin" | "super_admin",
    };
  } catch {
    return null;
  }
}
