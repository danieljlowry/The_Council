//

import type { AgentSlot } from "@prisma/client";
import { prisma } from "../database/prisma";
import type { ModelLineup } from "../types/debate";

export async function createConversation(
  userId: string,
  title: string,
  prompt: string
) {
  // Create the council (debate session)
  const council = await prisma.council.create({
    data: {
      ownerId: userId,
      title,
      primaryPrompt: prompt,
      status: "ACTIVE"
    }
  })

  // Create the four agent slots for this council
  const agents = await Promise.all([
    prisma.councilAgent.create({
      data: {
        councilId: council.id,
        slot: "CROWN",
        displayName: "Model A",
        specialty: "Initial Analysis"
      }
    }),
    prisma.councilAgent.create({
      data: {
        councilId: council.id,
        slot: "AGENT_B",
        displayName: "Model B",
        specialty: "Critique"
      }
    }),
    prisma.councilAgent.create({
      data: {
        councilId: council.id,
        slot: "AGENT_C",
        displayName: "Model C",
        specialty: "Synthesis"
      }
    }),
    prisma.councilAgent.create({
      data: {
        councilId: council.id,
        slot: "AGENT_D",
        displayName: "Model D",
        specialty: "Evaluation"
      }
    })
  ])

  // Create round 1
  const round1 = await prisma.councilRound.create({
    data: {
      councilId: council.id,
      number: 1,
      startedAt: new Date()
    }
  })

  return { council, round1, agents }
}

export async function createRound(
  councilId: string,
  roundNumber: number
) {
  return prisma.councilRound.create({
    data: {
      councilId,
      number: roundNumber,
      startedAt: new Date()
    }
  })
}

/** Persists which OpenRouter model each slot used for this council (for transcript display). */
export async function updateCouncilAgentModels(
  councilId: string,
  lineup: ModelLineup
) {
  const slots: { slot: AgentSlot; modelKey: string }[] = [
    { slot: "CROWN", modelKey: lineup.A },
    { slot: "AGENT_B", modelKey: lineup.B },
    { slot: "AGENT_C", modelKey: lineup.C },
    { slot: "AGENT_D", modelKey: lineup.D },
  ];
  await prisma.$transaction(
    slots.map((s) =>
      prisma.councilAgent.update({
        where: {
          councilId_slot: { councilId, slot: s.slot },
        },
        data: { modelKey: s.modelKey },
      })
    )
  );
}

/** Opening user prompt as the first row of the debate transcript. */
export async function saveUserMessage(
  councilId: string,
  roundId: string,
  sequence: number,
  content: string
) {
  return prisma.debateMessage.create({
    data: {
      councilId,
      roundId,
      author: "USER",
      sequence,
      content,
    },
  });
}

export async function saveMessage(
  councilId: string,
  roundId: string,
  agent: "A" | "B" | "C" | "D",
  sequence: number,
  content: any
) {
  // Map agent letters to council agent slots
  const slotMap: Record<string, "CROWN" | "AGENT_B" | "AGENT_C" | "AGENT_D"> = {
    "A": "CROWN",
    "B": "AGENT_B",
    "C": "AGENT_C",
    "D": "AGENT_D"
  }

  // Get the agent for this council and slot
  const councilAgent = await prisma.councilAgent.findFirst({
    where: {
      councilId,
      slot: slotMap[agent]
    }
  })

  // Save the message
  return prisma.debateMessage.create({
    data: {
      councilId,
      roundId,
      author: "AGENT",
      sequence,
      content: typeof content === "string" ? content : JSON.stringify(content),
      councilAgentId: councilAgent?.id
    }
  })
}

export async function saveCycle(
  councilId: string,
  roundId: string,
  cycleData: any
) {
  // Update the round with the cycle summary and completion
  return prisma.councilRound.update({
    where: { id: roundId },
    data: {
      memorySummary: cycleData.summary || "",
      completedAt: new Date()
    }
  })
}

export async function updateCouncilSummary(
  councilId: string,
  finalSummary: string
) {
  return prisma.council.update({
    where: { id: councilId },
    data: { finalSummary }
  })
}

/** Marks debate finished: summary text + COMPLETED status. */
export async function finalizeCouncilRun(
  councilId: string,
  finalSummary: string
) {
  return prisma.council.update({
    where: { id: councilId },
    data: {
      status: "COMPLETED",
      finalSummary,
    },
  });
}

export async function markRoundStarted(roundId: string) {
  return prisma.councilRound.update({
    where: { id: roundId },
    data: { startedAt: new Date() },
  });
}

/**
 * Council + agents + rounds for orchestration (owner must match).
 */
export async function getCouncilForOrchestration(
  councilId: string,
  ownerId: string
) {
  return prisma.council.findFirst({
    where: { id: councilId, ownerId },
    include: {
      agents: true,
      rounds: { orderBy: { number: "asc" } },
    },
  });
}

export async function archiveConversation(id: string) {
  return prisma.council.update({
    where: { id },
    data: { status: "ARCHIVED" }
  })
}

/** Matches the Prisma / frontend `DebateMessage` shape for API polling. */
export type CouncilMessageRow = {
  id: string;
  councilId: string;
  roundId: string;
  councilAgentId: string | null;
  author: "USER" | "AGENT";
  sequence: number;
  content: string;
  createdAt: string;
};

/**
 * Ordered messages for a council. Verifies `ownerId` matches the council owner.
 * Optional `afterSequence` returns only rows with `sequence > afterSequence` (for polling).
 */
export async function getCouncilTranscriptForOwner(
  councilId: string,
  ownerId: string,
  options?: { afterSequence?: number }
): Promise<{
  council: { id: string; title: string; primaryPrompt: string };
  messages: CouncilMessageRow[];
} | null> {
  const council = await prisma.council.findFirst({
    where: { id: councilId, ownerId },
    select: {
      id: true,
      title: true,
      primaryPrompt: true,
    },
  });
  if (!council) return null;

  const after = options?.afterSequence;
  const rows = await prisma.debateMessage.findMany({
    where: {
      councilId,
      ...(after !== undefined && after >= 0
        ? { sequence: { gt: after } }
        : {}),
    },
    orderBy: { sequence: "asc" },
  });

  const messages: CouncilMessageRow[] = rows.map((m) => ({
    id: m.id,
    councilId: m.councilId,
    roundId: m.roundId,
    councilAgentId: m.councilAgentId,
    author: m.author as "USER" | "AGENT",
    sequence: m.sequence,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return { council, messages };
}

