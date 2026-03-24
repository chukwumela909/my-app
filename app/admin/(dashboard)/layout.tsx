"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { schoolInfo } from "@/lib/mock-data";

interface AdminSession {
  id: string;
  email: string;
  role: "admin" | "super_admin";
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Students", href: "/admin/students", icon: "👩‍🎓" },
  { label: "Classes", href: "/admin/classes", icon: "🏫" },
  { label: "Subjects", href: "/admin/subjects", icon: "📚" },
  { label: "Results", href: "/admin/results", icon: "📝" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/admin/session");
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        setAdmin(data.admin);
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-700 relative overflow-hidden">
              <Image src="/goodnews-logo.png" alt="Logo" fill sizes="40px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                {schoolInfo.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
              {admin?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {admin?.email}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {admin?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-slate-600 dark:text-slate-400"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden lg:block" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {schoolInfo.currentSession} — {schoolInfo.currentTerm}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
