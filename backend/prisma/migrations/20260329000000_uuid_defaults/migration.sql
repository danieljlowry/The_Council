-- Supabase/PostgREST inserts omit `id`; Prisma @default(uuid()) only applies when using Prisma Client.
-- Without DB defaults, inserts fail with 23502 (null violates not-null on id).

ALTER TABLE "councils" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "council_agents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "council_rounds" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "debate_messages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
