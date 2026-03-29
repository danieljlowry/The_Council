// File for Model D
// Evaluator / summarizer: cycle 1 closes exploration; cycle 2 closes on how well the answer was reinforced.
// Note: Model D is not restricted to a specific LLM

import { callLLM } from "../services/llm";
import type { CyclePhase } from "../types/debate";

export async function modelD(
    originalPrompt: string,
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
    Your task is to analyze the answer provided by Model C under the following criteria:
    1. Summarize the answer provided by Model C in a concise and clear manner.
    2. Identify any issues or weaknesses in the answer provided by Model C, and provide a critical evaluation of the answer.
    3. Suggest any improvements or refinements that could be made to the answer provided by Model C, based on your critical evaluation of the answer.

    The text under "MODEL C OUTPUT" is Model C's full response—base your analysis only on that text.

    Return JSON:
    {

        "summary": "...",
        "issues": [],
        "evaluation": "...",
        "suggested_improvements": []

    }   

    USER'S ORIGINAL QUESTION:
    ${originalPrompt}

    MODEL C OUTPUT:
    ${modelCOutput}

    `

    return callLLM(openRouterModelId, prompt);
}