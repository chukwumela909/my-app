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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { schoolInfo } from "@/lib/mock-data";

// --- Types ---

interface StudentOption {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  admission_number: string;
  current_class_id: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
}

interface ResultRow {
  id: string;
  student_id: string;
  subject_id: string;
  session: string;
  term: string;
  first_ass: number;
  second_ass: number;
  exam_score: number;
  total: number;
  grade: string;
  class_average: string | null;
  teacher_remark: string | null;
  created_at: string;
  students: { id: string; first_name: string; last_name: string; admission_number: string } | null;
  subjects: { id: string; name: string; code: string } | null;
}

interface ScoreRow {
  subject_id: string;
  subject_name: string;
  first_ass: string;
  second_ass: string;
  exam_score: string;
  class_average: string;
  teacher_remark: string;
  existingId: string | null; // DB id if row was pre-populated
}

interface TermMetadataForm {
  school_days_opened: string;
  attendance: string;
  next_term_begins: string;
  overall_remark: string;
  teacher_comment: string;
  principal_comment: string;
  total_score: string;
  average_score: string;
  overall_grade: string;
}

// --- Constants ---

const REMARK_PRESETS = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Needs Improvement",
  "Poor",
  "Shows Great Potential",
  "Keep It Up",
  "Can Do Better",
  "Below Average",
];

const TERMS = ["First Term", "Second Term", "Third Term"];

function generateSessions(): string[] {
  const currentYear = new Date().getFullYear();
  const sessions: string[] = [];
  for (let i = -2; i <= 2; i++) {
    const start = currentYear + i;
    sessions.push(`${start}/${start + 1}`);
  }
  return sessions;
}

const SESSIONS = generateSessions();

function computeGrade(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
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

const emptyTermMetadata: TermMetadataForm = {
  school_days_opened: "",
  attendance: "",
  next_term_begins: "",
  overall_remark: "",
  teacher_comment: "",
  principal_comment: "",
  total_score: "",
  average_score: "",
  overall_grade: "",
};

// --- Remark Select Component ---

function RemarkSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const isCustom = value !== "" && !REMARK_PRESETS.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={showCustom ? "__other__" : value}
        onChange={(e) => {
          if (e.target.value === "__other__") {
            setShowCustom(true);
            onChange("");
          } else {
            setShowCustom(false);
            onChange(e.target.value);
          }
        }}
        className="w-full h-8 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
      >
        <option value="">Select...</option>
        {REMARK_PRESETS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
        <option value="__other__">Other...</option>
      </select>
      {showCustom && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom remark..."
          className="h-8 text-xs"
        />
      )}
    </div>
  );
}

// --- Skeleton Row ---

function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}>
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// --- Main Component ---

