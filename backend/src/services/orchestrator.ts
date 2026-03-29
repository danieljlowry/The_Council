// Core debate engine: models A→D per round; cycle 1 explores, cycle 2 refines using cycle 1 outputs.

import { modelA } from "../agents/modelA";
import { modelB } from "../agents/modelB";
import { modelC } from "../agents/modelC";
import { modelD } from "../agents/modelD";

import {
    DEFAULT_MODEL_LINEUP,
    type CycleCount,
    type CyclePhase,
    type ModelLineup,
} from "../types/debate";

import {
    createConversation,
    createRound,
    saveCycle,
    saveMessage,
    saveUserMessage,
    updateCouncilAgentModels,
} from "./persistence";

type EvaluatorJson = {
    summary?: string;
    issues?: unknown;
    evaluation?: string;
    suggested_improvements?: unknown;
};

function buildCycle2ModelAInput(
    originalPrompt: string,
    cycle1ModelC: string,
    d1: EvaluatorJson
): string {
    return `
USER'S ORIGINAL QUESTION:
${originalPrompt}

FINAL SYNTHESIZED ANSWER FROM CYCLE 1 (Model C — reinforce and improve this, do not discard it):
${cycle1ModelC}

EVALUATION FROM CYCLE 1 (Model D):
Summary: ${d1.summary ?? ""}
Issues: ${JSON.stringify(d1.issues ?? [])}
Evaluation: ${d1.evaluation ?? ""}
Suggested improvements: ${JSON.stringify(d1.suggested_improvements ?? [])}
`.trim();
}

function parseModelDResponse(raw: string): EvaluatorJson {
    try {
        return JSON.parse(raw) as EvaluatorJson;
    } catch (parseError) {
        console.error("Failed to parse Model D response as JSON:", raw);
        throw new Error(`Model D response is not valid JSON: ${raw}`);
    }
}

export async function orchestrateDebate(
    userId: string,
    title: string,
    prompt: string,
    cycleCount: CycleCount = 1,
    lineup: ModelLineup = DEFAULT_MODEL_LINEUP
) {
    const { council, round1 } = await createConversation(userId, title, prompt);

    await updateCouncilAgentModels(council.id, lineup);

    let sequence = 1;
    await saveUserMessage(council.id, round1.id, sequence++, prompt);

    const runRound = async (
        roundId: string,
        phase: CyclePhase,
        modelAInput: string,
        /** Cycle 1 Model B text — passed into Model C in refinement so it can verify sources from exploration. */
        cycle1ModelBOut?: string
    ) => {
        const aOut = await modelA(modelAInput, phase, lineup.A);
        await saveMessage(council.id, roundId, "A", sequence++, aOut);

        const bOut = await modelB(prompt, aOut, phase, lineup.B);
        await saveMessage(council.id, roundId, "B", sequence++, bOut);

        const cOut = await modelC(
            prompt,
            bOut,
            phase,
            phase === "refinement" ? cycle1ModelBOut : undefined,
            lineup.C
        );
        await saveMessage(council.id, roundId, "C", sequence++, cOut);

        const dRaw = await modelD(prompt, cOut, phase, lineup.D);
        const dOut = parseModelDResponse(dRaw);
        await saveMessage(council.id, roundId, "D", sequence++, dOut);

        await saveCycle(council.id, roundId, dOut);

        return { aOut, bOut, cOut, dOut };
    };

    const cycle1 = await runRound(round1.id, "exploration", prompt);

    if (cycleCount === 1) {
        return {
            councilId: council.id,
            cyclesCompleted: 1 as const,
            modelsUsed: lineup,
            totalTranscriptMessages: sequence - 1,
            final_answer: cycle1.cOut,
            final_summary: cycle1.dOut.summary,
            final_evaluation: cycle1.dOut.evaluation,
            improvements: cycle1.dOut.suggested_improvements,
        };
    }

    const round2Record = await createRound(council.id, 2);
    const refinementInput = buildCycle2ModelAInput(
        prompt,
        cycle1.cOut,
        cycle1.dOut
    );
    const cycle2 = await runRound(
        round2Record.id,
        "refinement",
        refinementInput,
        cycle1.bOut
    );

    return {
        councilId: council.id,
        cyclesCompleted: 2 as const,
        modelsUsed: lineup,
        totalTranscriptMessages: sequence - 1,
        final_answer: cycle2.cOut,
        final_summary: cycle2.dOut.summary,
        final_evaluation: cycle2.dOut.evaluation,
        improvements: cycle2.dOut.suggested_improvements,
    };
}
