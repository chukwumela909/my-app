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

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  levels: string[];
  created_at: string;
}

const ALL_LEVELS = [
  "Creche", "Pre-Nursery", "Nursery", "Transition Class",
  "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
  "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3",
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", levels: [] as string[] });
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [levelsDropdownOpen, setLevelsDropdownOpen] = useState(false);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
        setError("");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Failed to load subjects (${res.status})`);
      }
    } catch {
      setError("Network error — could not reach server");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const resetForm = () => {
    setForm({ name: "", code: "", levels: [] });
    setEditingId(null);
    setShowForm(false);
    setLevelsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    const res = await fetch("/api/admin/subjects", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setError("");
      resetForm();
      fetchSubjects();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || `Failed to save subject (${res.status})`);
    }
  };

  const handleEdit = (subject: SubjectItem) => {
    setForm({ name: subject.name, code: subject.code, levels: subject.levels ?? [] });
    setEditingId(subject.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject? Existing results for this subject will be affected.")) return;
    const res = await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setError("");
      fetchSubjects();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || `Failed to delete subject (${res.status})`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage school subjects
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          + Add Subject
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Subject" : "Add New Subject"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MATH"
                  required
                />
              </div>
              <div className="sm:col-span-2 relative">
                <Label>Levels</Label>
                <button
                  type="button"
                  onClick={() => setLevelsDropdownOpen(!levelsDropdownOpen)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm text-left flex items-center justify-between"
                >
                  <span className={form.levels.length === 0 ? "text-slate-400" : ""}>
                    {form.levels.length === 0
                      ? "Select levels..."
                      : `${form.levels.length} level${form.levels.length > 1 ? "s" : ""} selected`}
                  </span>
                  <span className="text-xs">{levelsDropdownOpen ? "▲" : "▼"}</span>
                </button>
                {levelsDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, levels: ALL_LEVELS.slice() })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, levels: [] })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    {ALL_LEVELS.map((level) => (
                      <label
                        key={level}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.levels.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, levels: [...form.levels, level] });
                            } else {
                              setForm({ ...form, levels: form.levels.filter((l) => l !== level) });
                            }
                          }}
                          className="rounded"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Add"} Subject</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card className="border-slate-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {search ? "No subjects match your search." : "No subjects yet. Add one to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Levels</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => {
                  const levels = subject.levels ?? [];
                  return (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {levels.length === 0 ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            No levels
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {levels.slice(0, 4).map((l) => (
                              <Badge key={l} variant="outline" className="text-xs">
                                {l}
                              </Badge>
                            ))}
                            {levels.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{levels.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(subject)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(subject.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
