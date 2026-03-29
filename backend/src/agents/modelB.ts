// File for Model B
// Implementation / design: expands Model A; in refinement cycle, deepens reinforcement of the agreed direction.
// Note: Model B is not restricted to a specific LLM

import { callLLM } from "../services/llm";
import type { CyclePhase } from "../types/debate";

export async function modelB(
    originalPrompt: string,
    modelAOutput: string,
    phase: CyclePhase = "exploration",
    openRouterModelId: string
) {

    const modeLine =
        phase === "refinement"
            ? "This is the REFINEMENT cycle: deepen implementation detail and reinforce the strengthened plan from Model A. Prefer precision and consolidation over adding unrelated ideas. Keep any source list from cycle 1 accurate and integrated with your expansion."
            : "This is the EXPLORATION cycle: expand with concrete detail and depth.";

    const sourcesBlock =
        phase === "exploration"
            ? `
    SOURCE DISCOVERY (required in this exploration cycle):
    After expanding on Model A, add a clearly labeled section titled "Relevant sources" (or similar).
    Identify sources that substantiate or contextualize the user's question: e.g. official documentation, standards, peer-reviewed work, reputable news or industry reports, primary texts, or well-known authoritative references.
    For each source, give: title or name, type (e.g. paper, spec, site), year or version if known, and one line on why it is relevant to the user's prompt.
    If you include URLs, only use ones you are confident are real and stable; otherwise give enough bibliographic detail that a reader could locate the source. Do not fabricate citations.
    `
            : "";

    const prompt = ` 
    
    You are an implementation specialist AI. 
    ${modeLine}
    ${sourcesBlock}
    Expand ONLY on the answer provided by Model A, and provide more detail and depth to the response.
    Do not introduce new ideas into the answer provided by Model A, only expand on it and provide more detail and depth.

    USER'S ORIGINAL QUESTION:
    ${originalPrompt}

    MODEL A OUTPUT (expand this, do not ask for it to be repeated):
    ${modelAOutput}

    `

    return callLLM(openRouterModelId, prompt);
}