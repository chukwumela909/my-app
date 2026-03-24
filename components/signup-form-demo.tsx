"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { IconLoader, IconArrowRight } from "@/components/ui/custom-icons";

export function SignupFormDemo() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const studentId = formData.get("studentId") as string;
    const pin = formData.get("pin") as string;

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation
    if (studentId === "ADM/2023/001" && pin === "1234") {
      router.push("/result");
    } else {
      setError("Invalid Student ID or PIN. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Check Your Result
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Enter your admission number and PIN to view your academic report.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="studentId">Admission Number</Label>
          <Input 
            id="studentId" 
            name="studentId"
            placeholder="e.g., ADM/2023/001" 
            type="text" 
            disabled={isLoading}
            required
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="pin">Access PIN</Label>
          <Input 
            id="pin" 
            name="pin"
            placeholder="••••" 
            type="password" 
            disabled={isLoading}
            required
          />
        </LabelInputContainer>

        {error && (
            <div className="text-red-500 text-sm mb-4">
                {error}
            </div>
        )}

        <button
          className="bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden flex items-center justify-center transition-all duration-200"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
             <div className="flex items-center justify-center gap-2">
                <IconLoader className="animate-spin h-4 w-4" />
                <span>Checking...</span>
             </div>
          ) : (
             <span className="flex items-center justify-center gap-2 group-hover/btn:gap-3 transition-all duration-200">
               Check Result 
               <IconArrowRight className="h-4 w-4" />
               <BottomGradient />
             </span>
          )}
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
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
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
