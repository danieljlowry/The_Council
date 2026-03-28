//

import { prisma } from "../database/prisma"

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

