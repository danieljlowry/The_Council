// Loads DATABASE_URL, OPENROUTER_API_KEY, etc. from backend/.env when running via node/tsx.
import 'dotenv/config';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import councilRoutes from './routes/council';
import debateRoutes from './routes/debate';

async function main() {
  const app = Fastify();

  // Browser requests from the Next.js dev server need CORS; restrict origins in production via CORS_ORIGIN.
  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await app.register(cors, {
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(councilRoutes);
  await app.register(debateRoutes);

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Server listening on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
