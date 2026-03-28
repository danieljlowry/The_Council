// File for Model D
// Takes Model C's response as input
// 
// Note: Model D is not restricted to a specific LLM

import { callLLM } from "../services/llm";

export async function modelD(input: string) {

    // Prompt for Model D
    // Note: specifically requires backticks (`) for multi-line string and interpolation of input variable
    const prompt = ` 
    
    You are a critical evaluator and summarizer AI.
    Your task is to analyze the answer provided by Model C under the following criteria:
    1. Summarize the answer provided by Model C in a concise and clear manner.
    2. Identify any issues or weaknesses in the answer provided by Model C, and provide a critical evaluation of the answer.
    3. Suggest any improvements or refinements that could be made to the answer provided by Model C, based on your critical evaluation of the answer.

    Return JSON:
    {

        "summary": "...",
        "issues": [],
        "evaluation": "...",
        "suggested_improvements": "[]"

    }   

    ${input}

    `

    return callLLM('model-d', prompt);
}