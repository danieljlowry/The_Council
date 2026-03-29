// File for Model C
// Refiner: tightens Model B's output; in refinement cycle, prioritizes reinforcement and clarity of the final line of reasoning.
// Note: Model C is not restricted to a specific LLM

import { callLLM } from "../services/llm";
import type { CyclePhase } from "../types/debate";

/**
 * @param cycle1ModelBOutput — When `phase` is "refinement", Model B's cycle-1 text (for source verification). Use `undefined` in exploration.
 * @param openRouterModelId — OpenRouter model id for this refiner slot (e.g. anthropic/claude-3.5-haiku).
 */
export async function modelC(
    originalPrompt: string,
    modelBOutput: string,
    phase: CyclePhase = "exploration",
    cycle1ModelBOutput: string | undefined,
    openRouterModelId: string
) {

    const modeLine =
        phase === "refinement"
            ? "This is the REFINEMENT cycle: prioritize sharpening, consistency, and a single reinforced recommendation (or conclusion) where appropriate."
            : "This is the EXPLORATION cycle: refine for nuance and coherence while preserving intent.";

    const sourceVerificationBlock =
        phase === "refinement" && cycle1ModelBOutput !== undefined && cycle1ModelBOutput.length > 0
            ? `
    SOURCE VERIFICATION (required in this refinement cycle):
    Below, "CYCLE 1 MODEL B OUTPUT" is the exploration-round implementation response that included a "Relevant sources" (or equivalent) section.
    Compare those sources against the USER'S ORIGINAL QUESTION and against the current cycle's MODEL B OUTPUT.
    In your refined answer, include a clearly labeled section "Source verification" that for each source from cycle 1 states: (a) whether it remains relevant, (b) whether the citation/detail looks plausible and correct or needs correction, (c) any caveats (e.g. paywalled, outdated, or uncertain URL). If a source cannot be verified from the text alone, say so honestly.
    Then continue with your normal refinement of the current MODEL B OUTPUT (rules below).
    `
            : "";

    const prompt = ` 
    
    You are a refinement specialist AI.
    ${modeLine}
    ${sourceVerificationBlock}
    Refine the answer provided from Model B below, and provide more nuance and complexity to the response.
    The text under "MODEL B OUTPUT" is the full answer from Model B for this cycle—do not say it is missing; work from that text.

    Here is a set of rules to follow when refining the answer:
    1. Remove any redundancy in the answer, and make it more concise.
    2. Fix any inconsistencies in the answer, and make it more coherent.
    3. Improve clarity of the answer, and make it easier to understand.
    4. Do not introduce new ideas into the answer provided by Model B, only refine it and provide more nuance and complexity to the response.
    
    USER'S ORIGINAL QUESTION:
    ${originalPrompt}

    ${
        phase === "refinement" && cycle1ModelBOutput
            ? `CYCLE 1 MODEL B OUTPUT (sources to verify appeared here):
${cycle1ModelBOutput}

`
            : ""
    }MODEL B OUTPUT (refine this):
    ${modelBOutput}

    `

    return callLLM(openRouterModelId, prompt);
}