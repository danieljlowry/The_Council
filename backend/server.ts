// This is the main file, responsible for setting up the Fastify server and registering routes.

import Fastify from 'fastify';
import debateRoutes from './routes/debate';

const app = Fastify();

app.register(debateRoutes); // Register debate-related routes

app.listen({ port: 3000 }, () => {

    console.log('Server is running on http://localhost:3000');

    // Try has to be here in order to use catch (error)
    try {}

    // Error handling for server startup
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1); // Exit the process with an error code
    }
});