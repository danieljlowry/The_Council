export const AVAILABLE_MODELS = [
  {
    id: "gpt-5",
    name: "GPT-5",
    role: "Generalist",
    img: "/images/Chatgpt.png",
    modelKey: "openai/gpt-5",
  },
  {
    id: "claude",
    name: "Claude",
    role: "Realist",
    img: "/images/Claude.png",
    modelKey: "anthropic/claude-3.5-sonnet",
  },
  {
    id: "llama",
    name: "Llama",
    role: "Creative Strategist",
    img: "/images/OLlama.png",
    modelKey: "meta-llama/llama-3",
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Synthesizer",
    img: "/images/Gemini.png",
    modelKey: "google/gemini-pro",
  },
] as const;
