import { createClient } from "@/utils/supabase/client";
import type {
  AgentSlot,
  Council,
  CouncilAgent,
  CouncilRound,
  CouncilStatus,
  DebateMessage,
  DebateMessageAuthor,
} from "@/lib/types";

type ListCouncilRow = {
  id: string;
  title: string;
  status: CouncilStatus;
  created_at: string;
};

type CouncilRow = {
  id: string;
  owner_id: string;
  title: string;
  primary_prompt: string;
  status: CouncilStatus;
  final_summary: string | null;
  created_at: string;
  updated_at: string;
};

type CouncilAgentRow = {
  id: string;
  council_id: string;
  slot: AgentSlot;
  display_name: string;
  specialty: string;
  model_key: string | null;
  created_at: string;
};

type CouncilRoundRow = {
  id: string;
  council_id: string;
  number: number;
  user_feedback: string | null;
  memory_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type DebateMessageRow = {
  id: string;
  council_id: string;
  round_id: string;
  council_agent_id: string | null;
  author: DebateMessageAuthor;
  sequence: number;
  content: string;
  created_at: string;
};

type CouncilWithRelationsRow = CouncilRow & {
  council_agents?: CouncilAgentRow[] | null;
  council_rounds?: (CouncilRoundRow & {
    debate_messages?: DebateMessageRow[] | null;
  })[] | null;
};

type CreateCouncilInput = {
  title: string;
  primaryPrompt: string;
  agents: {
    slot: AgentSlot;
    displayName: string;
    specialty: string;
    modelKey: string;
  }[];
  cycleCount: number;
};

type SaveDebateMessageInput = {
  councilId: string;
  roundId: string;
  councilAgentId: string;
  author: DebateMessageAuthor;
  sequence: number;
  content: string;
};

function mapCouncil(row: CouncilRow): Council {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    primaryPrompt: row.primary_prompt,
    status: row.status,
    finalSummary: row.final_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAgent(row: CouncilAgentRow): CouncilAgent {
  return {
    id: row.id,
    councilId: row.council_id,
    slot: row.slot,
    displayName: row.display_name,
    specialty: row.specialty,
    modelKey: row.model_key,
    createdAt: row.created_at,
  };
}

function mapRound(row: CouncilRoundRow): CouncilRound {
  return {
    id: row.id,
    councilId: row.council_id,
    number: row.number,
    userFeedback: row.user_feedback,
    memorySummary: row.memory_summary,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapMessage(row: DebateMessageRow): DebateMessage {
  return {
    id: row.id,
    councilId: row.council_id,
    roundId: row.round_id,
    councilAgentId: row.council_agent_id,
    author: row.author,
    sequence: row.sequence,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listCouncils(): Promise<
  Pick<Council, "id" | "title" | "status" | "createdAt">[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("councils")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as ListCouncilRow[] | null) ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getCouncil(
  id: string,
): Promise<
  Council & {
    agents: CouncilAgent[];
    rounds: (CouncilRound & { messages: DebateMessage[] })[];
  }
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("councils")
    .select("*, council_agents(*), council_rounds(*, debate_messages(*))")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  const council = data as CouncilWithRelationsRow;

  return {
    ...mapCouncil(council),
    agents: (council.council_agents ?? []).map(mapAgent),
    rounds: (council.council_rounds ?? []).map((round) => ({
      ...mapRound(round),
      messages: (round.debate_messages ?? []).map(mapMessage),
    })),
  };
}

export async function createCouncil(
  data: CreateCouncilInput,
): Promise<{ id: string }> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User must be authenticated to create a council.");
  }

  const { data: councilData, error: councilError } = await supabase
    .from("councils")
    .insert({
      owner_id: user.id,
      title: data.title,
      primary_prompt: data.primaryPrompt,
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (councilError) {
    throw councilError;
  }

  const councilId = (councilData as { id: string }).id;

  // This client-side flow is intentionally sequential for the hackathon.
  // If any later insert fails, partial rows may remain because there is no
  // multi-table transaction across these Supabase client calls.
  const { error: agentsError } = await supabase.from("council_agents").insert(
    data.agents.map((agent) => ({
      council_id: councilId,
      slot: agent.slot,
      display_name: agent.displayName,
      specialty: agent.specialty,
      model_key: agent.modelKey,
    })),
  );

  if (agentsError) {
    throw agentsError;
  }

  const { error: roundsError } = await supabase.from("council_rounds").insert(
    Array.from({ length: data.cycleCount }, (_, index) => ({
      council_id: councilId,
      number: index + 1,
    })),
  );

  if (roundsError) {
    throw roundsError;
  }

  return { id: councilId };
}

export async function saveDebateMessage(
  data: SaveDebateMessageInput,
): Promise<{ id: string }> {
  const supabase = createClient();
  const { data: messageData, error } = await supabase
    .from("debate_messages")
    .insert({
      council_id: data.councilId,
      round_id: data.roundId,
      council_agent_id: data.councilAgentId,
      author: data.author,
      sequence: data.sequence,
      content: data.content,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: (messageData as { id: string }).id };
}

export async function startCouncilRound(
  councilId: string,
  roundNumber: number,
): Promise<{ roundId: string }> {
  const supabase = createClient();
  const startedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("council_rounds")
    .update({ started_at: startedAt })
    .eq("council_id", councilId)
    .eq("number", roundNumber)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const { error: councilError } = await supabase
    .from("councils")
    .update({ status: "ACTIVE" })
    .eq("id", councilId)
    .eq("status", "DRAFT");

  if (councilError) {
    throw councilError;
  }

  return { roundId: (data as { id: string }).id };
}

export async function completeCouncil(
  councilId: string,
  finalSummary: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("councils")
    .update({
      status: "COMPLETED",
      final_summary: finalSummary,
    })
    .eq("id", councilId);

  if (error) {
    throw error;
  }
}

export async function triggerCouncilRun(councilId: string): Promise<void> {
  // TODO: Backend team implements this endpoint (OpenRouter orchestration)
  const response = await fetch(`/api/council/${councilId}/run`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger council run: ${response.status}`);
  }
}

export async function pollCouncilMessages(
  councilId: string,
  afterSequence: number,
): Promise<DebateMessage[]> {
  // TODO: Backend team implements this endpoint
  const response = await fetch(
    `/api/council/${councilId}/messages?after=${afterSequence}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to poll messages: ${response.status}`);
  }

  return (await response.json()) as DebateMessage[];
}
