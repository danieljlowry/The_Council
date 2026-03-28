import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { CheckCircle2, ChevronRight, Crown, Loader2 } from "lucide-react";
import { cn } from "../utils/styles";
import { AVAILABLE_MODELS } from "../utils/models";
import { Button } from "../components/Button";

// Fake data for messages
const getFakeMessage = (modelId: string, cycle: number) => {
  if (cycle === 1) {
    if (modelId === "gpt-5") {
      return "Startups should prioritize speed initially to find product-market fit. Reliability can be built later once the core value is proven.";
    } else if (modelId === "claude") {
      return "While speed is critical, total unreliability destroys trust. Startups must balance speed with a baseline of functional stability to avoid burning early adopters.";
    } else if (modelId === "llama") {
      return "Let's reframe: 'Speed of learning' over 'Speed of shipping'. If an MVP is too unreliable, the data you gather is flawed. Build a 'reliable enough' prototype to test the core hypothesis fast.";
    } else {
      return "Synthesizing the above: Speed is the engine, but basic reliability is the steering wheel. Both are needed.";
    }
  } else {
    if (modelId === "gpt-5") {
      return "Building on Llama's point, 'speed of learning' becomes our primary metric. We should define the minimum acceptable reliability threshold that allows accurate learning.";
    } else if (modelId === "claude") {
      return "Agreed. The tradeoff is no longer speed vs. reliability, but finding the exact reliability floor that maximizes learning velocity without catastrophic failure.";
    } else if (modelId === "llama") {
      return "Final synthesis: Early-stage startups shouldn't choose between speed and reliability. Instead, they should relentlessly pursue 'Speed of Learning', which requires a minimum viable reliability. Ship fast, but only when the core mechanism is stable enough to yield true user feedback.";
    } else {
      return "Final synthesis: Optimize for the velocity of validated learning.";
    }
  }
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
};

