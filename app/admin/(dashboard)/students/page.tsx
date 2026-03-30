"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  middle_name: string | null;
  last_name: string;
  current_class_id: string;
  photo_url: string | null;
  created_at: string;
  classes: ClassOption | null;
}

interface StudentWithPin extends Student {
  pin?: string;
}

interface GeneratedPin {
  studentName: string;
  admissionNumber: string;
  pin: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithPin[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [generatedPin, setGeneratedPin] = useState<GeneratedPin | null>(null);
  const [error, setError] = useState("");
  const [suggestedNumber, setSuggestedNumber] = useState("001");
  const [classFilter, setClassFilter] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    admission_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    current_class_id: "",
  });

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setError("");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Failed to load students (${res.status})`);
      }
    } catch {
      setError("Network error — could not reach server");
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

  const fetchSuggestedNumber = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/students?lastAdmission");
      if (res.ok) {
        const data = await res.json();
        const last = data.lastAdmissionNumber;
        if (last) {
          // Extract the numeric suffix — e.g. "GIS/2026/003" -> 3
          const match = last.match(/(\d+)$/);
          if (match) {
            const next = String(parseInt(match[1], 10) + 1).padStart(3, "0");
            setSuggestedNumber(next);
            return next;
          }
        }
      }
    } catch { /* ignore */ }
    setSuggestedNumber("001");
    return "001";
  }, []);

  const resetForm = () => {
    setForm({ admission_number: "", first_name: "", middle_name: "", last_name: "", current_class_id: "" });
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
      const data = await res.json();
      setError("");

      // Show auto-generated PIN for new students
      if (!editingId && data.plain_pin) {
        setGeneratedPin({
          studentName: `${form.first_name}${form.middle_name ? ` ${form.middle_name}` : ''} ${form.last_name}`,
          admissionNumber: form.admission_number,
          pin: data.plain_pin,
        });
      }

      resetForm();
      fetchStudents();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || `Failed to save student (${res.status})`);
    }
  };

  const handleEdit = (student: Student) => {
    setForm({
      admission_number: student.admission_number,
      first_name: student.first_name,
      middle_name: student.middle_name ?? "",
      last_name: student.last_name,
      current_class_id: student.current_class_id,
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    const res = await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setError("");
      fetchStudents();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || `Failed to delete student (${res.status})`);
    }
  };

  const handleGeneratePin = async (student: Student) => {
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setError("");
      setGeneratedPin({
        studentName: `${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ''} ${student.last_name}`,
        admissionNumber: student.admission_number,
        pin: data.plain_pin,
      });
      // Refresh list to get updated pin from DB
      fetchStudents();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || `Failed to generate PIN (${res.status})`);
    }
  };

  const filtered = students.filter(
    (s) =>
      (classFilter === "" || s.current_class_id === classFilter) &&
      (s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.middle_name || "").toLowerCase().includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase()))
  );

  const handlePrintList = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = filtered.map((s) => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px;">${s.admission_number}</td>
        <td style="border:1px solid #ddd;padding:8px;">${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ''} ${s.last_name}</td>
        <td style="border:1px solid #ddd;padding:8px;">${s.classes?.name ?? '—'}</td>
        <td style="border:1px solid #ddd;padding:8px;font-family:monospace;">${s.pin ?? '—'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Student List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { border-collapse: collapse; width: 100%; }
            th { border: 1px solid #ddd; padding: 8px; background: #f5f5f5; text-align: left; }
            td { border: 1px solid #ddd; padding: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Student List</h1>
          <table>
            <thead>
              <tr>
                <th>Admission #</th>
                <th>Name</th>
                <th>Class</th>
                <th>PIN</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <br />
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadCSV = () => {
    const header = "Admission Number,Name,Class,PIN";
    const rows = filtered.map((s) =>
      `"${s.admission_number}","${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ''} ${s.last_name}","${s.classes?.name ?? '—'}","${s.pin ?? '—'}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage student records and access PINs
          </p>
        </div>
        <Button onClick={async () => {
          resetForm();
          const num = await fetchSuggestedNumber();
          setForm((f) => ({ ...f, admission_number: `GIS/2026/${num}` }));
          setShowForm(true);
        }}>
          + Add Student
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

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
                  placeholder={`GIS/2026/${suggestedNumber}`}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Suggested: GIS/2026/{suggestedNumber}
                </p>
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
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={form.middle_name}
                  onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                  placeholder="Optional"
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

      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-3 flex-1">
          <Input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintList}>
            Print List
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </div>
      </div>

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
                  <TableHead>PIN</TableHead>
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
                      {student.first_name}{student.middle_name ? ` ${student.middle_name}` : ''} {student.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.classes?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {student.pin ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
