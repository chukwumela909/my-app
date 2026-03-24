"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, BookOpen, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardStats {
  students: number;
  classes: number;
  subjects: number;
  results: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail, show zeros
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards: { label: string; value: number; icon: LucideIcon; color: string; iconBg: string }[] = [
    { label: "Total Students", value: stats?.students ?? 0, icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-950/50" },
    { label: "Classes", value: stats?.classes ?? 0, icon: School, color: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-950/50" },
    { label: "Subjects", value: stats?.subjects ?? 0, icon: BookOpen, color: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-950/50" },
    { label: "Results Uploaded", value: stats?.results ?? 0, icon: ClipboardList, color: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-950/50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview of your school data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </CardTitle>
              <div className={`${card.iconBg} ${card.color} p-3 rounded-xl`}>
                <card.icon className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-slate-800 dark:text-white">
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
