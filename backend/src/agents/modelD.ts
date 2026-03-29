// File for Model D
// Evaluator / summarizer: cycle 1 closes exploration; cycle 2 closes on how well the answer was reinforced.
// Note: Model D is not restricted to a specific LLM

import { callLLM } from "../services/llm";
import type { CyclePhase } from "../types/debate";

export async function modelD(
    originalPrompt: string,
    modelAOutput: string,
    modelBOutput: string,
    modelCOutput: string,
    phase: CyclePhase = "exploration",
    openRouterModelId: string
) {

    const modeLine =
        phase === "refinement"
            ? "This is the REFINEMENT cycle: assess how well the answer consolidates prior work, whether remaining gaps are acceptable, and what final polish (if any) is still needed."
            : "This is the EXPLORATION cycle: assess strengths, gaps, and improvement opportunities for the next pass if any.";

    const prompt = ` 
    
    You are a critical evaluator and summarizer AI.
    ${modeLine}

    You are given this council cycle in order: Model A (opening), Model B (builds on A), Model C (synthesis). Use ALL of them to understand the full arc of reasoning.

    Your tasks:
    1. "summary": Write a thorough, multi-paragraph summary of THIS ENTIRE CYCLE—not only Model C. Explain how the line of thought develops from A through B to C: key claims, tensions, agreements, and how the final synthesis relates to earlier contributions. Match the depth of the debate (several solid paragraphs; do not compress into a short blurb).
    2. "issues": List concrete weaknesses or gaps, especially in Model C's synthesis, but note where they stem from earlier steps if relevant.
    3. "evaluation": Critically assess Model C as the primary synthesized answer for this cycle, with reference to A and B where helpful.
    4. "suggested_improvements": Actionable refinements, grounded in the full cycle.

    Return ONLY valid JSON with this shape (no markdown fences):
    {
        "summary": "...",
        "issues": [],
        "evaluation": "...",
        "suggested_improvements": []
    }

    USER'S ORIGINAL QUESTION:
    ${originalPrompt}

    MODEL A OUTPUT:
    ${modelAOutput}

    MODEL B OUTPUT:
    ${modelBOutput}

    MODEL C OUTPUT:
    ${modelCOutput}

    `

    const rawEval = Number(process.env.OPENROUTER_EVALUATOR_MAX_TOKENS);
    const evalMaxTokens =
        Number.isFinite(rawEval) && rawEval > 0 ? Math.floor(rawEval) : 1536;

    return callLLM(openRouterModelId, prompt, {
        maxTokens: evalMaxTokens,
    });
}