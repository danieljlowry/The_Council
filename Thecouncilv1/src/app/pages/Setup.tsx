import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Crown, AlertTriangle, ChevronRight, Settings2, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { cn } from "../utils/styles";
import { AVAILABLE_MODELS } from "../utils/models";

export function Setup() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [cycles, setCycles] = useState(2);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [crownedModel, setCrownedModel] = useState<string>("");
  
  // Validation
  // Invalid state: user typed a statement not ending with '?' or using certain keywords.
  // For the prototype, we trigger invalid state if the prompt equals "Build me a productivity app" 
  // or just if it doesn't contain a '?' and length > 5.
  const isInvalid = question.trim().length > 5 && !question.includes("?");
  const isValid = question.trim().length > 5 && !isInvalid && selectedModels.length >= 3;

  const handleStart = () => {
    if (isValid) {
      navigate("/council/new-run", {
        state: {
          question,
          cycles,
          selectedModels,
          crownedModel: crownedModel || selectedModels[0],
        },
      });
    }
  };

  const toggleModel = (id: string) => {
    if (selectedModels.includes(id)) {
      const nextModels = selectedModels.filter((m) => m !== id);
      setSelectedModels(nextModels);
      if (crownedModel === id) {
        setCrownedModel(nextModels.length > 0 ? nextModels[0] : "");
      }
    } else {
      setSelectedModels((prev) => [...prev, id]);
      if (!crownedModel) {
        setCrownedModel(id);
      }
    }
  };

  // Order reflects selection order
  const orderedModels = selectedModels.map((id) => AVAILABLE_MODELS.find((m) => m.id === id)!);

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-full bg-[#f5f5f5] overflow-hidden">
      {/* Center workspace */}
      <div className="flex-1 flex flex-col items-center py-8 lg:py-12 px-4 lg:px-8 overflow-y-auto">
        <div className="w-full max-w-3xl flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1e1e1e] tracking-tight">Configure Council</h1>
            <p className="text-[#757575] mt-2">
              Select the models, set the order, and define the topic for discussion.
            </p>
          </div>

          {/* Model Selection Stage */}
          <div className="bg-white p-6 rounded-2xl border border-[#d9d9d9] shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1e1e1e]">Council Sequence</h2>
              <div className="text-xs font-medium text-[#757575] uppercase tracking-wider bg-[#f5f5f5] px-2 py-1 rounded">
                Relay Order
              </div>
            </div>
            
            {orderedModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-[#e5e5e5] rounded-xl bg-[#fafafa]">
                <p className="text-sm font-medium text-[#757575]">Select at least 3 LLMs to build your council sequence.</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 pt-6 pb-4 pl-5 overflow-x-auto min-h-[160px]">
                {orderedModels.map((model, index) => {
                  const isCrowned = model.id === crownedModel;
                  const orderNumber = index + 1;
                  return (
                    <React.Fragment key={model.id}>
                      <div
                        className={cn(
                          "relative flex flex-col items-center w-36 p-4 rounded-xl border-2 transition-all",
                          isCrowned
                            ? "border-[#002D72] bg-[#002D72]/5 shadow-sm"
                            : "border-[#d9d9d9] bg-white hover:border-[#b3b3b3]"
                        )}
                      >
                        <div className="absolute -top-3 -left-3 bg-[#1e1e1e] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                          {orderNumber}
                        </div>
                        {isCrowned && (
                          <div className="absolute -top-3 bg-[#002D72] text-white p-1 rounded-full shadow-md z-10">
                            <Crown className="w-4 h-4" />
                          </div>
                        )}
                        <img src={model.img} alt={model.name} className="w-12 h-12 rounded-full mb-3 shadow-sm border border-black/5" />
                        <div className="text-sm font-bold text-[#1e1e1e] text-center w-full truncate">
                          {model.name}
                        </div>
                        <div className="text-[11px] text-[#757575] text-center mt-1 w-full truncate px-1">
                          {model.role}
                        </div>
                        
                        {!isCrowned && (
                          <button
                            onClick={() => setCrownedModel(model.id)}
                            className="mt-3 text-[10px] font-medium text-[#002D72] hover:bg-[#002D72]/10 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Make Crowned
                          </button>
                        )}
                      </div>
                      {index < orderedModels.length - 1 && (
                        <div className="flex flex-col items-center text-[#b3b3b3] shrink-0">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {selectedModels.length > 0 && selectedModels.length < 3 && (
              <div className="flex items-center gap-2 text-sm text-[#B45309] bg-[#F59E0B]/10 p-3 rounded-lg border border-[#F59E0B]/20">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>Choose at least 3 LLMs to create a council.</p>
              </div>
            )}

            {/* Model Toggle pool */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#f0f0f0]">
              <span className="text-xs font-medium text-[#757575]">Available Models:</span>
              <div className="flex flex-wrap items-center gap-2">
                {AVAILABLE_MODELS.map((m) => {
                  const selectedIndex = selectedModels.indexOf(m.id);
                  const isSelected = selectedIndex !== -1;
                  const orderNumber = selectedIndex + 1;
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors relative",
                        isSelected
                          ? "border-[#002D72] bg-[#002D72] text-white pl-2"
                          : "border-[#d9d9d9] bg-white text-[#757575] hover:bg-[#f5f5f5]"
                      )}
                    >
                      {isSelected && (
                        <span className="bg-white text-[#002D72] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {orderNumber}
                        </span>
                      )}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form setup */}
          <div className="bg-white p-6 rounded-2xl border border-[#d9d9d9] shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1e1e1e]">Debate Question</label>
              <Textarea
                placeholder="e.g., Should early-stage startups prioritize speed or reliability when building their MVP?"
                className={cn("text-base py-3", isInvalid && "border-[#F59E0B] focus-visible:ring-[#F59E0B]")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
              
              {/* Validation State */}
              {isInvalid && (
                <div className="flex items-start gap-2 mt-2 bg-[#F59E0B]/10 text-[#B45309] p-3 rounded-lg border border-[#F59E0B]/20">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">The Council only starts when you ask a question.</p>
                    <p className="text-xs mt-0.5">Please rewrite your prompt as a question ending with "?".</p>
                  </div>
                </div>
              )}
              
              {/* Quick fill helper for testing */}
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={() => setQuestion("Should early-stage startups prioritize speed or reliability when building their MVP?")}
                  className="text-xs text-[#002D72] hover:underline"
                >
                  Use valid example
                </button>
                <span className="text-[#d9d9d9]">|</span>
                <button 
                  onClick={() => setQuestion("Build me a productivity app")}
                  className="text-xs text-[#002D72] hover:underline"
                >
                  Use invalid example
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1e1e1e] flex items-center justify-between">
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
                      "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors text-center",
                      cycles === num
                        ? "border-[#002D72] bg-[#002D72]/5 text-[#002D72]"
                        : "border-[#d9d9d9] bg-white text-[#1e1e1e] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {num} {num === 1 ? "Cycle" : "Cycles"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#f0f0f0] mt-2 flex justify-end">
              <Button
                size="lg"
                className="min-w-[200px]"
                disabled={!isValid}
                onClick={handleStart}
              >
                Launch Council
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Helper state */}
      <div className="w-full lg:w-[320px] bg-[#fcfcfc] border-t lg:border-t-0 lg:border-l border-[#d9d9d9] flex flex-col p-6 shrink-0 gap-6">
        <h3 className="font-semibold text-[#1e1e1e]">How it works</h3>
        
        <div className="flex flex-col gap-4 text-sm text-[#757575]">
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#002D72]/10 text-[#002D72] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
            <p>The <strong className="text-[#1e1e1e]">Crowned model</strong> always starts.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#002D72]/10 text-[#002D72] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
            <p>Each model receives the previous model's output and refines it from its own role perspective.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#002D72]/10 text-[#002D72] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
            <p>One cycle means the response passes through every selected model once.</p>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-[#002D72]/10 text-[#002D72] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
            <p>After the final model completes the last cycle, the council returns one <strong className="text-[#1e1e1e]">final answer</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}