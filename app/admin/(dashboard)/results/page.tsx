"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { schoolInfo } from "@/lib/mock-data";

interface StudentOption {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface ResultRow {
  id: string;
  student_id: string;
  subject_id: string;
  session: string;
  term: string;
  ca_score: number;
  exam_score: number;
  total: number;
  grade: string;
  created_at: string;
  students: StudentOption | null;
  subjects: SubjectOption | null;
}

function gradeColor(grade: string) {
  switch (grade) {
    case "A": return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "B": return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "C": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    case "D": return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
    default: return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    student_id: "",
    subject_id: "",
    session: schoolInfo.currentSession,
    term: schoolInfo.currentTerm,
    ca_score: "",
    exam_score: "",
  });

  const fetchResults = useCallback(async () => {
    const res = await fetch("/api/admin/results");
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
    }
    setLoading(false);
  }, []);

  const fetchOptions = useCallback(async () => {
    const [studRes, subjRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/subjects"),
    ]);
    if (studRes.ok) {
      const data = await studRes.json();
      setStudents(
        data.students.map((s: StudentOption & Record<string, unknown>) => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          admission_number: s.admission_number,
        }))
      );
    }
    if (subjRes.ok) {
      const data = await subjRes.json();
      setSubjects(data.subjects);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    fetchOptions();
  }, [fetchResults, fetchOptions]);

  const resetForm = () => {
    setForm({
      student_id: "",
      subject_id: "",
      session: schoolInfo.currentSession,
      term: schoolInfo.currentTerm,
      ca_score: "",
      exam_score: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: form.student_id,
        subject_id: form.subject_id,
        session: form.session,
        term: form.term,
        ca_score: Number(form.ca_score),
        exam_score: Number(form.exam_score),
      }),
    });

    if (res.ok) {
      resetForm();
      fetchResults();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this result entry?")) return;
    const res = await fetch(`/api/admin/results?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchResults();
  };

  const terms = ["First Term", "Second Term", "Third Term"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Results</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student examination results
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          + Add Result
        </Button>
      </div>

      {showForm && (
        <Card className="border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Add New Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="student">Student</Label>
                <select
                  id="student"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  required
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  <option value="">Select student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  required
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="session">Session</Label>
                <Input
                  id="session"
                  value={form.session}
                  onChange={(e) => setForm({ ...form, session: e.target.value })}
                  placeholder="2025/2026"
                  required
                />
              </div>
              <div>
                <Label htmlFor="term">Term</Label>
                <select
                  id="term"
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  required
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  {terms.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ca_score">CA Score (max 40)</Label>
                <Input
                  id="ca_score"
                  type="number"
                  min={0}
                  max={40}
                  value={form.ca_score}
                  onChange={(e) => setForm({ ...form, ca_score: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="exam_score">Exam Score (max 60)</Label>
                <Input
                  id="exam_score"
                  type="number"
                  min={0}
                  max={60}
                  value={form.exam_score}
                  onChange={(e) => setForm({ ...form, exam_score: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Add Result</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No results uploaded yet. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-center">CA</TableHead>
                    <TableHead className="text-center">Exam</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.students
                          ? `${r.students.first_name} ${r.students.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell>{r.subjects?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.session}</TableCell>
                      <TableCell className="text-sm">{r.term}</TableCell>
                      <TableCell className="text-center">{r.ca_score}</TableCell>
                      <TableCell className="text-center">{r.exam_score}</TableCell>
                      <TableCell className="text-center font-bold">{r.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={gradeColor(r.grade)}>{r.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(r.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
