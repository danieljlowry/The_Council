import imgGPT from "@/assets/Chatgpt.png";
import imgClaude from "@/assets/Claude.png";
import imgGemini from "@/assets/Gemini.png";
import imgLlama from "@/assets/OLlama.png";

export const AVAILABLE_MODELS = [
  {
    id: "gpt-5",
    name: "GPT-5",
    role: "Generalist",
    img: imgGPT,
  },
  {
    id: "claude",
    name: "Claude",
    role: "Realist",
    img: imgClaude,
  },
  {
    id: "llama",
    name: "Llama",
    role: "Creative Strategist",
    img: imgLlama,
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Synthesizer",
    img: imgGemini,
  },
];