export function CouncilRun() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    question: string;
    cycles: number;
    selectedModels: string[];
    crownedModel: string;
  } | null;

  // Fallback if accessed directly
  const question = state?.question || "Should early-stage startups prioritize speed or reliability when building their MVP?";
  const totalCycles = state?.cycles || 2;
  const selectedModels = state?.selectedModels || ["gpt-5", "claude", "llama"];
  const crownedModel = state?.crownedModel || "gpt-5";

  const orderedModels = selectedModels.map((id) => AVAILABLE_MODELS.find((m) => m.id === id)!);

  const [currentCycle, setCurrentCycle] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const totalSteps = orderedModels.length;
  const totalProcessSteps = totalSteps * totalCycles;
  const currentProcessStep = (currentCycle - 1) * totalSteps + currentStepIndex;
  const progressPercent = isFinished ? 100 : Math.round((currentProcessStep / totalProcessSteps) * 100);

  useEffect(() => {
    if (isFinished) return;

    // Simulate typing/processing delay
    const timer = setTimeout(() => {
      const activeModel = orderedModels[currentStepIndex];
      const newLog: LogEntry = {
        id: `log-${currentCycle}-${currentStepIndex}`,
        modelId: activeModel.id,
        modelName: activeModel.name,
        role: activeModel.role,
        cycle: currentCycle,
        step: currentStepIndex + 1,
        content: getFakeMessage(activeModel.id, currentCycle),
        img: activeModel.img,
      };

      setLogs((prev) => [...prev, newLog]);

      // Advance step
      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        // Advance cycle
        if (currentCycle < totalCycles) {
          setCurrentCycle((prev) => prev + 1);
          setCurrentStepIndex(0);
        } else {
          setIsFinished(true);
        }
      }
    }, 2500); // 2.5s per model step

    return () => clearTimeout(timer);
  }, [currentCycle, currentStepIndex, isFinished, orderedModels, totalCycles, totalSteps]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Organize logs by cycle
  const logsByCycle = Array.from({ length: currentCycle }, (_, i) => i + 1).map((cycleNum) => {
    return {
      cycleNum,
      entries: logs.filter((l) => l.cycle === cycleNum),
    };
  });

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-[#f5f5f5] overflow-hidden relative">
      {/* Center workspace */}
      <div className="flex-1 flex flex-col items-center py-4 lg:py-8 px-4 lg:px-6 overflow-hidden h-full">
        {/* Header & Progress */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-[#d9d9d9] shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-[#1e1e1e]">
              {isFinished ? "Council Output Complete" : "Council in Progress"}
            </h2>
            <p className="text-sm text-[#757575] mt-1 line-clamp-1" title={question}>
              <span className="font-semibold text-[#1e1e1e]">Topic:</span> {question}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 min-w-[200px]">
            <div className="flex items-center gap-2 text-sm font-medium">
              {isFinished ? (
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-[#007749] flex items-center gap-1 hover:underline focus:outline-none"
                >
                  <CheckCircle2 className="w-4 h-4" /> Final Answer Ready
                </button>
              ) : (
                <span className="text-[#002D72]">
                  Cycle {currentCycle} of {totalCycles} • Step {currentStepIndex + 1} of {totalSteps}
                </span>
              )}
            </div>
            <div className="w-full bg-[#e5e5e5] h-2 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out rounded-full",
                  isFinished ? "bg-[#007749]" : "bg-[#002D72]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completion Action */}
        {isFinished && (
          <div className="mb-8 w-full max-w-4xl flex justify-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <Button
              size="lg"
              variant="danger" // Wait, danger is mapped to green above
              className="px-8 shadow-md"
              onClick={() => setShowModal(true)}
            >
              View Final Council Response
            </Button>
          </div>
        )}

        {/* Stage Visualization */}
        <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-[#007749] to-[#002D72] rounded-3xl border-4 border-white shadow-xl overflow-hidden min-h-[240px]">
          <div className="absolute inset-0 bg-black/10" />
          
          <div className="flex items-center justify-center gap-6 z-10 w-full">
            {orderedModels.map((model, index) => {
              const isActive = !isFinished && currentStepIndex === index;
              const isDone = isFinished || currentCycle > 1 || (currentCycle === 1 && currentStepIndex > index);
              const isCrowned = model.id === crownedModel;

              return (
                <React.Fragment key={model.id}>
                  <div className="relative flex flex-col items-center group">
                    <div
                      className={cn(
                        "relative w-24 h-24 rounded-full flex items-center justify-center bg-white shadow-xl transition-all duration-500",
                        isActive ? "scale-110 ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.5)]" : "opacity-80 scale-95"
                      )}
                    >
                      {isCrowned && (
                        <div className="absolute -top-4 -right-1 bg-[#F59E0B] text-white p-1.5 rounded-full shadow-lg z-20">
                          <Crown className="w-5 h-5" />
                        </div>
                      )}
                      <img src={model.img} alt={model.name} className="w-20 h-20 rounded-full object-cover" />
                      
                      {isActive && (
                        <div className="absolute -bottom-3 bg-white text-[#002D72] text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <div className="text-white font-bold text-lg drop-shadow-md">{model.name}</div>
                      <div className="text-white/80 text-xs font-medium uppercase tracking-wider">{model.role}</div>
                    </div>
                  </div>

                  {/* Connector */}
                  {index < orderedModels.length - 1 && (
                    <div className="flex flex-col items-center justify-center w-16">
                      <div className="h-0.5 w-full bg-white/30 relative overflow-hidden">
                        <div
                          className={cn(
                            "absolute top-0 left-0 h-full bg-white transition-all duration-1000",
                            isFinished || currentStepIndex > index ? "w-full" : isActive ? "w-1/2 animate-pulse" : "w-0"
                          )}
                        />
                      </div>
                      <ChevronRight className={cn("w-6 h-6 mt-1 transition-colors", isFinished || currentStepIndex > index ? "text-white" : isActive ? "text-white/70" : "text-white/30")} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Cycle Restart Connector Visualization */}
          {!isFinished && currentCycle > 1 && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Cycle {currentCycle} passing back to {orderedModels[0].name}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Council Log */}
      <div className="w-full lg:w-[380px] h-[40%] lg:h-full bg-[#fcfcfc] border-t lg:border-t-0 lg:border-l border-[#d9d9d9] flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10">
        <div className="p-4 border-b border-[#d9d9d9] bg-white sticky top-0 z-10">
          <h3 className="font-semibold text-[#1e1e1e] flex items-center gap-2">
            Council Log
            {isFinished && <span className="text-[10px] bg-[#007749]/10 text-[#007749] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Resolved</span>}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {logsByCycle.map((cycleGroup, idx) => (
            <div key={`cycle-${cycleGroup.cycleNum}`} className="flex flex-col gap-4 relative">
              <div className="sticky top-0 z-10 flex items-center gap-2 py-1 bg-[#fcfcfc]/90 backdrop-blur-sm">
                <div className="h-px bg-[#d9d9d9] flex-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                  Cycle {cycleGroup.cycleNum}
                </span>
                <div className="h-px bg-[#d9d9d9] flex-1" />
              </div>

              {cycleGroup.entries.map((log) => (
                <div key={log.id} className="flex gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
                  <div className="shrink-0 flex flex-col items-center">
                    <img src={log.img} alt={log.modelName} className="w-8 h-8 rounded-full border border-[#d9d9d9] bg-white object-cover" />
                    {log.cycle === currentCycle && log.step < orderedModels.length && (
                      <div className="w-0.5 h-full bg-[#d9d9d9] mt-2 mb-[-16px]" /> // connection line
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#1e1e1e]">{log.modelName}</span>
                      <span className="text-[10px] bg-[#e5e5e5] text-[#757575] px-1.5 py-0.5 rounded text-nowrap">
                        {log.role}
                      </span>
                    </div>
                    <div className="text-sm text-[#4a4a4a] leading-relaxed bg-white border border-[#e5e5e5] p-3 rounded-lg rounded-tl-none shadow-sm relative">
                      {/* Speech bubble pointer */}
                      <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white border-l border-t border-[#e5e5e5] rotate-[-45deg] rounded-tl-sm" />
                      <span className="relative z-10">{log.content}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Typing Indicator */}
          {!isFinished && logsByCycle[logsByCycle.length - 1]?.entries.length < totalSteps && (
            <div className="flex gap-3 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
              <div className="shrink-0 flex flex-col items-center">
                <img src={orderedModels[currentStepIndex].img} alt={orderedModels[currentStepIndex].name} className="w-8 h-8 rounded-full border border-[#002D72] shadow-[0_0_0_2px_rgba(0,45,114,0.1)] object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#1e1e1e]">{orderedModels[currentStepIndex].name}</span>
                  <Loader2 className="w-3 h-3 text-[#002D72] animate-spin" />
                </div>
                <div className="text-sm bg-white border border-[#e5e5e5] p-3 rounded-lg rounded-tl-none w-16 flex items-center justify-center gap-1 h-10">
                  <div className="w-1.5 h-1.5 bg-[#b3b3b3] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[#b3b3b3] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#b3b3b3] rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={logEndRef} className="h-4" />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-95 animate-[popIn_0.3s_ease-out_forwards]">
            <div className="p-6 border-b border-[#f0f0f0] flex items-start justify-between bg-gradient-to-r from-white to-[#f5fcf8]">
              <div>
                <h2 className="text-2xl font-bold text-[#1e1e1e] tracking-tight">Final Council Response</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#007749]/10 text-[#007749] px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Completed after {totalCycles} cycles
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-[#757575] hover:text-[#1e1e1e] transition-colors p-1"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-8 pb-10">
              <div className="text-[#1e1e1e] text-lg leading-relaxed font-medium">
                {logs[logs.length - 1]?.content}
              </div>
              
              <div className="mt-8 pt-6 border-t border-[#f0f0f0]">
                <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider mb-4">
                  Council Metadata
                </p>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-[#757575]">Started by:</span>
                    <span className="font-medium text-[#1e1e1e] flex items-center gap-1">
                      <Crown className="w-3 h-3 text-[#F59E0B]" /> {orderedModels[0].name} ({orderedModels[0].role})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#757575]">Total Models:</span>
                    <span className="font-medium text-[#1e1e1e]">{orderedModels.length} participants</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#757575]">Sequence:</span>
                    <span className="font-medium text-[#1e1e1e]">
                      {orderedModels.map(m => m.name).join(" → ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#757575]">Process Info:</span>
                    <span className="font-medium text-[#1e1e1e]">Generated after sequential review by {orderedModels.length} models across {totalCycles} cycles.</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#fcfcfc] border-t border-[#f0f0f0] flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                View Saved Run
              </Button>
              <Button onClick={() => navigate("/new")}>
                Start New Council
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
