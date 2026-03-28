// This file relates to the handling of debate-related routes in the backend.

import {FastifyInstance} from 'fastify'; // Create Fastify instance type for route definitions
import { orchestrateDebate } from '../services/orchestrator'; // Import the debate logic from the orchestrator service

export default async function (app: FastifyInstance) {

  // Define POST route for /debate endpoint, handles incoming debate requests
  app.post('/debate', async (req, res) => {
    try {

      const { userId, title, prompt } = req.body as { userId: string; title: string; prompt: string }; // Extract userId, title, and prompt from request body
      const result = await orchestrateDebate(userId, title, prompt); // Run debate logic with all required parameters
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

