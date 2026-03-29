/** OpenRouter `model` ids — budget-tier (faster, cheaper per token) for hackathon-scale use. */
export const AVAILABLE_MODELS = [
  {
    id: "gpt-5",
    name: "GPT-4o Mini",
    role: "Generalist",
    img: "/images/Chatgpt.png",
    modelKey: "openai/gpt-4o-mini",
  },
  {
    id: "claude",
    name: "Claude Haiku",
    role: "Realist",
    img: "/images/Claude.png",
    modelKey: "anthropic/claude-3-haiku",
  },
  {
    id: "llama",
    name: "Llama 3.1 8B",
    role: "Creative Strategist",
    img: "/images/OLlama.png",
    modelKey: "meta-llama/llama-3.1-8b-instruct",
  },
  {
    id: "gemini",
    name: "Gemini Flash",
    role: "Synthesizer",
    img: "/images/Gemini.png",
    modelKey: "google/gemini-2.0-flash-001",
  },
  {
    id: "qwen",
    name: "Qwen 2.5 7B",
    role: "Analyst",
    img: "/images/3dqwen.png",
    modelKey: "qwen/qwen-2.5-7b-instruct",
  },
] as const;