export default function ResultsPage() {
  // Shared data
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("by-student");

  // By Student state
  const [bsClassFilter, setBsClassFilter] = useState("");
  const [bsStudentId, setBsStudentId] = useState("");
  const [bsSession, setBsSession] = useState(schoolInfo.currentSession);
  const [bsTerm, setBsTerm] = useState(schoolInfo.currentTerm);
  const [bsScoreRows, setBsScoreRows] = useState<ScoreRow[]>([]);
  const [bsTermMeta, setBsTermMeta] = useState<TermMetadataForm>({ ...emptyTermMetadata });
  const [bsLoading, setBsLoading] = useState(false);
  const [bsSaving, setBsSaving] = useState(false);
  const [bsDataLoaded, setBsDataLoaded] = useState(false);
  const [bsHasExisting, setBsHasExisting] = useState(false);
  const [bsTermDetailsOpen, setBsTermDetailsOpen] = useState(true);
  const [bsDirty, setBsDirty] = useState(false);

  // By Class & Subject state
  const [bcClassId, setBcClassId] = useState("");
  const [bcSubjectId, setBcSubjectId] = useState("");
  const [bcSession, setBcSession] = useState(schoolInfo.currentSession);
  const [bcTerm, setBcTerm] = useState(schoolInfo.currentTerm);
  const [bcClassAverage, setBcClassAverage] = useState("");
  const [bcRows, setBcRows] = useState<{
    student_id: string;
    student_name: string;
    first_ass: string;
    second_ass: string;
    exam_score: string;
    teacher_remark: string;
    existingId: string | null;
  }[]>([]);
  const [bcLoading, setBcLoading] = useState(false);
  const [bcSaving, setBcSaving] = useState(false);
  const [bcDataLoaded, setBcDataLoaded] = useState(false);
  const [bcHasExisting, setBcHasExisting] = useState(false);
  const [bcDirty, setBcDirty] = useState(false);

  // Results table (filtered view)
  const [filteredResults, setFilteredResults] = useState<ResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Track initial data for dirty checking
  const bsInitialRef = useRef<string>("");
  const bcInitialRef = useRef<string>("");

  // --- Data fetching ---

  const fetchOptions = useCallback(async () => {
    const [studRes, subjRes, classRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/subjects"),
      fetch("/api/admin/classes"),
    ]);
    if (studRes.ok) {
      const data = await studRes.json();
      setStudents(
        data.students.map((s: StudentOption & Record<string, unknown>) => ({
          id: s.id,
          first_name: s.first_name,
          middle_name: s.middle_name,
          last_name: s.last_name,
          admission_number: s.admission_number,
          current_class_id: s.current_class_id,
        }))
      );
    }
    if (subjRes.ok) {
      const data = await subjRes.json();
      setSubjects(data.subjects);
    }
    if (classRes.ok) {
      const data = await classRes.json();
      setClasses(data.classes);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Auto-sync class filter when student is selected in By Student
  useEffect(() => {
    if (bsStudentId) {
      const student = students.find((s) => s.id === bsStudentId);
      if (student) {
        setBsClassFilter(student.current_class_id);
      }
    }
  }, [bsStudentId, students]);

  // --- By Student: Load data ---

  const loadByStudentData = useCallback(async () => {
    if (!bsStudentId || !bsSession || !bsTerm) return;

    setBsLoading(true);
    setBsDataLoaded(false);
    setBsHasExisting(false);
    setError("");

    try {
      // Fetch existing results and term metadata in parallel
      const [resultsRes, metaRes] = await Promise.all([
        fetch(`/api/admin/results?studentId=${bsStudentId}&session=${encodeURIComponent(bsSession)}&term=${encodeURIComponent(bsTerm)}`),
        fetch(`/api/admin/term-metadata?studentId=${bsStudentId}&session=${encodeURIComponent(bsSession)}&term=${encodeURIComponent(bsTerm)}`),
      ]);

      let existingResults: ResultRow[] = [];
      if (resultsRes.ok) {
        const data = await resultsRes.json();
        existingResults = data.results || [];
      }

      let existingMeta = null;
      if (metaRes.ok) {
        const data = await metaRes.json();
        existingMeta = data.metadata;
      }

      // Build score rows: all subjects, pre-filled with existing data
      const existingBySubject = new Map<string, ResultRow>();
      existingResults.forEach((r) => {
        existingBySubject.set(r.subject_id, r);
      });

      const rows: ScoreRow[] = subjects.map((subj) => {
        const existing = existingBySubject.get(subj.id);
        return {
          subject_id: subj.id,
          subject_name: subj.name,
          first_ass: existing ? String(existing.first_ass) : "0",
          second_ass: existing ? String(existing.second_ass) : "0",
          exam_score: existing ? String(existing.exam_score) : "0",
          class_average: existing?.class_average || "",
          teacher_remark: existing?.teacher_remark || "",
          existingId: existing?.id || null,
        };
      });

      setBsScoreRows(rows);
      setBsHasExisting(existingResults.length > 0);

      // Term metadata
      if (existingMeta) {
        setBsTermMeta({
          school_days_opened: existingMeta.school_days_opened || "",
          attendance: existingMeta.attendance || "",
          next_term_begins: existingMeta.next_term_begins || "",
          overall_remark: existingMeta.overall_remark || "",
          teacher_comment: existingMeta.teacher_comment || "",
          principal_comment: existingMeta.principal_comment || "",
          total_score: existingMeta.total_score || "",
          average_score: existingMeta.average_score || "",
          overall_grade: existingMeta.overall_grade || "",
        });
        setBsTermDetailsOpen(false); // collapse if pre-filled
      } else {
        setBsTermMeta({ ...emptyTermMetadata });
        setBsTermDetailsOpen(true);
      }

      setBsDataLoaded(true);
      setBsDirty(false);
      bsInitialRef.current = JSON.stringify({ rows, meta: existingMeta });
    } catch {
      setError("Failed to load data");
    }
    setBsLoading(false);
  }, [bsStudentId, bsSession, bsTerm, subjects]);

  useEffect(() => {
    if (bsStudentId && bsSession && bsTerm && subjects.length > 0) {
      loadByStudentData();
    }
  }, [bsStudentId, bsSession, bsTerm, subjects.length, loadByStudentData]);

  // --- By Student: Row manipulation ---

  const bsUpdateRow = (index: number, field: keyof ScoreRow, value: string) => {
    setBsScoreRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setBsDirty(true);
  };

  const bsRemoveRow = async (index: number) => {
    const row = bsScoreRows[index];
    if (row.existingId) {
      if (!confirm(`This will permanently delete the ${row.subject_name} result from the database. Are you sure?`)) return;
      // Delete from DB
      const res = await fetch(`/api/admin/results?id=${row.existingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to delete result");
        return;
      }
    }
    setBsScoreRows((prev) => prev.filter((_, i) => i !== index));
    setBsDirty(true);
  };

  const bsAddSubject = (subjectId: string) => {
    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return;
    setBsScoreRows((prev) => [
      ...prev,
      {
        subject_id: subj.id,
        subject_name: subj.name,
        first_ass: "0",
        second_ass: "0",
        exam_score: "0",
        class_average: "",
        teacher_remark: "",
        existingId: null,
      },
    ]);
    setBsDirty(true);
  };

  // Available subjects not in current rows
  const bsAvailableSubjects = subjects.filter(
    (s) => !bsScoreRows.some((r) => r.subject_id === s.id)
  );

  // --- By Student: Save ---

  const bsSaveAll = async () => {
    if (bsScoreRows.length === 0) {
      setError("No subjects to save");
      return;
    }

    setBsSaving(true);
    setError("");
    setSuccessMsg("");

    const results = bsScoreRows.map((row) => ({
      student_id: bsStudentId,
      subject_id: row.subject_id,
      session: bsSession,
      term: bsTerm,
      first_ass: Number(row.first_ass) || 0,
      second_ass: Number(row.second_ass) || 0,
      exam_score: Number(row.exam_score) || 0,
      class_average: row.class_average || undefined,
      teacher_remark: row.teacher_remark || undefined,
    }));

    const metaPayload = {
      student_id: bsStudentId,
      session: bsSession,
      term: bsTerm,
      ...bsTermMeta,
    };

    try {
      const [bulkRes, metaRes] = await Promise.all([
        fetch("/api/admin/results/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results }),
        }),
        fetch("/api/admin/term-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metaPayload),
        }),
      ]);

      if (!bulkRes.ok) {
        const data = await bulkRes.json().catch(() => null);
        setError(data?.error || "Failed to save results");
        setBsSaving(false);
        return;
      }

      if (!metaRes.ok) {
        const data = await metaRes.json().catch(() => null);
        setError(data?.error || "Failed to save term metadata");
        setBsSaving(false);
        return;
      }

      const bulkData = await bulkRes.json();
      setSuccessMsg(`Results saved successfully (${bulkData.saved} subjects)`);
      setBsDirty(false);

      // Reload data to refresh existingIds
      await loadByStudentData();

      // Load filtered results
      loadFilteredResults(bsStudentId, bsSession, bsTerm);
    } catch {
      setError("Network error — could not save");
    }
    setBsSaving(false);
  };

  // --- Filtered results view ---

  const loadFilteredResults = async (studentId: string, session: string, term: string) => {
    setResultsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/results?studentId=${studentId}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}`
      );
      if (res.ok) {
        const data = await res.json();
        setFilteredResults(data.results || []);
      }
    } catch { /* ignore */ }
    setResultsLoading(false);
  };

  // --- By Class & Subject: Load data ---

  const loadByClassSubjectData = useCallback(async () => {
    if (!bcClassId || !bcSubjectId || !bcSession || !bcTerm) return;

    setBcLoading(true);
    setBcDataLoaded(false);
    setBcHasExisting(false);
    setError("");

    try {
      // Fetch students in class and existing results
      const [studRes, resultsRes] = await Promise.all([
        fetch(`/api/admin/students?classId=${bcClassId}`),
        fetch(`/api/admin/results?session=${encodeURIComponent(bcSession)}&term=${encodeURIComponent(bcTerm)}`),
      ]);

      let classStudents: StudentOption[] = [];
      if (studRes.ok) {
        const data = await studRes.json();
        classStudents = data.students.map((s: StudentOption & Record<string, unknown>) => ({
          id: s.id,
          first_name: s.first_name,
          middle_name: s.middle_name,
          last_name: s.last_name,
          admission_number: s.admission_number,
          current_class_id: s.current_class_id,
        }));
      }

      let allResults: ResultRow[] = [];
      if (resultsRes.ok) {
        const data = await resultsRes.json();
        allResults = data.results || [];
      }

      // Filter results for this subject
      const existingByStudent = new Map<string, ResultRow>();
      allResults
        .filter((r) => r.subject_id === bcSubjectId)
        .forEach((r) => existingByStudent.set(r.student_id, r));

      // Sort students alphabetically by surname
      classStudents.sort((a, b) => {
        const cmp = a.last_name.localeCompare(b.last_name);
        return cmp !== 0 ? cmp : a.first_name.localeCompare(b.first_name);
      });

      const rows = classStudents.map((st) => {
        const existing = existingByStudent.get(st.id);
        return {
          student_id: st.id,
          student_name: `${st.last_name} ${st.first_name}`,
          first_ass: existing ? String(existing.first_ass) : "0",
          second_ass: existing ? String(existing.second_ass) : "0",
          exam_score: existing ? String(existing.exam_score) : "0",
          teacher_remark: existing?.teacher_remark || "",
          existingId: existing?.id || null,
        };
      });

      // If any existing has class_average, use it
      const firstExisting = allResults.find(
        (r) => r.subject_id === bcSubjectId && r.class_average
      );
      setBcClassAverage(firstExisting?.class_average || "");

      setBcRows(rows);
      setBcHasExisting(existingByStudent.size > 0);
      setBcDataLoaded(true);
      setBcDirty(false);
      bcInitialRef.current = JSON.stringify(rows);
    } catch {
      setError("Failed to load data");
    }
    setBcLoading(false);
  }, [bcClassId, bcSubjectId, bcSession, bcTerm]);

  useEffect(() => {
    if (bcClassId && bcSubjectId && bcSession && bcTerm) {
      loadByClassSubjectData();
    }
  }, [bcClassId, bcSubjectId, bcSession, bcTerm, loadByClassSubjectData]);

  // --- By Class & Subject: Row manipulation ---

  const bcUpdateRow = (index: number, field: string, value: string) => {
    setBcRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setBcDirty(true);
  };

  const bcRemoveRow = async (index: number) => {
    const row = bcRows[index];
    if (row.existingId) {
      if (!confirm(`This will permanently delete ${row.student_name}'s result from the database. Are you sure?`)) return;
      const res = await fetch(`/api/admin/results?id=${row.existingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to delete result");
        return;
      }
    }
    setBcRows((prev) => prev.filter((_, i) => i !== index));
    setBcDirty(true);
  };

  // --- By Class & Subject: Save ---

  const bcSaveAll = async () => {
    if (bcRows.length === 0) {
      setError("No students to save");
      return;
    }

    setBcSaving(true);
    setError("");
    setSuccessMsg("");

    const results = bcRows.map((row) => ({
      student_id: row.student_id,
      subject_id: bcSubjectId,
      session: bcSession,
      term: bcTerm,
      first_ass: Number(row.first_ass) || 0,
      second_ass: Number(row.second_ass) || 0,
      exam_score: Number(row.exam_score) || 0,
      class_average: bcClassAverage || undefined,
      teacher_remark: row.teacher_remark || undefined,
    }));

    try {
      const res = await fetch("/api/admin/results/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save results");
        setBcSaving(false);
        return;
      }

      const data = await res.json();
      setSuccessMsg(`Results saved successfully (${data.saved} students)`);
      setBcDirty(false);
      await loadByClassSubjectData();
    } catch {
      setError("Network error — could not save");
    }
    setBcSaving(false);
  };

  // --- Tab switch guard ---

  const handleTabChange = (newTab: string) => {
    const isDirty = activeTab === "by-student" ? bsDirty : bcDirty;
    if (isDirty) {
      if (!confirm("You have unsaved changes. Discard?")) return;
    }
    setActiveTab(newTab);
    setError("");
    setSuccessMsg("");
  };

  // --- Filtered students for By Student dropdown ---

  const bsFilteredStudents = bsClassFilter
    ? students.filter((s) => s.current_class_id === bsClassFilter)
    : students;

  // --- Select styling ---
  const selectClass = "w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Results</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage student examination results
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="by-student">By Student</TabsTrigger>
          <TabsTrigger value="by-class-subject">By Class &amp; Subject</TabsTrigger>
        </TabsList>

        {/* ==================== BY STUDENT TAB ==================== */}
        <TabsContent value="by-student">
          <Card className="border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Enter Results by Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Class (filter)</Label>
                  <select
                    value={bsClassFilter}
                    onChange={(e) => {
                      setBsClassFilter(e.target.value);
                      setBsStudentId("");
                      setBsDataLoaded(false);
                      setBsScoreRows([]);
                      setFilteredResults([]);
                    }}
                    className={selectClass}
                  >
                    <option value="">All classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Student</Label>
                  <select
                    value={bsStudentId}
                    onChange={(e) => {
                      setBsStudentId(e.target.value);
                      setBsDataLoaded(false);
                      setBsScoreRows([]);
                      setFilteredResults([]);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select student...</option>
                    {bsFilteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name} ({s.admission_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Session</Label>
                  <select
                    value={bsSession}
                    onChange={(e) => {
                      setBsSession(e.target.value);
                      setBsDataLoaded(false);
                      setBsScoreRows([]);
                    }}
                    className={selectClass}
                  >
                    {SESSIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Term</Label>
                  <select
                    value={bsTerm}
                    onChange={(e) => {
                      setBsTerm(e.target.value);
                      setBsDataLoaded(false);
                      setBsScoreRows([]);
                    }}
                    className={selectClass}
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Empty state */}
              {!bsStudentId && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  Select a student, session, and term to begin entering results.
                </div>
              )}

              {/* Overwrite warning */}
              {bsHasExisting && bsDataLoaded && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg text-sm">
                  Results already exist for this student — editing and saving will overwrite the existing scores.
                </div>
              )}

              {/* Score table */}
              {bsStudentId && (bsLoading || bsDataLoaded) && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Subject</TableHead>
                        <TableHead className="w-20 text-center">1st Ass (20)</TableHead>
                        <TableHead className="w-20 text-center">2nd Ass (20)</TableHead>
                        <TableHead className="w-20 text-center">Exam (60)</TableHead>
                        <TableHead className="w-20 text-center">Total</TableHead>
                        <TableHead className="w-20 text-center">Grade</TableHead>
                        <TableHead className="w-24 text-center">Class Avg</TableHead>
                        <TableHead className="min-w-[160px]">Remark</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bsLoading ? (
                        <SkeletonRows count={6} />
                      ) : (
                        bsScoreRows.map((row, i) => {
                          const total = (Number(row.first_ass) || 0) + (Number(row.second_ass) || 0) + (Number(row.exam_score) || 0);
                          const grade = computeGrade(total);
                          return (
                            <TableRow key={row.subject_id}>
                              <TableCell className="font-medium text-sm">{row.subject_name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={row.first_ass}
                                  onChange={(e) => bsUpdateRow(i, "first_ass", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={row.second_ass}
                                  onChange={(e) => bsUpdateRow(i, "second_ass", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={60}
                                  value={row.exam_score}
                                  onChange={(e) => bsUpdateRow(i, "exam_score", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell className="text-center font-bold text-sm">{total}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={gradeColor(grade)}>{grade}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={row.class_average}
                                  onChange={(e) => bsUpdateRow(i, "class_average", e.target.value)}
                                  className="h-8 w-20 text-center text-sm mx-auto"
                                  placeholder="—"
                                />
                              </TableCell>
                              <TableCell>
                                <RemarkSelect
                                  value={row.teacher_remark}
                                  onChange={(val) => bsUpdateRow(i, "teacher_remark", val)}
                                />
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => bsRemoveRow(i)}
                                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                                  title="Remove subject"
                                >
                                  ×
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Add Subject button */}
              {bsDataLoaded && bsAvailableSubjects.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id="bs-add-subject"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        bsAddSubject(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className={selectClass + " max-w-xs"}
                  >
                    <option value="">+ Add Subject...</option>
                    {bsAvailableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Term Details (collapsible) */}
              {bsDataLoaded && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg">
                  <button
                    onClick={() => setBsTermDetailsOpen(!bsTermDetailsOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg"
                  >
                    <span>Term Details (Attendance, Comments, Footer Scores)</span>
                    <span className="text-lg">{bsTermDetailsOpen ? "▾" : "▸"}</span>
                  </button>
                  {bsTermDetailsOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>School Days Opened</Label>
                        <Input
                          value={bsTermMeta.school_days_opened}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, school_days_opened: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. 90"
                        />
                      </div>
                      <div>
                        <Label>Attendance</Label>
                        <Input
                          value={bsTermMeta.attendance}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, attendance: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. 82"
                        />
                      </div>
                      <div>
                        <Label>Next Term Begins</Label>
                        <Input
                          value={bsTermMeta.next_term_begins}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, next_term_begins: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. April 28, 2026"
                        />
                      </div>
                      <div>
                        <Label>Total Score</Label>
                        <Input
                          value={bsTermMeta.total_score}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, total_score: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. 630"
                        />
                      </div>
                      <div>
                        <Label>Average Score</Label>
                        <Input
                          value={bsTermMeta.average_score}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, average_score: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. 78.75"
                        />
                      </div>
                      <div>
                        <Label>Overall Grade</Label>
                        <Input
                          value={bsTermMeta.overall_grade}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, overall_grade: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. A"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label>Overall Remark</Label>
                        <Input
                          value={bsTermMeta.overall_remark}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, overall_remark: e.target.value }); setBsDirty(true); }}
                          placeholder="e.g. An excellent performance"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label>Teacher&apos;s Comment</Label>
                        <Input
                          value={bsTermMeta.teacher_comment}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, teacher_comment: e.target.value }); setBsDirty(true); }}
                          placeholder="Teacher's comment"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <Label>Principal&apos;s Comment</Label>
                        <Input
                          value={bsTermMeta.principal_comment}
                          onChange={(e) => { setBsTermMeta({ ...bsTermMeta, principal_comment: e.target.value }); setBsDirty(true); }}
                          placeholder="Principal's comment"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save All button */}
              {bsDataLoaded && (
                <div className="flex justify-end">
                  <Button
                    onClick={bsSaveAll}
                    disabled={bsSaving}
                    className="min-w-[140px]"
                  >
                    {bsSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save All"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filtered results table */}
          {filteredResults.length > 0 && (
            <Card className="border-slate-200 dark:border-zinc-800 mt-6">
              <CardHeader>
                <CardTitle className="text-base">Saved Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {resultsLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">1st Ass</TableHead>
                          <TableHead className="text-center">2nd Ass</TableHead>
                          <TableHead className="text-center">Exam</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">Class Avg</TableHead>
                          <TableHead>Remark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.subjects?.name ?? "—"}</TableCell>
                            <TableCell className="text-center">{r.first_ass}</TableCell>
                            <TableCell className="text-center">{r.second_ass}</TableCell>
                            <TableCell className="text-center">{r.exam_score}</TableCell>
                            <TableCell className="text-center font-bold">{r.total}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={gradeColor(r.grade)}>{r.grade}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{r.class_average ?? "—"}</TableCell>
                            <TableCell className="text-sm">{r.teacher_remark ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== BY CLASS & SUBJECT TAB ==================== */}
        <TabsContent value="by-class-subject">
          <Card className="border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Enter Results by Class &amp; Subject</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Class</Label>
                  <select
                    value={bcClassId}
                    onChange={(e) => {
                      setBcClassId(e.target.value);
                      setBcDataLoaded(false);
                      setBcRows([]);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select class...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <select
                    value={bcSubjectId}
                    onChange={(e) => {
                      setBcSubjectId(e.target.value);
                      setBcDataLoaded(false);
                      setBcRows([]);
                    }}
                    className={selectClass}
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Session</Label>
                  <select
                    value={bcSession}
                    onChange={(e) => {
                      setBcSession(e.target.value);
                      setBcDataLoaded(false);
                      setBcRows([]);
                    }}
                    className={selectClass}
                  >
                    {SESSIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Term</Label>
                  <select
                    value={bcTerm}
                    onChange={(e) => {
                      setBcTerm(e.target.value);
                      setBcDataLoaded(false);
                      setBcRows([]);
                    }}
                    className={selectClass}
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Empty state */}
              {(!bcClassId || !bcSubjectId) && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  Select a class, subject, session, and term to begin entering results.
                </div>
              )}

              {/* Overwrite warning */}
              {bcHasExisting && bcDataLoaded && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg text-sm">
                  Results already exist for some students — editing and saving will overwrite the existing scores.
                </div>
              )}

              {/* Class average (single field at top) */}
              {bcDataLoaded && (
                <div className="max-w-xs">
                  <Label>Class Average (applies to all students)</Label>
                  <Input
                    value={bcClassAverage}
                    onChange={(e) => { setBcClassAverage(e.target.value); setBcDirty(true); }}
                    placeholder="e.g. 65.2"
                  />
                </div>
              )}

              {/* Score table */}
              {bcClassId && bcSubjectId && (bcLoading || bcDataLoaded) && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Student</TableHead>
                        <TableHead className="w-20 text-center">1st Ass (20)</TableHead>
                        <TableHead className="w-20 text-center">2nd Ass (20)</TableHead>
                        <TableHead className="w-20 text-center">Exam (60)</TableHead>
                        <TableHead className="w-20 text-center">Total</TableHead>
                        <TableHead className="w-20 text-center">Grade</TableHead>
                        <TableHead className="min-w-[160px]">Remark</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bcLoading ? (
                        <SkeletonRows count={8} />
                      ) : (
                        bcRows.map((row, i) => {
                          const total = (Number(row.first_ass) || 0) + (Number(row.second_ass) || 0) + (Number(row.exam_score) || 0);
                          const grade = computeGrade(total);
                          return (
                            <TableRow key={row.student_id}>
                              <TableCell className="font-medium text-sm">{row.student_name}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={row.first_ass}
                                  onChange={(e) => bcUpdateRow(i, "first_ass", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={row.second_ass}
                                  onChange={(e) => bcUpdateRow(i, "second_ass", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={60}
                                  value={row.exam_score}
                                  onChange={(e) => bcUpdateRow(i, "exam_score", e.target.value)}
                                  className="h-8 w-16 text-center text-sm mx-auto"
                                />
                              </TableCell>
                              <TableCell className="text-center font-bold text-sm">{total}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={gradeColor(grade)}>{grade}</Badge>
                              </TableCell>
                              <TableCell>
                                <RemarkSelect
                                  value={row.teacher_remark}
                                  onChange={(val) => bcUpdateRow(i, "teacher_remark", val)}
                                />
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() => bcRemoveRow(i)}
                                  className="text-red-500 hover:text-red-700 text-lg font-bold"
                                  title="Remove student"
                                >
                                  ×
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Save All button */}
              {bcDataLoaded && (
                <div className="flex justify-end">
                  <Button
                    onClick={bcSaveAll}
                    disabled={bcSaving}
                    className="min-w-[140px]"
                  >
                    {bcSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save All"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
