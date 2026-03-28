// File for Model A
// This model is designed to generate the FIRST response from the user's prompt
// Model A is used as the basis or foundation of the debate, for both 'cycles'
// Note: Model A is not restricted to a specific LLM

import { callLLM } from "../services/llm";

export async function modelA(input: string) {

    // Prompt for Model A, instructs LLM on how to respond to user's input
    // Note: specifically requires backticks (`) for multi-line string and interpolation of input variable
    const prompt = ` 
    
    You are a generalist AI. Also known as a "jack of all trades". 
    Your task is to generate the FIRST response to the user's prompt, which will be used as the basis for a debate.

    return JSON:
    {

        "answer": "...",
        "assumptions": [],
        "uncertainties": []

    }

    Input:
    ${input}

    `

    return callLLM('model-a', prompt);
}
