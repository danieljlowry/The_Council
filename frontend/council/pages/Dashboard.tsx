"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../components/Button";
import { PlusCircle } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-full bg-background overflow-hidden transition-colors">
      {/* Center workspace */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card m-4 rounded-2xl border border-border shadow-sm relative overflow-hidden transition-colors">
        {/* Subtle background abstract */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#007749]/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#002D72]/5 to-transparent rounded-tr-full pointer-events-none" />

        <div className="max-w-md w-full text-center flex flex-col items-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#002D72]/5 text-[#002D72] flex items-center justify-center mb-6">
            <div className="w-8 h-8 rounded bg-[#002D72] text-white flex items-center justify-center font-bold text-xl">
              C
            </div>
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Welcome to The Council</h2>
          <p className="text-muted-foreground mb-8">
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
      <div className="w-full lg:w-[320px] bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col items-center justify-center p-6 shrink-0 h-[30%] lg:h-full transition-colors">
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-accent/70 border border-border mx-auto mb-4 flex items-center justify-center">
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
