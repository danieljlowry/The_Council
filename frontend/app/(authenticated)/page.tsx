import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/Button";

export default function DashboardPage() {
  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-[#f5f5f5] lg:flex-row">
      <div className="relative m-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white p-8 shadow-sm">
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-bl-full bg-gradient-to-bl from-[#007749]/5 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-tr-full bg-gradient-to-tr from-[#002D72]/5 to-transparent" />

        <div className="z-10 flex w-full max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#002D72]/5 text-[#002D72]">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#002D72] text-xl font-bold text-white">
              C
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[#1e1e1e]">
            Welcome to The Council
          </h2>
          <p className="mb-8 text-[#757575]">
            Start a new session to submit a question and watch multiple AI
            models sequentially reason through it to find the best answer.
          </p>
          <Link href="/new">
            <Button size="lg" className="flex items-center gap-2 shadow-sm">
              <PlusCircle className="h-5 w-5" />
              Start New Conversation
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex h-[30%] w-full shrink-0 flex-col items-center justify-center border-t border-[#d9d9d9] bg-[#fcfcfc] p-6 lg:h-full lg:w-[320px] lg:border-t-0 lg:border-l">
        <div className="text-center text-[#b3b3b3]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#f0f0f0]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium">Council Log</p>
          <p className="mt-1 text-xs">
            The relay history will appear here once a session begins.
          </p>
        </div>
      </div>
    </div>
  );
}
