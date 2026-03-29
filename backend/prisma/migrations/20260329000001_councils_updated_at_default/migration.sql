-- PostgREST inserts do not run Prisma @updatedAt; NOT NULL updated_at needs a default or an explicit value in the client.
ALTER TABLE "councils" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
