// Core debate engine: models A→D per round; cycle 1 explores, cycle 2 refines using cycle 1 outputs.

import { prisma } from "../database/prisma";
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
    finalizeCouncilRun,
    getCouncilForOrchestration,
    markRoundStarted,
    saveCycle,
    saveMessage,
    saveUserMessage,
    updateCouncilAgentModels,
} from "./persistence";
import { lineupFromCouncilAgentRows, resolveModelLineup } from "./modelLineup";

type EvaluatorJson = {
    summary?: string;
    issues?: unknown;
    evaluation?: string;
    suggested_improvements?: unknown;
};

/** Model A is prompted to return JSON with answer / assumptions / uncertainties. */
type ModelAJson = {
    answer?: string;
    assumptions?: unknown;
    uncertainties?: unknown;
};

type RelayResult = {
    councilId: string;
    cyclesCompleted: 1 | 2;
    modelsUsed: ModelLineup;
    totalTranscriptMessages: number;
    final_answer: string;
    final_summary?: string;
    final_evaluation?: string;
    improvements?: unknown;
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

/**
 * Models often wrap JSON in ```json ... ``` or add preamble; extract the object before parse.
 */
function extractJsonObjectString(raw: string): string {
    let s = raw.trim();
    if (s.startsWith("```")) {
        const afterOpen = s.indexOf("\n");
        if (afterOpen !== -1) {
            s = s.slice(afterOpen + 1);
        } else {
            s = s.replace(/^```[a-z]*\s*/i, "");
        }
        const close = s.lastIndexOf("```");
        if (close !== -1) {
            s = s.slice(0, close);
        }
        s = s.trim();
    }
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
        return s.slice(start, end + 1);
    }
    return s;
}

/**
 * When max_tokens cuts the model off mid-string, JSON.parse fails. Recover the partial summary.
 */
function salvageTruncatedEvaluatorJson(extracted: string): EvaluatorJson | null {
    const t = extracted.trim();
    if (!t.startsWith("{")) {
        return null;
    }
    const key = '"summary"';
    const k = t.indexOf(key);
    if (k === -1) {
        return null;
    }
    const after = t.slice(k + key.length);
    const colon = after.indexOf(":");
    if (colon === -1) {
        return null;
    }
    const rest = after.slice(colon + 1).trimStart();
    if (!rest.startsWith('"')) {
        return null;
    }
    const body = rest.slice(1);
    let out = "";
    let escaped = false;
    for (let j = 0; j < body.length; j++) {
        const ch = body[j];
        if (escaped) {
            if (ch === "n") {
                out += "\n";
            } else if (ch === "r") {
                out += "\r";
            } else if (ch === "t") {
                out += "\t";
            } else if (ch === '"' || ch === "\\") {
                out += ch;
            } else {
                out += ch;
            }
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            escaped = true;
            continue;
        }
        if (ch === '"') {
            return null;
        }
        out += ch;
    }
    if (escaped) {
        out += "\\";
    }
    if (out.length === 0) {
        return null;
    }
    return {
        summary: out.trimEnd(),
        issues: [
            "Model D JSON was truncated (token limit). Raise OPENROUTER_EVALUATOR_MAX_TOKENS or OPENROUTER_MAX_TOKENS_OVERRIDE_CEILING.",
        ],
        evaluation:
            "Only a partial summary could be recovered because the evaluator response was cut off mid-JSON.",
        suggested_improvements: [],
    };
}

function parseModelDResponse(raw: string): EvaluatorJson {
    const extracted = extractJsonObjectString(raw);
    try {
        return JSON.parse(extracted) as EvaluatorJson;
    } catch (parseError) {
        const salvaged = salvageTruncatedEvaluatorJson(extracted);
        if (salvaged) {
            console.warn(
                "Model D returned truncated JSON; using salvaged summary only."
            );
            return salvaged;
        }
        console.error("Failed to parse Model D response as JSON:", raw);
        throw new Error(
            `Model D response is not valid JSON: ${extracted.slice(0, 500)}`
        );
    }
}

/** Human-readable log text for the council UI (structured fields are still passed to saveCycle separately). */
function formatEvaluatorForLog(d: EvaluatorJson): string {
    const blocks: string[] = [];

    if (typeof d.summary === "string" && d.summary.trim()) {
        blocks.push("Summary", "", d.summary.trim());
    }

    const issues = d.issues;
    if (Array.isArray(issues) && issues.length > 0) {
        blocks.push("", "Issues", "");
        for (const item of issues) {
            blocks.push(`• ${String(item)}`);
        }
    } else if (typeof issues === "string" && issues.trim()) {
        blocks.push("", "Issues", "", issues.trim());
    }

    if (typeof d.evaluation === "string" && d.evaluation.trim()) {
        blocks.push("", "Evaluation", "", d.evaluation.trim());
    }

    const sug = d.suggested_improvements;
    if (Array.isArray(sug) && sug.length > 0) {
        blocks.push("", "Suggested improvements", "");
        for (const item of sug) {
            blocks.push(`• ${String(item)}`);
        }
    } else if (typeof sug === "string" && sug.trim()) {
        blocks.push("", "Suggested improvements", "", sug.trim());
    }

    return blocks.join("\n").trim();
}

function normalizeStringList(v: unknown): string[] {
    if (Array.isArray(v)) {
        return v.map((x) => String(x));
    }
    if (typeof v === "string" && v.trim()) {
        return [v.trim()];
    }
    return [];
}

function parseModelAResponse(raw: string): ModelAJson {
    try {
        const extracted = extractJsonObjectString(raw);
        const o = JSON.parse(extracted) as Record<string, unknown>;
        return {
            answer: typeof o.answer === "string" ? o.answer : undefined,
            assumptions: o.assumptions,
            uncertainties: o.uncertainties,
        };
    } catch {
        return { answer: raw };
    }
}

function formatModelAForLog(d: ModelAJson): string {
    const blocks: string[] = [];
    if (typeof d.answer === "string" && d.answer.trim()) {
        blocks.push(d.answer.trim());
    }
    const assumptions = normalizeStringList(d.assumptions);
    if (assumptions.length > 0) {
        blocks.push("", "Assumptions", "");
        for (const item of assumptions) {
            blocks.push(`• ${item}`);
        }
    }
    const uncertainties = normalizeStringList(d.uncertainties);
    if (uncertainties.length > 0) {
        blocks.push("", "Uncertainties", "");
        for (const item of uncertainties) {
            blocks.push(`• ${item}`);
        }
    }
    return blocks.join("\n").trim();
}

/** Text passed to Model B/C chain: structured fields, not raw JSON. */
function modelAOutputForDownstream(d: ModelAJson, raw: string): string {
    const formatted = formatModelAForLog(d);
    if (formatted) {
        return formatted;
    }
    return raw.trim();
}

async function executeDebateRelay(params: {
    councilId: string;
    prompt: string;
    cycleCount: CycleCount;
    lineup: ModelLineup;
    round1Id: string;
    /** When set and `cycleCount === 2`, use this row instead of creating a new round 2. */
    existingRound2Id?: string | null;
    /** Sequence number for the first agent message (user message must already be saved). */
    sequenceStart: number;
}): Promise<RelayResult> {
    const {
        councilId,
        prompt,
        cycleCount,
        lineup,
        round1Id,
        existingRound2Id,
        sequenceStart,
    } = params;

    let sequence = sequenceStart;

    const runRound = async (
        roundId: string,
        phase: CyclePhase,
        modelAInput: string,
        cycle1ModelBOut?: string
    ) => {
        const aRaw = await modelA(modelAInput, phase, lineup.A);
        const aParsed = parseModelAResponse(aRaw);
        const aOut = modelAOutputForDownstream(aParsed, aRaw);
        await saveMessage(
            councilId,
            roundId,
            "A",
            sequence++,
            formatModelAForLog(aParsed) || aOut
        );

        const bOut = await modelB(prompt, aOut, phase, lineup.B);
        await saveMessage(councilId, roundId, "B", sequence++, bOut);

        const cOut = await modelC(
            prompt,
            bOut,
            phase,
            phase === "refinement" ? cycle1ModelBOut : undefined,
            lineup.C
        );
        await saveMessage(councilId, roundId, "C", sequence++, cOut);

        const dRaw = await modelD(prompt, aOut, bOut, cOut, phase, lineup.D);
        const dOut = parseModelDResponse(dRaw);
        await saveMessage(
            councilId,
            roundId,
            "D",
            sequence++,
            formatEvaluatorForLog(dOut)
        );

        await saveCycle(councilId, roundId, dOut);

        return { aOut, bOut, cOut, dOut };
    };

    const cycle1 = await runRound(round1Id, "exploration", prompt);

    if (cycleCount === 1) {
        const summaryText =
            (typeof cycle1.dOut.summary === "string"
                ? cycle1.dOut.summary
                : null) ?? cycle1.cOut;
        await finalizeCouncilRun(councilId, summaryText);

        return {
            councilId,
            cyclesCompleted: 1,
            modelsUsed: lineup,
            totalTranscriptMessages: sequence - 1,
            final_answer: cycle1.cOut,
            final_summary: cycle1.dOut.summary,
            final_evaluation: cycle1.dOut.evaluation,
            improvements: cycle1.dOut.suggested_improvements,
        };
    }

    let round2Id: string;
    if (existingRound2Id) {
        round2Id = existingRound2Id;
        await markRoundStarted(round2Id);
    } else {
        const round2Record = await createRound(councilId, 2);
        round2Id = round2Record.id;
    }

    const refinementInput = buildCycle2ModelAInput(
        prompt,
        cycle1.cOut,
        cycle1.dOut
    );
    const cycle2 = await runRound(
        round2Id,
        "refinement",
        refinementInput,
        cycle1.bOut
    );

    const summaryText =
        (typeof cycle2.dOut.summary === "string"
            ? cycle2.dOut.summary
            : null) ?? cycle2.cOut;
    await finalizeCouncilRun(councilId, summaryText);

    return {
        councilId,
        cyclesCompleted: 2,
        modelsUsed: lineup,
        totalTranscriptMessages: sequence - 1,
        final_answer: cycle2.cOut,
        final_summary: cycle2.dOut.summary,
        final_evaluation: cycle2.dOut.evaluation,
        improvements: cycle2.dOut.suggested_improvements,
    };
}

export async function orchestrateDebate(
    userId: string,
    title: string,
    prompt: string,
    cycleCount: CycleCount = 1,
    lineup: ModelLineup = { ...DEFAULT_MODEL_LINEUP }
) {
    const { council, round1 } = await createConversation(userId, title, prompt);

    await updateCouncilAgentModels(council.id, lineup);

    let sequence = 1;
    await saveUserMessage(council.id, round1.id, sequence++, prompt);

    return executeDebateRelay({
        councilId: council.id,
        prompt,
        cycleCount,
        lineup,
        round1Id: round1.id,
        existingRound2Id: null,
        sequenceStart: sequence,
    });
}

/**
 * Runs the relay for a council that already exists (created by the Next.js + Supabase flow).
 * Uses agents' stored `model_key` values unless the request overrides them via `models` / `modelOrder`.
 */
export async function orchestrateExistingCouncil(
    councilId: string,
    ownerId: string,
    body: { models?: Partial<ModelLineup>; modelOrder?: string[] }
): Promise<RelayResult> {
    const council = await getCouncilForOrchestration(councilId, ownerId);
    if (!council) {
        throw new Error("Council not found or access denied");
    }
    if (council.status === "COMPLETED") {
        throw new Error("Council already completed");
    }

    const existingMessages = await prisma.debateMessage.count({
        where: { councilId },
    });
    if (existingMessages > 0) {
        throw new Error(
            "Council already has debate messages; cannot start a new run"
        );
    }

    const rounds = council.rounds;
    if (rounds.length === 0) {
        throw new Error("Council has no rounds configured");
    }

    const cycleCount: CycleCount = rounds.length >= 2 ? 2 : 1;
    const round1 = rounds.find((r) => r.number === 1);
    if (!round1) {
        throw new Error("Round 1 is missing for this council");
    }

    const round2 = rounds.find((r) => r.number === 2);
    if (cycleCount === 2 && !round2) {
        throw new Error("Round 2 is missing but two cycles were requested");
    }

    let lineup: ModelLineup;
    if (body.modelOrder !== undefined || body.models !== undefined) {
        lineup = resolveModelLineup(body);
    } else {
        lineup = lineupFromCouncilAgentRows(council.agents);
    }

    await markRoundStarted(round1.id);
    await prisma.council.update({
        where: { id: councilId },
        data: { status: "ACTIVE" },
    });

    const prompt = council.primaryPrompt;
    let sequence = 1;
    await saveUserMessage(councilId, round1.id, sequence++, prompt);

    return executeDebateRelay({
        councilId,
        prompt,
        cycleCount,
        lineup,
        round1Id: round1.id,
        existingRound2Id: round2?.id ?? null,
        sequenceStart: sequence,
    });
}
