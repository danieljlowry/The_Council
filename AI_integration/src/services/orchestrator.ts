// This file is the core engine of the debate system, responsible for orchestrating the interactions between the different models (Model A, Model B, Model C) and the LLM API. It defines the main logic for how the models interact with each other and how they process the user's input to generate a response.

import { modelA } from "../agents/modelA";
import { modelB } from "../agents/modelB";
import { modelC } from "../agents/modelC";
import { modelD } from "../agents/modelD";

// Imports relevant functions for saving conversations, messages, and cycles to the database
import {

    createConversation,
    saveMessage,
    saveCycle

} from "./persistence";

export async function orchestrateDebate(prompt: string) {

    const conversation = await createConversation(); // Create new conversation in database 

    // Cycle 1 - Initial Response Cycle

    const a1 = await modelA(prompt); // Get response from Model A using user's prompt as input
    await saveMessage(conversation.id, "A", 1, a1); // Save Model A's response to database

    const b1 = await modelB(a1); // Get response from Model B using Model A's response as input
    await saveMessage(conversation.id, "B", 1, b1); // Save Model B's response to database

    const c1 = await modelC(b1); // Get response from Model C using Model B's response as input
    await saveMessage(conversation.id, "C", 1, c1); // Save Model C's response to database

    const d1 = JSON.parse(await modelD(c1)); // Get response from Model D using Model C's response as input and parse it as JSON
    await saveCycle(conversation.id, 1, d1); // Save Model D's response to database

    return {

        final_answer: c1,
        final_summary: d1.summary,
        final_evaluation: d1.evaluation,
        improvements: d1.suggested_improvements

    }

/* 
    // Cycle 2 - Refinement Cycle

    // "OriginalPrompt" = user's original prompt
    const refinedInput = `
    
    OriginalPrompt: ${prompt}

    PreviousCycleSummary: ${d1.summary}
    Issues: ${JSON.stringify(d1.issues)}
    Evaluation: ${d1.evaluation}
    SuggestedImprovements: ${JSON.stringify(d1.suggested_improvements)}
    
    `
    const a2 = await modelA(refinedInput); // Get response from Model A using refined input as input
    await saveMessage(conversation.id, "A", 2, a2); // Save Model A's response to database

    const b2 = await modelB(a2); // Get response from Model B using Model A's response as input
    await saveMessage(conversation.id, "B", 2, b2); // Save Model B's response to database

    const c2 = await modelC(b2); // Get response from Model C using Model B's response as input
    await saveMessage(conversation.id, "C", 2, c2); // Save Model C's response to database

    const d2 = JSON.parse(await modelD(c2)); // Get response from Model D using Model C's response as input and parse it as JSON
    await saveCycle(conversation.id, 2, d2); // Save Model D's response to database


    // Final output after 2 cycles of debate, includes:
    // final answer from Model C, and final summary, evaluation, and suggested improvements from Model D
    return {

        final_answer: c2,
        final_summary: d2.summary,
        final_evaluation: d2.evaluation,
        improvements: d2.suggested_improvements

    }
*/


}

