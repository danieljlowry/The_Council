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

const slotToLineupKey: Record<AgentSlot, keyof ModelLineup> = {
  CROWN: "A",
  AGENT_B: "B",
  AGENT_C: "C",
  AGENT_D: "D",
};

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

export async function archiveConversation(id: string) {
  return prisma.council.update({
    where: { id },
    data: { status: "ARCHIVED" }
  })
}

export type TranscriptMessage = {
  id: string;
  sequence: number;
  author: "USER" | "AGENT";
  /** Council role for agent rows; null for the user prompt. */
  role: "A" | "B" | "C" | "D" | null;
  roundNumber: number;
  /** exploration = round 1, refinement = round 2 */
  phase: "exploration" | "refinement";
  modelKey: string | null;
  displayName: string | null;
  content: string;
  createdAt: Date;
};

/**
 * Ordered messages for a council (user + agents), for a future chat-style UI.
 * Verifies `ownerId` matches the council owner.
 */
export async function getCouncilTranscriptForOwner(
  councilId: string,
  ownerId: string
): Promise<{ council: { id: string; title: string; primaryPrompt: string }; messages: TranscriptMessage[] } | null> {
  const council = await prisma.council.findFirst({
    where: { id: councilId, ownerId },
    select: {
      id: true,
      title: true,
      primaryPrompt: true,
    },
  });
  if (!council) return null;

  const rows = await prisma.debateMessage.findMany({
    where: { councilId },
    orderBy: { sequence: "asc" },
    include: {
      round: { select: { number: true } },
      councilAgent: {
        select: { slot: true, displayName: true, modelKey: true },
      },
    },
  });

  const messages: TranscriptMessage[] = rows.map((m) => {
    const roundNumber = m.round.number;
    const phase: "exploration" | "refinement" =
      roundNumber >= 2 ? "refinement" : "exploration";
    const slot = m.councilAgent?.slot ?? null;
    const role =
      m.author === "USER"
        ? null
        : slot
          ? slotToLineupKey[slot]
          : null;
    return {
      id: m.id,
      sequence: m.sequence,
      author: m.author as "USER" | "AGENT",
      role,
      roundNumber,
      phase,
      modelKey: m.councilAgent?.modelKey ?? null,
      displayName: m.councilAgent?.displayName ?? null,
      content: m.content,
      createdAt: m.createdAt,
    };
  });

  return { council, messages };
}

