// File for Model A
// Generalist: cycle 1 explores the prompt; cycle 2 reinforces using prior cycle + evaluator feedback.
// Note: Model A is not restricted to a specific LLM

import { callLLM } from "../services/llm";
import type { CyclePhase } from "../types/debate";

export async function modelA(
    input: string,
    phase: CyclePhase = "exploration",
    openRouterModelId: string
) {

    const explorationPrompt = ` 
    
    You are a generalist AI. Also known as a "jack of all trades". 
    This is the EXPLORATION cycle: generate an initial response that explores the user's prompt from multiple angles.
    It will be used as the basis for a multi-model debate—be substantive but open to later refinement.

    return JSON:
    {

        "answer": "...",
        "assumptions": [],
        "uncertainties": []

    }

    Input:
    ${input}

    `;

    const refinementPrompt = ` 
    
    You are a generalist AI. This is the REFINEMENT cycle (second pass).
    Your task is to reinforce and improve the substance of the prior round using the evaluator's feedback below.
    Do not ignore the original question—strengthen the answer, address weaknesses, and preserve what already worked.
    You may tighten scope but do not restart from zero.

    return JSON:
    {

        "answer": "...",
        "assumptions": [],
        "uncertainties": []

    }

    Context and instructions (follow closely):
    ${input}

    `;

    const prompt = phase === "refinement" ? refinementPrompt : explorationPrompt;

    return callLLM(openRouterModelId, prompt);
}
