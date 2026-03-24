"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconLoader, IconArrowRight } from "@/components/ui/custom-icons";
import { useRouter } from "next/navigation";

export default function CheckResultFormDemo() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const admissionNumber = formData.get("studentId") as string;
    const pin = formData.get("pin") as string;

    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionNumber, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid Student ID or PIN. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push(`/result?studentId=${encodeURIComponent(data.studentId)}&token=${encodeURIComponent(data.resultToken)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Check Result
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Enter your credentials below to access your academic report.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="studentId">Admission Number</Label>
          <Input id="studentId" name="studentId" placeholder="ADM/2023/001" type="text" required disabled={isLoading} />
        </LabelInputContainer>
        
        <LabelInputContainer className="mb-4">
          <Label htmlFor="pin">Access PIN</Label>
          <Input id="pin" name="pin" placeholder="••••" type="password" required disabled={isLoading} />
        </LabelInputContainer>

        {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
            </div>
        )}

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
               <span className="flex items-center justify-center gap-2">
                   <IconLoader className="h-4 w-4 animate-spin" /> Verifying...
               </span>
          ) : (
            <span className="flex items-center justify-center gap-2 group-hover/btn:gap-3 transition-all duration-200">
                View Result 
                <IconArrowRight className="h-4 w-4" />
                <BottomGradient />
            </span>
          )}
        </button>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
