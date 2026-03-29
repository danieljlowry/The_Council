export type CouncilStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type AgentSlot = "CROWN" | "AGENT_B" | "AGENT_C" | "AGENT_D";
export type DebateMessageAuthor = "USER" | "AGENT";

export interface Profile {
  id: string;
  email: string | null;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Council {
  id: string;
  ownerId: string;
  title: string;
  primaryPrompt: string;
  status: CouncilStatus;
  finalSummary: string | null;
  createdAt: string;
  updatedAt: string;
  agents?: CouncilAgent[];
  rounds?: CouncilRound[];
}

export interface CouncilAgent {
  id: string;
  councilId: string;
  slot: AgentSlot;
  displayName: string;
  specialty: string;
  modelKey: string | null;
  createdAt: string;
}

export interface CouncilRound {
  id: string;
  councilId: string;
  number: number;
  userFeedback: string | null;
  memorySummary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  messages?: DebateMessage[];
}

export interface DebateMessage {
  id: string;
  councilId: string;
  roundId: string;
  councilAgentId: string | null;
  author: DebateMessageAuthor;
  sequence: number;
  content: string;
  createdAt: string;
}
