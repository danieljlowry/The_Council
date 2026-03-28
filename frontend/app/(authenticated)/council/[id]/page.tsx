"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Crown, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import {
  completeCouncil,
  getCouncil,
  pollCouncilMessages,
  saveDebateMessage,
  startCouncilRound,
  triggerCouncilRun,
} from "@/lib/api";
import { AVAILABLE_MODELS } from "@/lib/models";
import type { AgentSlot, CouncilAgent } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOT_ORDER: AgentSlot[] = ["CROWN", "AGENT_B", "AGENT_C", "AGENT_D"];
const USE_MOCK_RELAY = process.env.NEXT_PUBLIC_USE_MOCK_RELAY !== "false";

const getFakeMessage = (modelId: string, cycle: number) => {
  if (cycle === 1) {
    if (modelId === "gpt-5") {
      return "Startups should prioritize speed initially to find product-market fit. Reliability can be built later once the core value is proven.";
    }

    if (modelId === "claude") {
      return "While speed is critical, total unreliability destroys trust. Startups must balance speed with a baseline of functional stability to avoid burning early adopters.";
    }

    if (modelId === "llama") {
      return "Let's reframe: 'Speed of learning' over 'Speed of shipping'. If an MVP is too unreliable, the data you gather is flawed. Build a 'reliable enough' prototype to test the core hypothesis fast.";
    }

    return "Synthesizing the above: Speed is the engine, but basic reliability is the steering wheel. Both are needed.";
  }

  if (modelId === "gpt-5") {
    return "Building on Llama's point, 'speed of learning' becomes our primary metric. We should define the minimum acceptable reliability threshold that allows accurate learning.";
  }

  if (modelId === "claude") {
    return "Agreed. The tradeoff is no longer speed vs. reliability, but finding the exact reliability floor that maximizes learning velocity without catastrophic failure.";
  }

  if (modelId === "llama") {
    return "Final synthesis: Early-stage startups shouldn't choose between speed and reliability. Instead, they should relentlessly pursue 'Speed of Learning', which requires a minimum viable reliability. Ship fast, but only when the core mechanism is stable enough to yield true user feedback.";
  }

  return "Final synthesis: Optimize for the velocity of validated learning.";
};

type CouncilRecord = Awaited<ReturnType<typeof getCouncil>>;

type OrderedModel = {
  id: string;
  modelId: string;
  name: string;
  role: string;
  img: string;
  modelKey: string | null;
  councilAgentId: string;
  slot: AgentSlot;
};

type LogEntry = {
  id: string;
  modelId: string;
  modelName: string;
  role: string;
  cycle: number;
  step: number;
  content: string;
  img: string;
  sequence: number;
  roundId: string;
  councilAgentId: string | null;
};

function waitForMockStep() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 900 + Math.floor(Math.random() * 600));
  });
}

function mapAgentToOrderedModel(agent: CouncilAgent): OrderedModel {
  const preset = AVAILABLE_MODELS.find(
    (model) =>
      model.modelKey === agent.modelKey ||
      model.name.toLowerCase() === agent.displayName.toLowerCase(),
  );

  return {
    id: preset?.id ?? agent.id,
    modelId: preset?.id ?? agent.displayName.toLowerCase().replace(/\s+/g, "-"),
    name: preset?.name ?? agent.displayName,
    role: preset?.role ?? agent.specialty,
    img: preset?.img ?? "/images/profile.png",
    modelKey: agent.modelKey,
    councilAgentId: agent.id,
    slot: agent.slot,
  };
}

function buildOrderedModels(agents: CouncilAgent[]) {
  return [...agents]
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))
    .map(mapAgentToOrderedModel);
}

function buildLogs(
  council: CouncilRecord,
  orderedModels: OrderedModel[],
): LogEntry[] {
  const agentById = new Map(orderedModels.map((model) => [model.councilAgentId, model]));

  return [...council.rounds]
    .sort((a, b) => a.number - b.number)
    .flatMap((round) =>
      [...(round.messages ?? [])]
        .sort((a, b) => a.sequence - b.sequence)
        .map((message, index) => {
          const model = message.councilAgentId
            ? agentById.get(message.councilAgentId)
            : undefined;

          return {
            id: message.id,
            modelId: model?.modelId ?? "unknown-model",
            modelName: model?.name ?? "Council Agent",
            role: model?.role ?? "Agent",
            cycle: round.number,
            step: index + 1,
            content: message.content,
            img: model?.img ?? "/images/profile.png",
            sequence: message.sequence,
            roundId: round.id,
            councilAgentId: message.councilAgentId,
          };
        }),
    );
}

