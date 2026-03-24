"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const cards = [
    { label: "Total Students", value: stats?.students ?? 0, icon: "👩‍🎓", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" },
    { label: "Classes", value: stats?.classes ?? 0, icon: "🏫", color: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" },
    { label: "Subjects", value: stats?.subjects ?? 0, icon: "📚", color: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" },
    { label: "Results Uploaded", value: stats?.results ?? 0, icon: "📝", color: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300" },
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
              <span className="text-2xl">{card.icon}</span>
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
