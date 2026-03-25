"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  IconSchool, 
  IconPrinter, 
  IconDownload, 
  IconArrowLeft, 
  IconAward, 
  IconTrendingUp, 
  IconBookOpen, 
  IconClock, 
  IconCalendar, 
  IconHash, 
  IconUser 
} from "@/components/ui/custom-icons";
import { schoolInfo } from "@/lib/mock-data";
import type { ResultRecord } from "@/lib/mock-data";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

function getGradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400";
    case "B":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400";
    case "C":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400";
    case "D":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-400";
    case "F":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300";
  }
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultLoading />}>
      <ResultContent />
    </Suspense>
  );
}

function ResultLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading result...</p>
      </div>
    </div>
  );
}

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: string;
  photoUrl: string | null;
}

interface ResultSummary {
  totalScore: number;
  averageScore: number;
  subjectCount: number;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const resultToken = searchParams.get("token");

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [summary, setSummary] = useState<ResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId || !resultToken) {
      setError("No student ID or session token provided. Please go back and check your result.");
      setLoading(false);
      return;
    }

    async function fetchResult() {
      try {
        const res = await fetch(`/api/result?studentId=${encodeURIComponent(studentId!)}&token=${encodeURIComponent(resultToken!)}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load results.");
          setLoading(false);
          return;
        }

        setStudent(data.student);
        setResults(data.results);
        setSummary(data.summary);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [studentId, resultToken]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <ResultLoading />;
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 dark:text-red-400 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Unable to Load Result</h2>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
            <Link href="/check-result">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                <IconArrowLeft className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 font-sans">
      {/* Header - Hidden on print */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-4 print:hidden"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/check-result" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <IconArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-0.5 shadow-sm h-10 w-10 relative flex items-center justify-center overflow-hidden border border-slate-200">
               <Image src="/goodnews-logo.png" alt="School Logo" fill sizes="40px" className="object-contain p-1" />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100 hidden sm:inline">{schoolInfo.name}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
              <IconPrinter className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrint}>
              <IconDownload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Result Sheet */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="visible"
        >
          <Card className="shadow-xl dark:shadow-2xl border-0 overflow-hidden dark:bg-zinc-900">
            {/* School Header Banner */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-slate-900 text-white p-8 sm:p-10 text-center relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse-slow"></div>
              
              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="h-24 w-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30 relative overflow-hidden">
                    <Image src="/goodnews-logo.png" alt="School Logo" fill sizes="96px" className="object-contain p-2" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wide mb-2">{schoolInfo.name}</h1>
                <p className="text-blue-100 text-sm sm:text-base font-medium opacity-90">{schoolInfo.address}</p>
                <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-semibold border border-white/20 shadow-sm">
                  <IconCalendar className="h-4 w-4" />
                  {schoolInfo.currentSession} &bull; {schoolInfo.currentTerm}
                </div>
              </div>
            </motion.div>

            <CardContent className="p-0 sm:p-8">
              {/* Student Info Section */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row gap-8 p-6 mx-4 sm:mx-0 -mt-10 sm:mt-0 relative z-20 bg-white dark:bg-zinc-800 rounded-xl shadow-lg sm:shadow-none border sm:border-0 border-slate-100 dark:border-zinc-700"
              >
                <div className="flex-shrink-0 flex justify-center md:block">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-700 shadow-xl ring-2 ring-slate-100 dark:ring-zinc-600">
                    <AvatarImage src={student.photoUrl || undefined} alt={student.firstName} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-bold">
                      {student.firstName[0]}{student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                   {[
                     { label: "Full Name", value: `${student.firstName} ${student.lastName}`, icon: <IconUser className="h-4 w-4" /> },
                     { label: "Admission No", value: student.admissionNumber, icon: <IconHash className="h-4 w-4" /> },
                     { label: "Class", value: student.class, icon: <IconBookOpen className="h-4 w-4" /> },
                     { label: "Session", value: schoolInfo.currentSession, icon: <IconCalendar className="h-4 w-4" /> },
                     { label: "Term", value: schoolInfo.currentTerm, icon: <IconClock className="h-4 w-4" /> },
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors">
                       <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                         {item.icon} {item.label}
                       </p>
                       <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{item.value}</p>
                     </div>
                   ))}
                </div>
              </motion.div>

              <div className="h-8"></div> {/* Spacer */}

              {/* Results Section */}
              <motion.div variants={itemVariants} className="space-y-4 px-4 sm:px-0">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                       <IconAward className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                       Academic Performance
                    </h3>
                    <Badge variant="secondary" className="hidden sm:flex">Total Subjects: {results.length}</Badge>
                 </div>

                 {/* Desktop Table View */}
                 <div className="hidden md:block rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                   <Table>
                     <TableHeader className="bg-slate-50 dark:bg-zinc-800/50">
                       <TableRow className="border-b border-slate-200 dark:border-zinc-700">
                         <TableHead className="font-bold text-slate-700 dark:text-slate-300">Subject</TableHead>
                         <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">C.A (40)</TableHead>
                         <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Exam (60)</TableHead>
                         <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Total (100)</TableHead>
                         <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Grade</TableHead>
                         <TableHead className="font-bold text-slate-700 dark:text-slate-300">Remark</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {results.map((result, index) => (
                         <TableRow key={index} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors border-b border-slate-100 dark:border-zinc-800">
                           <TableCell className="font-medium text-slate-900 dark:text-slate-100">{result.subject}</TableCell>
                           <TableCell className="text-center text-slate-600 dark:text-slate-400">{result.ca}</TableCell>
                           <TableCell className="text-center text-slate-600 dark:text-slate-400">{result.exam}</TableCell>
                           <TableCell className="text-center font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-zinc-800/30">{result.total}</TableCell>
                           <TableCell className="text-center">
                             <Badge variant="outline" className={`${getGradeColor(result.grade)} font-bold px-3 py-0.5 shadow-sm`}>
                               {result.grade}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-slate-600 dark:text-slate-400 text-sm font-medium">{result.remark}</TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>

                 {/* Mobile Card View */}
                 <div className="grid grid-cols-1 gap-4 md:hidden">
                    {results.map((result, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                         <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900">
                            <CardContent className="p-4">
                               <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-slate-900 dark:text-white">{result.subject}</h4>
                                  <Badge variant="outline" className={`${getGradeColor(result.grade)} font-bold`}>
                                    {result.grade}
                                  </Badge>
                               </div>
                               <div className="grid grid-cols-3 gap-2 text-center text-sm py-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg">
                                  <div>
                                    <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase">C.A</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{result.ca}</span>
                                  </div>
                                  <div>
                                    <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase">Exam</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{result.exam}</span>
                                  </div>
                                  <div>
                                    <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase">Total</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{result.total}</span>
                                  </div>
                               </div>
                               <p className="mt-3 text-xs text-right text-slate-500 italic">"{result.remark}"</p>
                            </CardContent>
                         </Card>
                      </motion.div>
                    ))}
                 </div>
              </motion.div>

              <div className="h-8"></div> {/* Spacer */}

              {/* Summary Section */}
              <div className="grid md:grid-cols-2 gap-6 px-4 sm:px-0">
                {/* Performance Stats */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
                    {/* Abstract bg shapes */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-400/20 blur-2xl"></div>
                    
                    <CardHeader className="pb-2 relative z-10">
                      <CardTitle className="text-lg flex items-center gap-2 text-white/90">
                        <IconTrendingUp className="h-5 w-5" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 relative z-10 pt-4">
                      <div className="flex justify-between items-center text-white p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                        <span className="text-white/80 font-medium">Total Score</span>
                        <div className="text-2xl font-bold flex items-end gap-1">
                          <AnimatedNumber value={summary?.totalScore ?? 0} />
                          <span className="text-sm font-normal text-white/60 mb-1">/ {(summary?.subjectCount ?? 0) * 100}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-white p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                        <span className="text-white/80 font-medium">Average Score</span>
                        <div className="text-2xl font-bold flex items-end gap-1">
                          <AnimatedNumber value={summary?.averageScore ?? 0} />
                          <span className="text-sm font-normal text-white/60 mb-1">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-white p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                        <span className="text-white/80 font-medium">Subjects Taken</span>
                        <Badge className="bg-white text-blue-700 hover:bg-white/90 text-sm py-1 px-3">
                          {summary?.subjectCount ?? 0} subjects
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Principal's Comment */}
                <motion.div variants={itemVariants}>
                  <Card className="h-full border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 shadow-md">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                          <IconUser className="h-5 w-5" />
                          Principal's Remarks
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col h-[calc(100%-4rem)] justify-center">
                      <blockquote className="text-slate-700 dark:text-slate-300 italic text-lg leading-relaxed border-l-4 border-green-300 dark:border-green-700 pl-4 py-2 my-auto">
                        &ldquo;Keep up the great work!&rdquo;
                      </blockquote>
                      <div className="mt-6 flex items-center gap-4">
                         <div className="h-10 w-10 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-green-700 dark:text-green-300 font-serif font-bold italic">
                            P
                         </div>
                         <div>
                            <p className="font-bold text-slate-800 dark:text-white font-serif">The Principal</p>
                            <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-widest font-semibold">Principal</p>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Grading Key - Collapsible on small screens? Keep simple for now */}
              <motion.div variants={itemVariants} className="mt-8 p-4 bg-slate-100 dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700 mx-4 sm:mx-0">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Grading System</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { grade: "A", range: "70-100", desc: "Excellent" },
                    { grade: "B", range: "60-69", desc: "Very Good" },
                    { grade: "C", range: "50-59", desc: "Good" },
                    { grade: "D", range: "40-49", desc: "Pass" },
                    { grade: "F", range: "0-39", desc: "Fail" },
                  ].map((item) => (
                    <div key={item.grade} className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 shadow-sm">
                      <Badge variant="outline" className={`${getGradeColor(item.grade)} h-5 w-5 flex items-center justify-center p-0`}>{item.grade}</Badge>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{item.range}</span>
                      <span className="text-slate-500 dark:text-slate-500 hidden sm:inline">- {item.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

            </CardContent>
          </Card>

          {/* Footer Actions - Hidden on print */}
          <motion.div variants={itemVariants} className="mt-8 text-center print:hidden pb-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Having issues with your result? <a href={`mailto:${schoolInfo.contact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Contact Support</a>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
               Generated on {new Date().toLocaleDateString()}
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
