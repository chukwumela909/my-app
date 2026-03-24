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

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  current_class_id: string;
  photo_url: string | null;
  created_at: string;
  classes: ClassOption | null;
}

interface GeneratedPin {
  studentName: string;
  admissionNumber: string;
  pin: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [generatedPin, setGeneratedPin] = useState<GeneratedPin | null>(null);

  const [form, setForm] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    current_class_id: "",
  });

  const fetchStudents = useCallback(async () => {
    const res = await fetch("/api/admin/students");
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students);
    }
    setLoading(false);
  }, []);

  const fetchClasses = useCallback(async () => {
    const res = await fetch("/api/admin/classes");
    if (res.ok) {
      const data = await res.json();
      setClasses(data.classes);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  const resetForm = () => {
    setForm({ admission_number: "", first_name: "", last_name: "", current_class_id: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;

    const res = await fetch("/api/admin/students", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      resetForm();
      fetchStudents();
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      current_class_id: student.current_class_id,
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const res = await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchStudents();
  };

  const handleGeneratePin = async (student: Student) => {
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setGeneratedPin({
        studentName: `${student.first_name} ${student.last_name}`,
        admissionNumber: student.admission_number,
        pin: data.plain_pin,
      });
    }
  };

  const filtered = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student records and access PINs
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          + Add Student
        </Button>
      </div>

      {/* PIN display modal */}
      {generatedPin && (
        <Card className="border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  PIN Generated Successfully
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Student: {generatedPin.studentName} ({generatedPin.admissionNumber})
                </p>
                <p className="text-2xl font-mono font-bold text-green-900 dark:text-green-200 mt-2 tracking-widest">
                  {generatedPin.pin}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Save this PIN — it cannot be retrieved again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setGeneratedPin(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <Card className="border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Student" : "Add New Student"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admission_number">Admission Number</Label>
                <Input
                  id="admission_number"
                  value={form.admission_number}
                  onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                  placeholder="ADM/2023/001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="class">Class</Label>
                <select
                  id="class"
                  value={form.current_class_id}
                  onChange={(e) => setForm({ ...form, current_class_id: e.target.value })}
                  required
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                >
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">{editingId ? "Update" : "Add"} Student</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Input
        placeholder="Search by name or admission number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Card className="border-slate-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {search ? "No students match your search." : "No students yet. Add one to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">
                      {student.admission_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.classes?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePin(student)}
                        >
                          Generate PIN
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
