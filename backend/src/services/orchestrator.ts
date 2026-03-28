// This file is the core engine of the debate system, responsible for orchestrating the interactions between the different models (Model A, Model B, Model C) and the LLM API. It defines the main logic for how the models interact with each other and how they process the user's input to generate a response.

import { modelA } from "../agents/modelA";
import { modelB } from "../agents/modelB";
import { modelC } from "../agents/modelC";
import { modelD } from "../agents/modelD";

// Imports relevant functions for saving conversations, messages, and cycles to the database
import {
    createConversation,
    createRound,
    saveMessage,
    saveCycle,
    updateCouncilSummary
} from "./persistence";

export async function orchestrateDebate(
    userId: string,
    title: string,
    prompt: string
) {
    // Create new council (debate session) in database
    const { council, round1 } = await createConversation(userId, title, prompt);

    // Cycle 1 - Initial Response Cycle

    // Track message sequence within the round
    let sequence = 1;

    const a1 = await modelA(prompt); // Get response from Model A using user's prompt as input
    await saveMessage(council.id, round1.id, "A", sequence++, a1); // Save Model A's response to database

    const b1 = await modelB(prompt, a1); // B needs original question + A's output
    await saveMessage(council.id, round1.id, "B", sequence++, b1); // Save Model B's response to database

    const c1 = await modelC(prompt, b1); // C needs original question + B's output
    await saveMessage(council.id, round1.id, "C", sequence++, c1); // Save Model C's response to database

    const d1Response = await modelD(prompt, c1);
    let d1;
    try {
        d1 = JSON.parse(d1Response);
    } catch (parseError) {
        console.error('Failed to parse Model D response as JSON:', d1Response);
        throw new Error(`Model D response is not valid JSON: ${d1Response}`);
    }
    await saveMessage(council.id, round1.id, "D", sequence++, d1); // Save Model D's response to database

    // Complete cycle 1 and store summary
    await saveCycle(council.id, round1.id, d1);

    return {
        councilId: council.id,
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

    const b2 = await modelB(prompt, a2);
    await saveMessage(conversation.id, "B", 2, b2); // Save Model B's response to database

    const c2 = await modelC(prompt, b2);
    await saveMessage(conversation.id, "C", 2, c2); // Save Model C's response to database

    const d2 = JSON.parse(await modelD(prompt, c2));
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

