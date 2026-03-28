// File for Model B
// 
// Note: Model A is not restricted to a specific LLM

import { callLLM } from "../services/llm";

export async function modelB(input: string) {

    // Prompt for Model B, takes Model A's response as input and instructs LLM to expand on it 
    // Provides more detail and depth to the response, without introducing new ideas into the answer provided by Model A
    // Note: specifically requires backticks (`) for multi-line string and interpolation of input variable
    const prompt = ` 
    
    You are an implementation specialist AI. 
    Expand ONLY on the answer provided by Model A, and provide more detail and depth to the response.
    Do not introduce new ideas into the answer provided by Model A, only expand on it and provide more detail and depth.

    ${input}

    `

    return callLLM('model-B', prompt);
}