function deriveProgressState(
  orderedModels: OrderedModel[],
  rounds: CouncilRecord["rounds"],
  logs: LogEntry[],
) {
  const totalStepsPerCycle = orderedModels.length;
  const totalCycles = rounds.length;
  const completedSteps = logs.length;

  if (totalStepsPerCycle === 0 || totalCycles === 0) {
    return {
      nextCycle: 1,
      nextStepIndex: 0,
      totalProcessSteps: 0,
      progressPercent: 0,
    };
  }

  const totalProcessSteps = totalStepsPerCycle * totalCycles;
  const nextCycle = Math.min(
    Math.floor(completedSteps / totalStepsPerCycle) + 1,
    totalCycles,
  );
  const nextStepIndex = completedSteps % totalStepsPerCycle;
  const progressPercent = Math.round((completedSteps / totalProcessSteps) * 100);

  return {
    nextCycle,
    nextStepIndex,
    totalProcessSteps,
    progressPercent,
  };
}

export default function CouncilRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [councilData, setCouncilData] = useState<CouncilRecord | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const relayStartedRef = useRef(false);

  const orderedModels = useMemo(
    () => (councilData ? buildOrderedModels(councilData.agents) : []),
    [councilData],
  );

  const { progressPercent } = useMemo(
    () => deriveProgressState(orderedModels, councilData?.rounds ?? [], logs),
    [councilData?.rounds, logs, orderedModels],
  );

  useEffect(() => {
    relayStartedRef.current = false;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCouncil() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await getCouncil(id);

        if (cancelled) {
          return;
        }

        const models = buildOrderedModels(data.agents);
        const existingLogs = buildLogs(data, models);
        const derived = deriveProgressState(models, data.rounds, existingLogs);
        const finished =
          data.status === "COMPLETED" ||
          (derived.totalProcessSteps > 0 &&
            existingLogs.length >= derived.totalProcessSteps);

        setCouncilData(data);
        setLogs(existingLogs);
        setCurrentCycle(derived.nextCycle);
        setCurrentStepIndex(derived.nextStepIndex);
        setIsFinished(finished);
        setShowModal(finished && existingLogs.length > 0);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load council.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCouncil();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!councilData || orderedModels.length === 0 || isFinished || relayStartedRef.current) {
      return;
    }

    relayStartedRef.current = true;
    let cancelled = false;

    if (USE_MOCK_RELAY) {
      const runMockRelay = async () => {
        const existingLogCount = logs.length;
        const startCycle = Math.floor(existingLogCount / orderedModels.length) + 1;
        const startStepIndex = existingLogCount % orderedModels.length;
        let nextSequence = logs[logs.length - 1]?.sequence ?? 0;
        let finalSummary = councilData.finalSummary ?? logs[logs.length - 1]?.content ?? "";

        for (let cycleNumber = startCycle; cycleNumber <= councilData.rounds.length; cycleNumber += 1) {
          if (cancelled) {
            return;
          }

          const round = councilData.rounds.find((entry) => entry.number === cycleNumber);

          if (!round) {
            continue;
          }

          if (!logs.some((entry) => entry.cycle === cycleNumber)) {
            try {
              await startCouncilRound(id, cycleNumber);
            } catch (error) {
              console.error("Failed to start council round", error);
            }
          }

          const firstStepIndex = cycleNumber === startCycle ? startStepIndex : 0;

          for (let stepIndex = firstStepIndex; stepIndex < orderedModels.length; stepIndex += 1) {
            if (cancelled) {
              return;
            }

            const activeModel = orderedModels[stepIndex];
            setCurrentCycle(cycleNumber);
            setCurrentStepIndex(stepIndex);
            setIsProcessing(true);

            await waitForMockStep();

            if (cancelled) {
              return;
            }

            nextSequence += 1;
            finalSummary = getFakeMessage(activeModel.modelId, cycleNumber);

            const newLog: LogEntry = {
              id: `mock-${cycleNumber}-${stepIndex}-${nextSequence}`,
              modelId: activeModel.modelId,
              modelName: activeModel.name,
              role: activeModel.role,
              cycle: cycleNumber,
              step: stepIndex + 1,
              content: finalSummary,
              img: activeModel.img,
              sequence: nextSequence,
              roundId: round.id,
              councilAgentId: activeModel.councilAgentId,
            };

            setLogs((prev) => [...prev, newLog]);

            try {
              await saveDebateMessage({
                councilId: id,
                roundId: round.id,
                councilAgentId: activeModel.councilAgentId,
                author: "AGENT",
                sequence: nextSequence,
                content: finalSummary,
              });
            } catch (error) {
              console.error("Failed to persist mock debate message", error);
            }
          }
        }

        if (cancelled) {
          return;
        }

        setIsProcessing(false);
        setIsFinished(true);
        setShowModal(true);
        setCouncilData((prev) =>
          prev
            ? {
                ...prev,
                status: "COMPLETED",
                finalSummary,
              }
            : prev,
        );

        try {
          await completeCouncil(id, finalSummary);
        } catch (error) {
          console.error("Failed to complete council", error);
        }
      };

      void runMockRelay();

      return () => {
        cancelled = true;
        setIsProcessing(false);
      };
    }

    const runRealRelay = async () => {
      try {
        setIsProcessing(true);
        await triggerCouncilRun(id);
      } catch (error) {
        console.error("Failed to trigger council relay", error);
        setLoadError("Failed to trigger the council relay.");
        setIsProcessing(false);
        return;
      }

      let lastSequence = logs[logs.length - 1]?.sequence ?? 0;

      while (!cancelled) {
        try {
          const newMessages = await pollCouncilMessages(id, lastSequence);

          if (newMessages.length > 0) {
            lastSequence = newMessages[newMessages.length - 1].sequence;
          }

          const freshCouncil = await getCouncil(id);

          if (cancelled) {
            return;
          }

          const models = buildOrderedModels(freshCouncil.agents);
          const mappedLogs = buildLogs(freshCouncil, models);
          const derived = deriveProgressState(models, freshCouncil.rounds, mappedLogs);
          const finished =
            freshCouncil.status === "COMPLETED" ||
            (derived.totalProcessSteps > 0 &&
              mappedLogs.length >= derived.totalProcessSteps);

          setCouncilData(freshCouncil);
          setLogs(mappedLogs);
          setCurrentCycle(derived.nextCycle);
          setCurrentStepIndex(derived.nextStepIndex);

          if (finished) {
            setIsFinished(true);
            setShowModal(mappedLogs.length > 0);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error("Failed to poll council messages", error);
          setLoadError("Failed to poll council messages.");
          setIsProcessing(false);
          return;
        }

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 3000);
        });
      }
    };

    void runRealRelay();

    return () => {
      cancelled = true;
      setIsProcessing(false);
    };
  }, [councilData, id, isFinished, logs, orderedModels]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background transition-colors">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors">
          <Loader2 className="h-5 w-5 animate-spin text-[#002D72]" />
          <span className="text-sm font-medium text-foreground">
            Loading council...
          </span>
        </div>
      </div>
    );
  }

  if (!councilData || orderedModels.length === 0 || councilData.rounds.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-6 transition-colors">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-colors">
          <h2 className="text-xl font-bold text-foreground">
            Council unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {loadError ?? "This council could not be loaded or is missing its setup data."}
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const question = councilData.primaryPrompt;
  const totalCycles = councilData.rounds.length;
  const finalSummary = councilData.finalSummary ?? logs[logs.length - 1]?.content ?? "";
  const currentCycleLogs = logs.filter((log) => log.cycle === currentCycle);
  const completedIndex = isFinished ? orderedModels.length - 1 : currentCycleLogs.length - 1;
  const visibleCycleCount = isFinished ? totalCycles : Math.max(currentCycle, 1);
  const logsByCycle = Array.from({ length: visibleCycleCount }, (_, index) => {
    const cycleNumber = index + 1;

    return {
      cycleNum: cycleNumber,
      entries: logs.filter((entry) => entry.cycle === cycleNumber),
    };
  });

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background transition-colors lg:flex-row">
      <div className="flex h-full flex-1 flex-col items-center overflow-hidden px-4 py-4 lg:px-6 lg:py-8">
        <div className="z-10 mb-8 flex w-full max-w-4xl items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isFinished ? "Council Output Complete" : "Council in Progress"}
            </h2>
            <p
              className="mt-1 line-clamp-1 text-sm text-muted-foreground"
              title={question}
            >
              <span className="font-semibold text-foreground">Topic:</span>{" "}
              {question}
            </p>
          </div>

          <div className="flex min-w-[200px] flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {isFinished ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1 text-[#007749] hover:underline focus:outline-none"
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Final Answer Ready
                </button>
              ) : (
                <span className="text-[#002D72]">
                  Cycle {currentCycle} of {totalCycles} • Step{" "}
                  {Math.min(currentStepIndex + 1, orderedModels.length)} of{" "}
                  {orderedModels.length}
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent transition-colors">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  isFinished ? "bg-[#007749]" : "bg-[#002D72]",
                )}
                style={{ width: `${isFinished ? 100 : progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {loadError && councilData && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#B45309]">
            {loadError}
          </div>
        )}

        {isFinished && (
          <div className="mb-8 flex w-full max-w-4xl justify-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <Button
              size="lg"
              variant="danger"
              className="px-8 shadow-md"
              onClick={() => setShowModal(true)}
            >
              View Final Council Response
            </Button>
          </div>
        )}

        <div className="relative flex min-h-[240px] w-full max-w-5xl flex-1 items-center justify-center overflow-hidden rounded-3xl border-4 border-border bg-gradient-to-b from-[#007749] to-[#002D72] p-4 shadow-xl transition-colors dark:from-[#1d6f63] dark:via-[#355974] dark:to-[#43526b] lg:p-8">
          <div className="absolute inset-0 bg-black/10" />

          <div className="z-10 flex w-full items-center justify-center gap-6">
            {orderedModels.map((model, index) => {
              const isActive = !isFinished && isProcessing && currentStepIndex === index;
              const isDone = isFinished || index <= completedIndex;
              const isCrowned = model.slot === "CROWN";

              return (
                <div key={model.councilAgentId} className="flex items-center gap-6">
                  <div className="group relative flex flex-col items-center">
                    <div
                      className={cn(
                        "relative flex h-24 w-24 items-center justify-center rounded-full bg-card shadow-xl transition-all duration-500",
                        isActive
                          ? "scale-110 ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                          : isDone
                            ? "scale-100 opacity-100"
                            : "scale-95 opacity-80",
                      )}
                    >
                      {isCrowned && (
                        <div className="absolute -top-4 -right-1 z-20 rounded-full bg-[#F59E0B] p-1.5 text-white shadow-lg">
                          <Crown className="h-5 w-5" />
                        </div>
                      )}
                      <Image
                        src={model.img}
                        alt={model.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full object-cover"
                      />

                      {isActive && (
                        <div className="absolute -bottom-3 flex items-center gap-1 rounded-full bg-card px-2 py-1 text-[10px] font-bold text-[#002D72] shadow-md transition-colors">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking
                        </div>
                      )}
                    </div>

                    <div className="mt-6 text-center">
                      <div className="text-lg font-bold text-white drop-shadow-md">
                        {model.name}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wider text-white/80">
                        {model.role}
                      </div>
                    </div>
                  </div>

                  {index < orderedModels.length - 1 && (
                    <div className="flex w-16 flex-col items-center justify-center">
                      <div className="relative h-0.5 w-full overflow-hidden bg-white/30">
                        <div
                          className={cn(
                            "absolute top-0 left-0 h-full bg-white transition-all duration-700",
                            isDone
                              ? "w-full"
                              : isActive
                                ? "w-1/2 animate-pulse"
                                : "w-0",
                          )}
                        />
                      </div>
                      <ChevronRight
                        className={cn(
                          "mt-1 h-6 w-6 transition-colors",
                          isDone
                            ? "text-white"
                            : isActive
                              ? "text-white/70"
                              : "text-white/30",
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isFinished && currentCycle > 1 && (
            <div className="absolute top-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm font-medium text-white/50 backdrop-blur-md">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Cycle {currentCycle} passing back to {orderedModels[0]?.name}
            </div>
          )}
        </div>
      </div>

      <div className="z-10 flex h-[40%] w-full shrink-0 flex-col border-t border-border bg-card shadow-[-4px_0_15px_rgba(0,0,0,0.02)] transition-colors lg:h-full lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="sticky top-0 z-10 border-b border-border bg-card p-4 transition-colors">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            Council Log
            {isFinished && (
              <span className="rounded-full bg-[#007749]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#007749]">
                Resolved
              </span>
            )}
          </h3>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {logsByCycle.map((cycleGroup) => (
            <div
              key={`cycle-${cycleGroup.cycleNum}`}
              className="relative flex flex-col gap-4"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 bg-card/90 py-1 backdrop-blur-sm">
                <div className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors">
                  Cycle {cycleGroup.cycleNum}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {cycleGroup.entries.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
                >
                  <div className="flex shrink-0 flex-col items-center">
                    <Image
                      src={log.img}
                      alt={log.modelName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-border bg-card object-cover transition-colors"
                    />
                    {log.cycle === currentCycle && log.step < orderedModels.length && (
                      <div className="mt-2 mb-[-16px] h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {log.modelName}
                      </span>
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-nowrap text-muted-foreground transition-colors">
                        {log.role}
                      </span>
                    </div>
                    <div className="relative rounded-lg rounded-tl-none border border-border bg-card p-3 text-sm leading-relaxed text-foreground shadow-sm transition-colors">
                      <div className="absolute top-0 -left-1.5 h-3 w-3 rotate-[-45deg] rounded-tl-sm border-t border-l border-border bg-card transition-colors" />
                      <span className="relative z-10">{log.content}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {!isFinished && isProcessing && orderedModels[currentStepIndex] && (
            <div className="flex gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
              <div className="flex shrink-0 flex-col items-center">
                <Image
                  src={orderedModels[currentStepIndex].img}
                  alt={orderedModels[currentStepIndex].name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border border-[#002D72] object-cover shadow-[0_0_0_2px_rgba(0,45,114,0.1)]"
                />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {orderedModels[currentStepIndex].name}
                  </span>
                  <Loader2 className="h-3 w-3 animate-spin text-[#002D72]" />
                </div>
                <div className="flex h-10 w-16 items-center justify-center gap-1 rounded-lg rounded-tl-none border border-border bg-card p-3 text-sm transition-colors">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          <div ref={logEndRef} className="h-4" />
        </div>
      </div>

      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
          <div className="flex w-full max-w-2xl scale-95 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-colors animate-[popIn_0.3s_ease-out_forwards]">
            <div className="flex items-start justify-between border-b border-border bg-gradient-to-r from-card to-accent p-6 transition-colors">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Final Council Response
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#007749]/10 px-2 py-1 text-xs font-medium text-[#007749]">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed after {totalCycles} cycles
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                type="button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 pb-10">
              <div className="text-lg leading-relaxed font-medium text-foreground">
                {finalSummary}
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Council Metadata
                </p>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Started by:</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Crown className="h-3 w-3 text-[#F59E0B]" />{" "}
                      {orderedModels[0]?.name} ({orderedModels[0]?.role})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Total Models:</span>
                    <span className="font-medium text-foreground">
                      {orderedModels.length} participants
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Sequence:</span>
                    <span className="font-medium text-foreground">
                      {orderedModels.map((model) => model.name).join(" → ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Process Info:</span>
                    <span className="font-medium text-foreground">
                      Generated after sequential review by {orderedModels.length}{" "}
                      models across {totalCycles} cycles.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border bg-card p-4 transition-colors">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                View Saved Run
              </Button>
              <Button onClick={() => router.push("/new")}>Start New Council</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
