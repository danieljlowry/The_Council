// This file relates to the handling of debate-related routes in the backend.

import {FastifyInstance} from 'fastify'; // Create Fastify instance type for route definitions
import {runDebate} from '../services/orchestrator'; // Import the debate logic from the orchestrator service

export default async function (app: FastifyInstance) {

  // Define POST route for /debate endpoint, handles incoming debate requests
  app.post('/debate', async (req, res) => {
    try {

      const { prompt } = req.body as {prompt: string}; // Extract user prompt from request body, prompt set to string type
      const result =  await runDebate(prompt); // Run debate logic with user provided prompt
      res.send(result); // Send debate result back to user

    }

    // Error handler: Catch any errors during debate endpoint processing
    catch (error) {
      console.error('Error in /debate route:', error);
      res.status(500).send({ error: 'An error occurred while processing the debate.' });
    }

  });

}

