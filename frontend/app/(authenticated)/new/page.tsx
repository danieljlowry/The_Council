"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, Crown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { createCouncil, formatSupabaseError } from "@/lib/api";
import { AVAILABLE_MODELS } from "@/lib/models";
import type { AgentSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Relay order: index 0 = Model A (Crown) … index 3 = Model D (evaluator). */
const RELAY_ORDER_SLOTS: AgentSlot[] = [
  "CROWN",
  "AGENT_B",
  "AGENT_C",
  "AGENT_D",
];
const MAX_MODELS = RELAY_ORDER_SLOTS.length;

export default function SetupPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [cycles, setCycles] = useState(2);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isInvalid = question.trim().length > 5 && !question.includes("?");
  const isValid =
    question.trim().length > 5 &&
    !isInvalid &&
    selectedModels.length >= 3 &&
    selectedModels.length <= MAX_MODELS;

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(id)) {
        return prev.filter((modelId) => modelId !== id);
      }

      if (prev.length >= MAX_MODELS) {
        return prev;
      }

      return [...prev, id];
    });
  };

  const handleStart = async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    const agents = selectedModels.map((modelId, index) => {
      const model = AVAILABLE_MODELS.find((entry) => entry.id === modelId);

      if (!model) {
        throw new Error(`Unknown model selected: ${modelId}`);
      }

      const slot = RELAY_ORDER_SLOTS[index];

      return {
        slot,
        displayName: model.name,
        specialty: model.role,
        modelKey: model.modelKey,
      };
    });

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await createCouncil({
        title: question.slice(0, 80),
        primaryPrompt: question,
        agents,
        cycleCount: cycles,
      });

      router.push(`/council/${result.id}`);
    } catch (error) {
      console.error("Launch council failed:", error);
      setSubmitError(
        error instanceof Error ? error.message : formatSupabaseError(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderedModels = selectedModels
    .map((id) => AVAILABLE_MODELS.find((model) => model.id === id))
    .filter((model): model is (typeof AVAILABLE_MODELS)[number] => Boolean(model));

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-background transition-colors lg:flex-row">
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex w-full max-w-3xl flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Configure your council
            </h1>
            <p className="mt-2 text-muted-foreground">
              Select the models, set the order, and define the topic for
              discussion.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Council Sequence
              </h2>
              <div className="rounded bg-accent px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors">
                Relay Order
              </div>
            </div>

            {orderedModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-12 transition-colors">
                <p className="text-sm font-medium text-muted-foreground">
                  Select 3 or 4 LLMs to build your council sequence.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center gap-4 overflow-x-auto pt-6 pr-2 pb-4 pl-5">
                {orderedModels.map((model, index) => {
                  const isCrowned = index === 0;
                  const orderNumber = index + 1;

                  return (
                    <div key={model.id} className="flex items-center gap-4">
                      <div
                        className={cn(
                          "group relative flex w-36 flex-col items-center rounded-xl border-2 p-4 transition-all",
                          isCrowned
                            ? "border-[#C2410C] bg-[#C2410C]/5 shadow-sm"
                            : "border-border bg-card hover:border-muted-foreground/40",
                        )}
                      >
                        <div className="absolute -top-3 -left-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shadow-sm transition-colors">
                          {orderNumber}
                        </div>
                        {isCrowned && (
                          <div className="absolute -top-3 z-10 rounded-full bg-[#C2410C] p-1 text-white shadow-md">
                            <Crown className="h-4 w-4" />
                          </div>
                        )}
                        <Image
                          src={model.img}
                          alt={model.name}
                          width={48}
                          height={48}
                          className="mb-3 h-12 w-12 rounded-full border border-black/5 shadow-sm"
                        />
                        <div className="w-full truncate text-center text-sm font-bold text-foreground">
                          {model.name}
                        </div>
                        <div className="mt-1 w-full truncate px-1 text-center text-[11px] text-muted-foreground">
                          {model.role}
                        </div>
                      </div>

                      {index < orderedModels.length - 1 && (
                        <div className="flex shrink-0 flex-col items-center text-muted-foreground">
                          <ChevronRight className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedModels.length > 0 && selectedModels.length < 3 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>Choose at least 3 LLMs to create a council.</p>
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-border pt-4">
              <span className="text-xs font-medium text-muted-foreground">
                Available Models:
              </span>
              <span className="text-xs text-muted-foreground/80">
                Choose up to {MAX_MODELS}.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {AVAILABLE_MODELS.map((model) => {
                  const selectedIndex = selectedModels.indexOf(model.id);
                  const isSelected = selectedIndex !== -1;
                  const isDisabled =
                    !isSelected && selectedModels.length >= MAX_MODELS;
                  const orderNumber = selectedIndex + 1;

                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      disabled={isDisabled}
                      className={cn(
                        "relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-[#C2410C] bg-[#C2410C] pl-2 text-white"
                          : "border-border bg-card text-muted-foreground hover:bg-accent",
                        isDisabled &&
                          "cursor-not-allowed opacity-50 hover:bg-card",
                      )}
                      type="button"
                    >
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#C2410C]">
                          {orderNumber}
                        </span>
                      )}
                      {model.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                Debate Question
              </label>
              <Textarea
                placeholder="e.g., Should early-stage startups prioritize speed or reliability when building their MVP?"
                className={cn(
                  "py-3 text-base",
                  isInvalid && "border-[#F59E0B] focus-visible:ring-[#F59E0B]",
                )}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />

              {isInvalid && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-amber-950 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      Your council only starts when you ask a question.
                    </p>
                    <p className="mt-0.5 text-xs">
                      Please rewrite your prompt as a question ending with
                      &quot;?&quot;.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Unable to launch council</p>
                    <p className="mt-0.5 text-xs">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() =>
                    setQuestion(
                      "Should early-stage startups prioritize speed or reliability when building their MVP?",
                    )
                  }
                  className="text-xs text-[#C2410C] hover:underline dark:text-muted-foreground"
                  type="button"
                >
                  Use valid example
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={() => setQuestion("Build me a productivity app")}
                  className="text-xs text-[#C2410C] hover:underline dark:text-muted-foreground"
                  type="button"
                >
                  Use invalid example
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>Number of Cycles</span>
                <span className="text-xs font-normal text-muted-foreground">
                  One cycle = {orderedModels.length} model responses
                </span>
              </label>
              <div className="flex gap-3">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCycles(num)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors",
                      cycles === num
                        ? "border-[#C2410C] bg-[#C2410C]/5 text-[#C2410C] dark:border-muted-foreground/45 dark:text-muted-foreground"
                        : "border-border bg-card text-foreground hover:bg-accent",
                    )}
                    type="button"
                  >
                    {num} {num === 1 ? "Cycle" : "Cycles"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex justify-end border-t border-border pt-4">
              <Button
                size="lg"
                className="min-w-[200px]"
                disabled={!isValid || isSubmitting}
                onClick={handleStart}
              >
                {isSubmitting ? "Launching..." : "Launch Council"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-6 border-t border-border bg-card p-6 transition-colors lg:w-[320px] lg:border-t-0 lg:border-l">
        <h3 className="font-semibold text-foreground">How it works</h3>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-xs font-bold text-[#C2410C]">
              1
            </div>
            <p>
              The <strong className="text-foreground">Crowned model</strong>{" "}
              always starts.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-xs font-bold text-[#C2410C]">
              2
            </div>
            <p>
              Each model receives the previous model&apos;s output and refines
              it from its own role perspective.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-xs font-bold text-[#C2410C]">
              3
            </div>
            <p>
              One cycle means the response passes through every selected model
              once.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C2410C]/10 text-xs font-bold text-[#C2410C]">
              4
            </div>
            <p>
              After the final model completes the last cycle, the council
              returns one <strong className="text-foreground">final answer</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
