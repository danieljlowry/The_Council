// File for Model B
// Takes Model A's response as input and instructs LLM to expand on it 
// Provides more detail and depth to the response, without introducing new ideas into the answer provided by Model A
// Note: Model B is not restricted to a specific LLM

import { callLLM } from "../services/llm";

export async function modelB(originalPrompt: string, modelAOutput: string) {

    const prompt = ` 
    
    You are an implementation specialist AI. 
    Expand ONLY on the answer provided by Model A, and provide more detail and depth to the response.
    Do not introduce new ideas into the answer provided by Model A, only expand on it and provide more detail and depth.

    USER'S ORIGINAL QUESTION:
    ${originalPrompt}

    MODEL A OUTPUT (expand this, do not ask for it to be repeated):
    ${modelAOutput}

    `

    return callLLM('google/gemini-2.5-pro', prompt);
}