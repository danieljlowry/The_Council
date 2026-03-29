import type { FastifyInstance } from "fastify";
import { getCouncilTranscriptForOwner } from "../services/persistence";
import { requireAuth } from "../plugins/requireAuth";

/**
 * Debate transcript / chat messages for a council (read-only polling).
 * Auth: Supabase access token; owner check uses `sub` from the JWT.
 */
export default async function debateRoutes(app: FastifyInstance) {
  app.get(
    "/debate/:councilId/messages",
    { preHandler: requireAuth },
    async (req, res) => {
      try {
        const userId = req.userId;
        if (!userId) {
          return res.status(401).send({ error: "Unauthorized" });
        }

        const { councilId } = req.params as { councilId: string };
        const afterRaw = (req.query as { after?: string }).after;
        const afterSequence =
          afterRaw !== undefined && afterRaw !== ""
            ? Number(afterRaw)
            : undefined;

        const transcript = await getCouncilTranscriptForOwner(
          councilId,
          userId,
          {
            afterSequence:
              afterSequence !== undefined && !Number.isNaN(afterSequence)
                ? afterSequence
                : undefined,
          }
        );
        if (!transcript) {
          return res.status(404).send({ error: "Council not found" });
        }
        res.send(transcript);
      } catch (error) {
        console.error("Error in GET /debate/:councilId/messages:", error);
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).send({ error: message });
      }
    }
  );
}
