import { DEFAULT_MODEL_LINEUP, type ModelLineup } from "../types/debate";

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
