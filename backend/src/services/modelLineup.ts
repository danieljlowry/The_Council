import type { AgentSlot } from "@prisma/client";
import { DEFAULT_MODEL_LINEUP, type ModelLineup } from "../types/debate";

const slotToLineupKey: Record<AgentSlot, keyof ModelLineup> = {
    CROWN: "A",
    AGENT_B: "B",
    AGENT_C: "C",
    AGENT_D: "D",
};

/** Stable relay order: position 0 → Model A … position 3 → Model D (evaluator). */
const SLOT_RELAY_ORDER: AgentSlot[] = [
    "CROWN",
    "AGENT_B",
    "AGENT_C",
    "AGENT_D",
];

/**
 * Builds a lineup from Prisma `council_agents` rows (from the setup UI).
 * Order is by slot (relay order), not row order from the DB.
 * Slots without a valid OpenRouter-style id (`provider/model`) keep defaults.
 */
export function lineupFromCouncilAgentRows(
    agents: { slot: AgentSlot; modelKey: string | null }[]
): ModelLineup {
    const sorted = [...agents].sort(
        (a, b) =>
            SLOT_RELAY_ORDER.indexOf(a.slot) - SLOT_RELAY_ORDER.indexOf(b.slot)
    );
    const lineup: ModelLineup = { ...DEFAULT_MODEL_LINEUP };
    for (const a of sorted) {
        const key = slotToLineupKey[a.slot];
        const mk = a.modelKey?.trim();
        if (mk && mk.includes("/")) {
            lineup[key] = mk;
        }
    }
    return lineup;
}

function trimId(v: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
}

function assertOpenRouterModelId(id: string, slot: keyof ModelLineup): void {
    if (!id.includes("/")) {
        throw new Error(
            `Invalid model id for slot ${slot}: "${id}" — use OpenRouter format, e.g. "openai/gpt-4o-mini"`
        );
    }
}

/**
 * Resolves request body fields into a full ModelLineup.
 * - `modelOrder`: exactly four OpenRouter ids in order [A, B, C, D].
 * - `models`: partial or full { A, B, C, D }; omitted slots use defaults.
 * - Neither: all defaults.
 */
export function resolveModelLineup(body: {
    models?: Partial<ModelLineup>;
    modelOrder?: string[];
}): ModelLineup {
    if (body.modelOrder !== undefined) {
        if (!Array.isArray(body.modelOrder) || body.modelOrder.length !== 4) {
            throw new Error(
                "modelOrder must be an array of exactly 4 OpenRouter model ids in order [A, B, C, D]"
            );
        }
        const ids = body.modelOrder.map((raw, i) => {
            const t = trimId(raw);
            if (!t) {
                throw new Error(`modelOrder[${i}] is empty or not a string`);
            }
            return t;
        });
        const lineup: ModelLineup = {
            A: ids[0],
            B: ids[1],
            C: ids[2],
            D: ids[3],
        };
        (["A", "B", "C", "D"] as const).forEach((slot) => {
            assertOpenRouterModelId(lineup[slot], slot);
        });
        return lineup;
    }

    if (body.models && typeof body.models === "object") {
        const m = body.models;
        const lineup: ModelLineup = {
            A: trimId(m.A) ?? DEFAULT_MODEL_LINEUP.A,
            B: trimId(m.B) ?? DEFAULT_MODEL_LINEUP.B,
            C: trimId(m.C) ?? DEFAULT_MODEL_LINEUP.C,
            D: trimId(m.D) ?? DEFAULT_MODEL_LINEUP.D,
        };
        (["A", "B", "C", "D"] as const).forEach((slot) => {
            assertOpenRouterModelId(lineup[slot], slot);
        });
        return lineup;
    }

    return { ...DEFAULT_MODEL_LINEUP };
}
