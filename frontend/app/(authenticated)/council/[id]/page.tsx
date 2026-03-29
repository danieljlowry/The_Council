"use client";

import type { CSSProperties } from "react";
import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Crown,
  GripVertical,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import {
  completeCouncil,
  deleteCouncil,
  formatSupabaseError,
  getCouncil,
  pollCouncilMessages,
  saveDebateMessage,
  startCouncilRound,
  triggerCouncilRun,
} from "@/lib/api";
import { AVAILABLE_MODELS } from "@/lib/models";
import { CouncilLogMessageBody } from "@/lib/councilLogMessage";
import { downloadCouncilFinalResponse } from "@/lib/downloadCouncilFinal";
import type { AgentSlot, CouncilAgent } from "@/lib/types";
import { cn } from "@/lib/utils";

const SLOT_ORDER: AgentSlot[] = ["CROWN", "AGENT_B", "AGENT_C", "AGENT_D"];
const USE_MOCK_RELAY = process.env.NEXT_PUBLIC_USE_MOCK_RELAY !== "false";
const MIN_LOG_PANEL_PX = 380;

/** Crown at top (−90°); others clockwise. `left`/`top` are % of the round container. */
function circlePlacement(
  index: number,
  count: number,
  radiusPercent: number,
): CSSProperties {
  const angleDeg = -90 + (index * 360) / count;
  const rad = (angleDeg * Math.PI) / 180;
  const x = 50 + radiusPercent * Math.cos(rad);
  const y = 50 + radiusPercent * Math.sin(rad);
  return { left: `${x}%`, top: `${y}%` };
}

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

    if (modelId === "qwen") {
      return "The key variable is downside risk. Move fast where mistakes are cheap and reversible, but engineer reliability early anywhere failures damage trust, data integrity, or retention.";
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

  if (modelId === "qwen") {
    return "A useful operating rule is this: optimize aggressively for reversible experiments, and harden the irreversible paths. That gives the startup learning speed without gambling away user trust.";
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
  slot: AgentSlot | undefined;
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
            slot: model?.slot,
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
    };
  }

  const totalProcessSteps = totalStepsPerCycle * totalCycles;
  const nextCycle = Math.min(
    Math.floor(completedSteps / totalStepsPerCycle) + 1,
    totalCycles,
  );
  const nextStepIndex = completedSteps % totalStepsPerCycle;

  return {
    nextCycle,
    nextStepIndex,
    totalProcessSteps,
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
  const [, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [logPanelWidth, setLogPanelWidth] = useState(MIN_LOG_PANEL_PX);
  const [isLgLayout, setIsLgLayout] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [deleteBusy, setDeleteBusy] = useState(false);
  /** Scroll only the log list — NOT window scroll. */
  const logScrollContainerRef = useRef<HTMLDivElement>(null);
  const finalLogRowRef = useRef<HTMLDivElement | null>(null);
  const relayStartedRef = useRef(false);

  const orderedModels = useMemo(
    () => (councilData ? buildOrderedModels(councilData.agents) : []),
    [councilData],
  );

  const lastLogId = useMemo(() => {
    if (!isFinished || logs.length === 0) {
      return null;
    }
    return logs[logs.length - 1]?.id ?? null;
  }, [isFinished, logs]);

  useEffect(() => {
    relayStartedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!isProcessing || isFinished || orderedModels.length === 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setPulseIndex((i) => (i + 1) % orderedModels.length);
    }, 500);
    return () => window.clearInterval(timer);
  }, [isProcessing, isFinished, orderedModels.length]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      setIsLgLayout(mq.matches);
      setLogPanelWidth((w) => {
        const maxW = window.innerWidth * 0.5;
        return Math.min(Math.max(w, MIN_LOG_PANEL_PX), maxW);
      });
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  const onLogPanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = logPanelWidth;
    const onMove = (ev: MouseEvent) => {
      const maxW = window.innerWidth * 0.5;
      const next = Math.min(
        Math.max(startWidth + startX - ev.clientX, MIN_LOG_PANEL_PX),
        maxW,
      );
      setLogPanelWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleDeleteCouncil = async () => {
    if (
      !window.confirm(
        "Delete this council and its full transcript? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteCouncil(id);
      router.push("/");
      router.refresh();
    } catch (e) {
      setLoadError(formatSupabaseError(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleCancelSession = () => {
    if (
      !window.confirm(
        "Stop this session and return home? The relay stops; messages already saved stay in this council.",
      )
    ) {
      return;
    }
    router.push("/");
    router.refresh();
  };

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
        setShowModal(false);
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
    const container = logScrollContainerRef.current;
    if (!container) {
      return;
    }
    const alignFinalStart = () => {
      const row = finalLogRowRef.current;
      if (!isFinished || !lastLogId || !row) {
        return false;
      }
      const rowRect = row.getBoundingClientRect();
      const boxRect = container.getBoundingClientRect();
      const nextTop =
        container.scrollTop + (rowRect.top - boxRect.top);
      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior: "smooth",
      });
      return true;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!alignFinalStart()) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    });
  }, [logs, isFinished, lastLogId]);

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
            if (cancelled) {
              return;
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
              slot: activeModel.slot,
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
            if (cancelled) {
              return;
            }
          }
        }

        if (cancelled) {
          return;
        }

        setIsProcessing(false);
        setIsFinished(true);
        setShowModal(false);
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
        router.refresh();
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
        if (cancelled) {
          return;
        }
      } catch (error) {
        console.error("Failed to trigger council relay", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : formatSupabaseError(error),
        );
        setIsProcessing(false);
        return;
      }

      let lastSequence = logs[logs.length - 1]?.sequence ?? 0;

      while (!cancelled) {
        try {
          const newMessages = await pollCouncilMessages(id, lastSequence);
          if (cancelled) {
            return;
          }

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
            setShowModal(false);
            setIsProcessing(false);
            router.refresh();
            return;
          }
        } catch (error) {
          console.error("Failed to poll council messages", error);
          setLoadError(
            error instanceof Error
              ? error.message
              : formatSupabaseError(error),
          );
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
  }, [councilData, id, isFinished, logs, orderedModels, router]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background transition-colors">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors">
          <Loader2 className="h-5 w-5 animate-spin text-[#C2410C]" />
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

  const showSessionStageBanner = isProcessing && !isFinished;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-background lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center overflow-y-auto overflow-x-hidden px-4 pt-3 pb-4 lg:min-h-0 lg:overflow-y-auto lg:px-6 lg:pt-4 lg:pb-6">
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

          <div className="flex max-w-[min(100%,280px)] shrink-0 flex-col items-end gap-2 text-right text-sm sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
            {isFinished ? (
              <span className="flex items-center justify-end gap-1.5 font-medium text-[#007749]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Complete
              </span>
            ) : isProcessing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelSession}
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Cancel session
              </Button>
            ) : (
              <span className="text-muted-foreground">Waiting to start</span>
            )}
          </div>
        </div>

        {loadError && councilData && (
          <div className="mb-6 w-full max-w-4xl rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-200">
            {loadError}
          </div>
        )}

        {isFinished && (
          <div className="mb-6 flex w-full max-w-4xl flex-col items-center gap-3 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <Button
              size="lg"
              variant="success"
              className="px-8 shadow-md"
              onClick={() => setShowModal(true)}
            >
              View Final Response
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={deleteBusy}
              onClick={handleDeleteCouncil}
              className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Delete council
            </Button>
          </div>
        )}

        <div
          className={cn(
            "relative flex min-h-[min(300px,55dvh)] w-full max-w-lg flex-1 shrink-0 flex-col items-center justify-center overflow-visible rounded-3xl border-4 border-border bg-gradient-to-b from-[#EA580C] to-[#9A3412] p-5 shadow-xl transition-colors dark:from-[#9A3412] dark:via-[#7C2D12] dark:to-[#431407] lg:min-h-[320px] lg:flex-1 lg:max-w-xl lg:p-8",
            showSessionStageBanner && "pt-12 lg:pt-14",
          )}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[1.35rem] bg-black/10" />

          {showSessionStageBanner ? (
            <p
              className="pointer-events-none absolute top-3 left-1/2 z-20 max-w-[92%] -translate-x-1/2 text-center text-xs font-semibold tracking-[0.2em] text-white uppercase drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-sm animate-[council-session-pulse_2.4s_ease-in-out_infinite]"
              aria-live="polite"
            >
              Council Is In Session...
            </p>
          ) : null}

          <div className="relative z-10 mx-auto aspect-square w-full max-w-[min(100%,340px)]">
            {orderedModels.map((model, index) => {
              const n = orderedModels.length;
              const radius = n <= 3 ? 34 : 36;
              const isPulsing =
                isProcessing && !isFinished && pulseIndex === index;
              const isDone = isFinished || index <= completedIndex;
              const isCrowned = model.slot === "CROWN";

              return (
                <div
                  key={model.councilAgentId}
                  className="absolute z-[1] w-[104px] -translate-x-1/2 -translate-y-1/2"
                  style={circlePlacement(index, n, radius)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        "relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-card shadow-xl transition-transform duration-[1.45s] ease-in-out will-change-transform",
                        isPulsing
                          ? "z-10 scale-[1.12] shadow-[0_0_22px_rgba(255,255,255,0.5)]"
                          : "scale-100",
                        isDone || isFinished ? "opacity-100" : "opacity-65",
                      )}
                    >
                      {isCrowned && (
                        <div className="absolute -top-3 right-0 z-20 rounded-full bg-[#F59E0B] p-1 text-white shadow-lg">
                          <Crown className="h-4 w-4" />
                        </div>
                      )}
                      <Image
                        src={model.img}
                        alt={model.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    </div>
                    <div className="w-full max-w-[100px] px-0.5 text-center">
                      <div className="truncate text-[11px] font-bold leading-tight text-white drop-shadow-md">
                        {model.name}
                      </div>
                      <div className="truncate text-[9px] font-medium uppercase tracking-wide text-white/75">
                        {model.role}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isFinished && currentCycle > 1 && (
            <div
              className={cn(
                "absolute left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-center text-xs font-medium text-white/80 backdrop-blur-md sm:text-sm",
                showSessionStageBanner ? "top-11 sm:top-12" : "top-4",
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Cycle {currentCycle} — back to {orderedModels[0]?.name}
            </div>
          )}
        </div>

        {loadError && councilData && !isFinished ? (
          <div className="mt-4 flex w-full max-w-4xl flex-col items-center gap-2 pb-1">
            <Button type="button" onClick={() => router.push("/new")}>
              Retry
            </Button>
            <p className="max-w-sm text-center text-xs text-muted-foreground">
              Opens the new council page — your previous prompt is not reused.
            </p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-orientation="vertical"
        aria-label="Resize council log panel"
        onMouseDown={onLogPanelResizeStart}
        className="group relative z-20 hidden w-2 shrink-0 cursor-col-resize items-center justify-center border-border bg-border/80 lg:flex lg:border-l lg:border-r"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-70 group-hover:opacity-100" />
      </button>

      <div
        className="z-10 flex h-[min(40dvh,360px)] w-full shrink-0 flex-col border-t border-border bg-card shadow-[-4px_0_15px_rgba(0,0,0,0.02)] transition-colors lg:h-full lg:min-h-0 lg:min-w-[380px] lg:max-w-[50vw] lg:border-t-0 lg:border-l"
        style={
          isLgLayout
            ? {
                width: logPanelWidth,
                minWidth: MIN_LOG_PANEL_PX,
                maxWidth: "50vw",
              }
            : undefined
        }
      >
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

        <div
          ref={logScrollContainerRef}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-y-contain p-4"
        >
          {logsByCycle.map((cycleGroup) => (
            <div
              key={`cycle-${cycleGroup.cycleNum}`}
              className="relative flex flex-col gap-4"
            >
              <div className="flex shrink-0 items-center gap-2 bg-card py-2">
                <div className="h-px flex-1 bg-border" />
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors">
                  Cycle {cycleGroup.cycleNum}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {cycleGroup.entries.map((log) => {
                const isFinalChatMessage =
                  Boolean(lastLogId) && log.id === lastLogId;

                return (
                  <div
                    key={log.id}
                    ref={isFinalChatMessage ? finalLogRowRef : undefined}
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
                      {log.cycle === currentCycle &&
                        log.step < orderedModels.length && (
                          <div className="mt-2 mb-[-16px] h-full w-0.5 bg-border" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1 pb-2">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {log.modelName}
                        </span>
                        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-nowrap text-muted-foreground transition-colors">
                          {log.role}
                        </span>
                        {isFinalChatMessage ? (
                          <span className="rounded-full bg-[#007749]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#007749]">
                            Final
                          </span>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "relative rounded-lg rounded-tl-none border p-3 text-sm leading-relaxed shadow-sm transition-colors",
                          isFinalChatMessage
                            ? "border-[#007749]/35 bg-[#007749]/08 text-foreground dark:bg-[#007749]/15"
                            : "border-border bg-card text-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0 -left-1.5 h-3 w-3 rotate-[-45deg] rounded-tl-sm border-t border-l transition-colors",
                            isFinalChatMessage
                              ? "border-[#007749]/35 bg-[#007749]/08 dark:bg-[#007749]/15"
                              : "border-border bg-card",
                          )}
                        />
                        <CouncilLogMessageBody
                          content={log.content}
                          slot={log.slot}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {!isFinished && isProcessing && orderedModels.length > 0 && (
            <div
              className="flex gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
              role="status"
              aria-live="polite"
              aria-label="Council debate in progress, waiting for responses"
            >
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C2410C] bg-card shadow-[0_0_0_2px_rgba(194,65,12,0.15)]"
                  aria-hidden
                >
                  <Users className="h-4 w-4 text-[#C2410C]" />
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Council Debate
                  </span>
                </div>
                <div className="flex h-10 w-16 items-center justify-center gap-1 rounded-lg rounded-tl-none border border-border bg-card p-3 text-sm transition-colors">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          <div className="h-1 shrink-0" aria-hidden />
        </div>
      </div>

      {showModal && (
        <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm opacity-0 animate-[fadeIn_0.2s_ease-out_forwards] sm:items-center sm:p-6">
          <div className="my-auto flex w-full max-w-2xl scale-95 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-colors animate-[popIn_0.3s_ease-out_forwards] max-h-[min(90vh,calc(100dvh-2rem))] min-h-0">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-card to-accent p-4 transition-colors sm:p-6">
              <div className="min-w-0 pr-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Final response
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#007749]/10 px-2 py-1 text-xs font-medium text-[#007749]">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    Completed after {totalCycles} cycles
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
                aria-label="Close"
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-8 sm:py-6">
              <div className="text-base leading-relaxed font-medium text-foreground whitespace-pre-wrap sm:text-lg">
                {finalSummary}
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Council Metadata
              </p>
              <div className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 sm:gap-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Started by:</span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Crown className="h-3 w-3 shrink-0 text-[#F59E0B]" />{" "}
                    {orderedModels[0]?.name} ({orderedModels[0]?.role})
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Total Models:</span>
                  <span className="font-medium text-foreground">
                    {orderedModels.length} participants
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-muted-foreground">Sequence:</span>
                  <span className="font-medium text-foreground">
                    {orderedModels.map((model) => model.name).join(" → ")}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-muted-foreground">Process Info:</span>
                  <span className="font-medium text-foreground">
                    Generated after sequential review by {orderedModels.length}{" "}
                    models across {totalCycles} cycles.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-card p-4 transition-colors sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="mr-1 self-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Download
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCouncilFinalResponse("txt", {
                      title: councilData.title,
                      topic: question,
                      body: finalSummary,
                    })
                  }
                >
                  Plain text (.txt)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCouncilFinalResponse("md", {
                      title: councilData.title,
                      topic: question,
                      body: finalSummary,
                    })
                  }
                >
                  Markdown (.md)
                </Button>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button onClick={() => router.push("/new")}>
                  Start New Council
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
