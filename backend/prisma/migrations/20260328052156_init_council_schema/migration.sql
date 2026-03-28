-- CreateEnum
CREATE TYPE "CouncilStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentSlot" AS ENUM ('CROWN', 'AGENT_B', 'AGENT_C', 'AGENT_D');

-- CreateEnum
CREATE TYPE "DebateMessageAuthor" AS ENUM ('USER', 'AGENT');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "councils" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "primary_prompt" TEXT NOT NULL,
    "status" "CouncilStatus" NOT NULL DEFAULT 'DRAFT',
    "final_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "councils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_agents" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "slot" "AgentSlot" NOT NULL,
    "display_name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "model_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "council_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "council_rounds" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "user_feedback" TEXT,
    "memory_summary" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "council_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debate_messages" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "council_agent_id" UUID,
    "author" "DebateMessageAuthor" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debate_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "councils_owner_id_idx" ON "councils"("owner_id");

-- CreateIndex
CREATE INDEX "council_agents_council_id_idx" ON "council_agents"("council_id");

-- CreateIndex
CREATE UNIQUE INDEX "council_agents_council_id_slot_key" ON "council_agents"("council_id", "slot");

-- CreateIndex
CREATE INDEX "council_rounds_council_id_idx" ON "council_rounds"("council_id");

-- CreateIndex
CREATE UNIQUE INDEX "council_rounds_council_id_number_key" ON "council_rounds"("council_id", "number");

-- CreateIndex
CREATE INDEX "debate_messages_round_id_sequence_idx" ON "debate_messages"("round_id", "sequence");

-- CreateIndex
CREATE INDEX "debate_messages_council_id_idx" ON "debate_messages"("council_id");

-- AddForeignKey
ALTER TABLE "councils" ADD CONSTRAINT "councils_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_agents" ADD CONSTRAINT "council_agents_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "council_rounds" ADD CONSTRAINT "council_rounds_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "council_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_messages" ADD CONSTRAINT "debate_messages_council_agent_id_fkey" FOREIGN KEY ("council_agent_id") REFERENCES "council_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
