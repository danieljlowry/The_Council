"use client";

import { useState } from "react";
import { AlertTriangle, ChevronRight, Crown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { createCouncil } from "@/lib/api";
import { AVAILABLE_MODELS } from "@/lib/models";
import type { AgentSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

const NON_CROWN_SLOTS: AgentSlot[] = ["AGENT_B", "AGENT_C", "AGENT_D"];

export default function SetupPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [cycles, setCycles] = useState(2);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [crownedModel, setCrownedModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isInvalid = question.trim().length > 5 && !question.includes("?");
  const isValid = question.trim().length > 5 && !isInvalid && selectedModels.length >= 3;

  const toggleModel = (id: string) => {
    if (selectedModels.includes(id)) {
      const nextModels = selectedModels.filter((modelId) => modelId !== id);
      setSelectedModels(nextModels);

      if (crownedModel === id) {
        setCrownedModel(nextModels[0] ?? "");
      }

      return;
    }

    setSelectedModels((prev) => [...prev, id]);

    if (!crownedModel) {
      setCrownedModel(id);
    }
  };

  const handleStart = async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    const resolvedCrown = crownedModel || selectedModels[0];
    let slotIndex = 0;

    const agents = selectedModels.map((modelId) => {
      const model = AVAILABLE_MODELS.find((entry) => entry.id === modelId);

      if (!model) {
        throw new Error(`Unknown model selected: ${modelId}`);
      }

      const slot =
        modelId === resolvedCrown ? "CROWN" : NON_CROWN_SLOTS[slotIndex++];

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
      setSubmitError(
        error instanceof Error ? error.message : "Failed to create council.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderedModels = selectedModels
    .map((id) => AVAILABLE_MODELS.find((model) => model.id === id))
    .filter((model): model is (typeof AVAILABLE_MODELS)[number] => Boolean(model));

  return (
    <div className="flex h-full w-full flex-1 flex-col overflow-hidden bg-[#f5f5f5] lg:flex-row">
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex w-full max-w-3xl flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1e1e1e]">
              Configure Council
            </h1>
            <p className="mt-2 text-[#757575]">
              Select the models, set the order, and define the topic for
              discussion.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-[#d9d9d9] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1e1e1e]">
                Council Sequence
              </h2>
              <div className="rounded bg-[#f5f5f5] px-2 py-1 text-xs font-medium uppercase tracking-wider text-[#757575]">
                Relay Order
              </div>
            </div>

            {orderedModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] px-4 py-12">
                <p className="text-sm font-medium text-[#757575]">
                  Select at least 3 LLMs to build your council sequence.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center gap-4 overflow-x-auto pt-6 pr-2 pb-4 pl-5">
                {orderedModels.map((model, index) => {
                  const isCrowned = model.id === crownedModel;
                  const orderNumber = index + 1;

                  return (
                    <div key={model.id} className="flex items-center gap-4">
                      <div
                        className={cn(
                          "group relative flex w-36 flex-col items-center rounded-xl border-2 p-4 transition-all",
                          isCrowned
                            ? "border-[#002D72] bg-[#002D72]/5 shadow-sm"
                            : "border-[#d9d9d9] bg-white hover:border-[#b3b3b3]",
                        )}
                      >
                        <div className="absolute -top-3 -left-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1e1e1e] text-xs font-bold text-white shadow-sm">
                          {orderNumber}
                        </div>
                        {isCrowned && (
                          <div className="absolute -top-3 z-10 rounded-full bg-[#002D72] p-1 text-white shadow-md">
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
                        <div className="w-full truncate text-center text-sm font-bold text-[#1e1e1e]">
                          {model.name}
                        </div>
                        <div className="mt-1 w-full truncate px-1 text-center text-[11px] text-[#757575]">
                          {model.role}
                        </div>

                        {!isCrowned && (
                          <button
                            onClick={() => setCrownedModel(model.id)}
                            className="mt-3 rounded-md px-2 py-1 text-[10px] font-medium text-[#002D72] opacity-0 transition-opacity group-hover:bg-[#002D72]/10 group-hover:opacity-100"
                            type="button"
                          >
                            Make Crowned
                          </button>
                        )}
                      </div>

                      {index < orderedModels.length - 1 && (
                        <div className="flex shrink-0 flex-col items-center text-[#b3b3b3]">
                          <ChevronRight className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedModels.length > 0 && selectedModels.length < 3 && (
              <div className="flex items-center gap-2 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-3 text-sm text-[#B45309]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>Choose at least 3 LLMs to create a council.</p>
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-[#f0f0f0] pt-4">
              <span className="text-xs font-medium text-[#757575]">
                Available Models:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {AVAILABLE_MODELS.map((model) => {
                  const selectedIndex = selectedModels.indexOf(model.id);
                  const isSelected = selectedIndex !== -1;
                  const orderNumber = selectedIndex + 1;

                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-[#002D72] bg-[#002D72] pl-2 text-white"
                          : "border-[#d9d9d9] bg-white text-[#757575] hover:bg-[#f5f5f5]",
                      )}
                      type="button"
                    >
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#002D72]">
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

          <div className="flex flex-col gap-6 rounded-2xl border border-[#d9d9d9] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1e1e1e]">
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
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-3 text-[#B45309]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      The Council only starts when you ask a question.
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
                  className="text-xs text-[#002D72] hover:underline"
                  type="button"
                >
                  Use valid example
                </button>
                <span className="text-[#d9d9d9]">|</span>
                <button
                  onClick={() => setQuestion("Build me a productivity app")}
                  className="text-xs text-[#002D72] hover:underline"
                  type="button"
                >
                  Use invalid example
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-sm font-semibold text-[#1e1e1e]">
                <span>Number of Cycles</span>
                <span className="text-xs font-normal text-[#757575]">
                  One cycle = {orderedModels.length} model responses
                </span>
              </label>
              <div className="flex gap-3">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCycles(num)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors",
                      cycles === num
                        ? "border-[#002D72] bg-[#002D72]/5 text-[#002D72]"
                        : "border-[#d9d9d9] bg-white text-[#1e1e1e] hover:bg-[#f5f5f5]",
                    )}
                    type="button"
                  >
                    {num} {num === 1 ? "Cycle" : "Cycles"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex justify-end border-t border-[#f0f0f0] pt-4">
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

      <div className="flex w-full shrink-0 flex-col gap-6 border-t border-[#d9d9d9] bg-[#fcfcfc] p-6 lg:w-[320px] lg:border-t-0 lg:border-l">
        <h3 className="font-semibold text-[#1e1e1e]">How it works</h3>

        <div className="flex flex-col gap-4 text-sm text-[#757575]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002D72]/10 text-xs font-bold text-[#002D72]">
              1
            </div>
            <p>
              The <strong className="text-[#1e1e1e]">Crowned model</strong>{" "}
              always starts.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002D72]/10 text-xs font-bold text-[#002D72]">
              2
            </div>
            <p>
              Each model receives the previous model&apos;s output and refines
              it from its own role perspective.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002D72]/10 text-xs font-bold text-[#002D72]">
              3
            </div>
            <p>
              One cycle means the response passes through every selected model
              once.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002D72]/10 text-xs font-bold text-[#002D72]">
              4
            </div>
            <p>
              After the final model completes the last cycle, the council
              returns one <strong className="text-[#1e1e1e]">final answer</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
