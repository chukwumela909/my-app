import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconGraduationCap, IconBookOpen, IconUserCheck, IconArrowRight, IconSchool } from "@/components/ui/custom-icons";
import { schoolInfo } from "@/lib/mock-data";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header / Config Bar */}
      <header className="px-6 py-4 bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="flex items-center gap-2">
            <div className=" rounded-full p-1 shadow-sm h-10 w-10 relative flex items-center justify-center overflow-hidden">
               <Image src="/goodnews-logo.png" alt="School Logo" fill sizes="40px" className="object-contain" />
            </div>
            <span className="font-bold text-xl text-white">{schoolInfo.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className="relative py-20 px-6 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2232&auto=format&fit=crop')" }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/70"></div>
          
          <div className="relative max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1.5 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-blue-400/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Results for {schoolInfo.currentSession} {schoolInfo.currentTerm} are out!
            </div>
            
            <div className="flex flex-col items-center justify-center">
                <TextGenerateEffect 
                  words="Academic Result" 
                  className="text-4xl md:text-6xl font-extrabold text-white tracking-tight text-center inline-block"
                />
                <TextGenerateEffect 
                  words="Checking Portal" 
                  className="text-4xl md:text-6xl font-extrabold text-blue-400 tracking-tight text-center inline-block -mt-2 md:-mt-4"
                  delay={0.7}
                />
            </div>
            
            <p className="text-lg text-slate-200 max-w-2xl mx-auto">
              Welcome to the official result checking system for {schoolInfo.name}. 
              Enter your student details to securely access your academic performance reports.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/check-result">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 bg-blue-600 hover:bg-blue-700">
                  Check Result <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-white border-white/30 bg-transparent hover:bg-transparent hover:border-blue-400 hover:text-blue-400">
                  How it works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features / Notice Board Section */}
        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">How it works</h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">Accessing your academic results is simple, secure, and straightforward in 3 easy steps.</p>
          </div>

          <div className="relative max-w-5xl mx-auto mt-12 mb-8">
            {/* Connecting Dashed Line (Desktop only) */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-blue-200 z-0"></div>

            <div className="grid md:grid-cols-3 gap-16 md:gap-8 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center text-blue-600 border border-blue-50 relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                    <IconUserCheck className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold shadow-md z-20 transition-transform duration-500 group-hover:scale-110">1</div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Enter Credentials</h3>
                <p className="text-slate-500 text-sm mt-3 max-w-[260px] leading-relaxed">
                  Use your unique Student Admission Number and the securely issued PIN for the term.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center text-blue-600 border border-blue-50 relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                    <IconBookOpen className="h-8 w-8" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold shadow-md z-20 transition-transform duration-500 group-hover:scale-110">2</div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">View Breakdown</h3>
                <p className="text-slate-500 text-sm mt-3 max-w-[260px] leading-relaxed">
                  See detailed breakdown of scores including Continuous Assessments (CA) and Exams.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center text-blue-600 border border-blue-50 relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
                    <IconGraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold shadow-md z-20 transition-transform duration-500 group-hover:scale-110">3</div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Download & Print</h3>
                <p className="text-slate-500 text-sm mt-3 max-w-[260px] leading-relaxed">
                  Download the official result slip in PDF format or print it directly for your records.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notice Section */}
        <section className="bg-slate-100 py-16 px-6">
            <div className="max-w-3xl mx-auto text-center border-l-4 border-blue-500 bg-white p-6 shadow-sm rounded-r-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">📢 Important Notice</h3>
                <p className="text-slate-600">
                    School resumes for the next session on <strong>September 10th, 2026</strong>. 
                    Please ensure all school fees are paid before resumption. If you have issues checking your result, contact the ICT unit.
                </p>
            </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {schoolInfo.name}. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="#" className="hover:text-blue-600">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
