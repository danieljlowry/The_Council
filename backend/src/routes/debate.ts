// This file relates to the handling of debate-related routes in the backend.

import {FastifyInstance} from 'fastify'; // Create Fastify instance type for route definitions
import { orchestrateDebate } from '../services/orchestrator'; // Import the debate logic from the orchestrator service
import { getCouncilTranscriptForOwner } from '../services/persistence';
import { resolveModelLineup } from '../services/modelLineup';
import type { CycleCount, ModelLineup } from '../types/debate';

export default async function (app: FastifyInstance) {

  /**
   * Ordered transcript (user prompt + agent messages) for a council.
   * Query: userId must match the council owner (same id as POST /debate).
   */
  app.get('/debate/:councilId/messages', async (req, res) => {
    try {
      const { councilId } = req.params as { councilId: string };
      const userId = (req.query as { userId?: string }).userId;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).send({ error: 'Query parameter userId is required' });
      }
      const transcript = await getCouncilTranscriptForOwner(councilId, userId);
      if (!transcript) {
        return res.status(404).send({ error: 'Council not found' });
      }
      res.send(transcript);
    } catch (error) {
      console.error('Error in GET /debate/:councilId/messages:', error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).send({ error: message });
    }
  });

  // Define POST route for /debate endpoint, handles incoming debate requests
  app.post('/debate', async (req, res) => {
    try {

      const body = req.body as {
        userId: string;
        title: string;
        prompt: string;
        /** 1 = exploration only; 2 = exploration then refinement round. Defaults to 1. */
        cycleCount?: number;
        /** Per-role OpenRouter model ids. Omitted slots use defaults. */
        models?: Partial<ModelLineup>;
        /** Four model ids in order [A, B, C, D]. If set, overrides `models`. */
        modelOrder?: string[];
      };
      const { userId, title, prompt } = body;
      const raw = body.cycleCount;
      const cycleCount: CycleCount = raw === 2 ? 2 : 1;

      const lineup = resolveModelLineup(body);
      const result = await orchestrateDebate(userId, title, prompt, cycleCount, lineup);
      res.send(result); // Send debate result back to user

    }

    // Error handler: Catch any errors during debate endpoint processing
    catch (error) {
      console.error('Error in /debate route:', error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).send({ error: message });
    }

  });

}

