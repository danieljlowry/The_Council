"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../components/Button";
import { PlusCircle } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-full bg-[#f5f5f5] overflow-hidden">
      {/* Center workspace */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white m-4 rounded-2xl border border-[#d9d9d9] shadow-sm relative overflow-hidden">
        {/* Subtle background abstract */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#007749]/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#002D72]/5 to-transparent rounded-tr-full pointer-events-none" />

        <div className="max-w-md w-full text-center flex flex-col items-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#002D72]/5 text-[#002D72] flex items-center justify-center mb-6">
            <div className="w-8 h-8 rounded bg-[#002D72] text-white flex items-center justify-center font-bold text-xl">
              C
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#1e1e1e] mb-2">Welcome to The Council</h2>
          <p className="text-[#757575] mb-8">
            Start a new session to submit a question and watch multiple AI models sequentially reason
            through it to find the best answer.
          </p>
          <Link href="/new">
            <Button size="lg" className="flex items-center gap-2 shadow-sm">
              <PlusCircle className="w-5 h-5" />
              Start New Conversation
            </Button>
          </Link>
        </div>
      </div>

      {/* Right panel - empty state */}
      <div className="w-full lg:w-[320px] bg-[#fcfcfc] border-t lg:border-t-0 lg:border-l border-[#d9d9d9] flex flex-col items-center justify-center p-6 shrink-0 h-[30%] lg:h-full">
        <div className="text-center text-[#b3b3b3]">
          <div className="w-12 h-12 rounded-full bg-[#f0f0f0] border border-[#e5e5e5] mx-auto mb-4 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Council Log</p>
          <p className="text-xs mt-1">The relay history will appear here once a session begins.</p>
        </div>
      </div>
    </div>
  );
}
