// Small file formatting to the structure of each agent's output

/** Cycle 1 explores the user prompt; cycle 2 refines and reinforces using cycle 1 outputs. */
export type CyclePhase = "exploration" | "refinement";

export type CycleCount = 1 | 2;

/**
 * OpenRouter model id per council role (fixed roles: generalist, implementation, refiner, evaluator).
 * Example: { A: "openai/gpt-4o", B: "google/gemini-2.5-pro", ... }
 */
export type ModelLineup = {
    A: string;
    B: string;
    C: string;
    D: string;
};

/**
 * Default lineup when the client omits `models` / `modelOrder`:
 * A ChatGPT (OpenAI) → B Gemini → C Claude → D Qwen.
 */
export const DEFAULT_MODEL_LINEUP: ModelLineup = {
    A: "openai/gpt-3.5-turbo",
    B: "google/gemini-2.5-pro",
    C: "anthropic/claude-3.5-haiku",
    D: "qwen/qwen3-235b-a22b-2507",
};

export type AgentOutput = {

    answer?: string // Agent's output as string
    summary?: string // (Optional) Summary of debate (used later)
    issues?: string[]
    improvements?: string[]

}