// File for Model C
// Takes Model B's response as input and instructs LLM to refine it, and provide more nuance and complexity to the response
// Note: Model C is not restricted to a specific LLM

import { callLLM } from "../services/llm";

export async function modelC(input: string) {

    // Prompt for Model C, refines answer provided from Model B, and provides more nuance and complexity to the response
    // Note: specifically requires backticks (`) for multi-line string and interpolation of input variable
    const prompt = ` 
    
    You are a refinement specialist AI.
    Refine the answer provided from Model B, and provide more nuance and complexity to the response.

    Here is a set of rules to follow when refining the answer:
    1. Remove any redundancy in the answer, and make it more concise.
    2. Fix any inconsistencies in the answer, and make it more coherent.
    3. Improve clarity of the answer, and make it easier to understand.
    4. Do not introduce new ideas into the answer provided by Model B, only refine it and provide more nuance and complexity to the response.
    

    ${input}

    `

    return callLLM('model-c', prompt);
}