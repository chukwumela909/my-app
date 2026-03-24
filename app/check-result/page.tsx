"use client";

import Link from "next/link";
import Image from "next/image";
import { IconSchool, IconArrowLeft } from "@/components/ui/custom-icons";
import CheckResultFormDemo from "@/components/ui/check-result-form";
import { schoolInfo } from "@/lib/mock-data";

export default function CheckResultPage() {
  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2232&auto=format&fit=crop')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/80 z-0"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors">
            <IconArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-white">
            <div className="bg-white rounded-full p-0.5 shadow-sm h-8 w-8 relative flex items-center justify-center overflow-hidden">
               <Image src="/logo.png" alt="School Logo" fill sizes="32px" className="object-contain" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">{schoolInfo.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <CheckResultFormDemo />
            
             {/* Demo credentials hint - streamlined */}
             <div className="mt-8 text-center text-white/40 text-xs">
              <p>Demo: ADM/2023/001 | PIN: 1234</p>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {schoolInfo.name}. All rights reserved.</p>
        <p className="mt-2">For support, contact {schoolInfo.contact.email}</p>
      </footer>
    </div>
  );
}
