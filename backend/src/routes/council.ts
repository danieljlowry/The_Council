import type { FastifyInstance } from "fastify";
import { orchestrateDebate, orchestrateExistingCouncil } from "../services/orchestrator";
import { resolveModelLineup } from "../services/modelLineup";
import { requireAuth } from "../plugins/requireAuth";
import type { CycleCount, ModelLineup } from "../types/debate";

/**
 * Council lifecycle: create + run (legacy/demo), or run an existing council from the app.
 * Auth: Supabase access token (`sub` = owner id). Body must not send `userId`.
 */
export default async function councilRoutes(app: FastifyInstance) {
  /**
   * Creates a new council in the DB and runs the full relay (standalone / API clients).
   */
  app.post(
    "/council",
    { preHandler: requireAuth },
    async (req, res) => {
      try {
        const userId = req.userId;
        if (!userId) {
          return res.status(401).send({ error: "Unauthorized" });
        }

        const body = req.body as {
          title: string;
          prompt: string;
          cycleCount?: number;
          models?: Partial<ModelLineup>;
          modelOrder?: string[];
        };
        const { title, prompt } = body;
        if (!title || !prompt) {
          return res.status(400).send({ error: "title and prompt are required" });
        }

        const raw = body.cycleCount;
        const cycleCount: CycleCount = raw === 2 ? 2 : 1;
        const lineup = resolveModelLineup(body);
        const result = await orchestrateDebate(
          userId,
          title,
          prompt,
          cycleCount,
          lineup
        );
        res.send(result);
      } catch (error) {
        console.error("Error in POST /council:", error);
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).send({ error: message });
      }
    }
  );

  /**
   * Runs the relay for a council row created by the Next.js + Supabase flow.
   */
  app.post(
    "/council/:councilId/run",
    { preHandler: requireAuth },
    async (req, res) => {
      try {
        const userId = req.userId;
        if (!userId) {
          return res.status(401).send({ error: "Unauthorized" });
        }

        const { councilId } = req.params as { councilId: string };
        const body = req.body as {
          models?: Partial<ModelLineup>;
          modelOrder?: string[];
        };

        const result = await orchestrateExistingCouncil(
          councilId,
          userId,
          body ?? {}
        );
        res.send(result);
      } catch (error) {
        console.error("Error in POST /council/:councilId/run:", error);
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes("not found") ||
          message.includes("access denied")
        ) {
          return res.status(404).send({ error: message });
        }
        if (
          message.includes("already") ||
          message.includes("completed") ||
          message.includes("missing")
        ) {
          return res.status(409).send({ error: message });
        }
        res.status(500).send({ error: message });
      }
    }
  );
}
