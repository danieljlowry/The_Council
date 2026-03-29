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

/** PostgREST errors are often plain objects; UI must not rely on `instanceof Error` only. */
export function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    const parts = [e.message, e.code, e.details, e.hint].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function throwSupabase(context: string, error: unknown): never {
  console.error(`[${context}]`, error);
  throw new Error(formatSupabaseError(error));
}

/** Fastify orchestrator URL. Defaults to local API; set in production. */
function backendApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}

async function authorizedHeaders(): Promise<HeadersInit> {
  const supabase = createClient();

  // Refresh so access_token is valid for the API (getSession alone can return an expired JWT).
  const { data: refreshed, error: refreshError } =
    await supabase.auth.refreshSession();

  let session = refreshed.session;
  if (refreshError || !session?.access_token) {
    const {
      data: { session: fallback },
      error: getError,
    } = await supabase.auth.getSession();
    if (getError) {
      throw getError;
    }
    session = fallback;
  }

  const token = session?.access_token;
  if (!token) {
    throw new Error("You must be signed in.");
  }

  return { Authorization: `Bearer ${token}` };
}

async function authorizedJsonHeaders(): Promise<HeadersInit> {
  const base = await authorizedHeaders();
  return { ...base, "Content-Type": "application/json" };
}

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
    throwSupabase("createCouncil auth.getUser", userError);
  }

  if (!user) {
    throw new Error("User must be authenticated to create a council.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throwSupabase("createCouncil profiles lookup", profileError);
  }

  if (!profile) {
    console.error("[createCouncil] Missing profiles row for user", user.id);
    throw new Error(
      "Your account has no profile row yet. Councils require a matching row in public.profiles (same id as auth). Run the handle_new_user trigger in Supabase (see backend/supabase/) or insert a profile for your user.",
    );
  }

  // DB migration may add gen_random_uuid() defaults; until then PostgREST requires
  // explicit ids (Prisma @default(uuid()) only applies when using Prisma Client).
  const newCouncilId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: councilData, error: councilError } = await supabase
    .from("councils")
    .insert({
      id: newCouncilId,
      owner_id: user.id,
      title: data.title,
      primary_prompt: data.primaryPrompt,
      status: "DRAFT",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (councilError) {
    throwSupabase("createCouncil councils insert", councilError);
  }

  const councilId = (councilData as { id: string }).id;

  // This client-side flow is intentionally sequential for the hackathon.
  // If any later insert fails, partial rows may remain because there is no
  // multi-table transaction across these Supabase client calls.
  const { error: agentsError } = await supabase.from("council_agents").insert(
    data.agents.map((agent) => ({
      id: crypto.randomUUID(),
      council_id: councilId,
      slot: agent.slot,
      display_name: agent.displayName,
      specialty: agent.specialty,
      model_key: agent.modelKey,
    })),
  );

  if (agentsError) {
    throwSupabase("createCouncil council_agents insert", agentsError);
  }

  const { error: roundsError } = await supabase.from("council_rounds").insert(
    Array.from({ length: data.cycleCount }, (_, index) => ({
      id: crypto.randomUUID(),
      council_id: councilId,
      number: index + 1,
    })),
  );

  if (roundsError) {
    throwSupabase("createCouncil council_rounds insert", roundsError);
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
      id: crypto.randomUUID(),
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
    .update({ status: "ACTIVE", updated_at: new Date().toISOString() })
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", councilId);

  if (error) {
    throw error;
  }
}

/** Deletes the council and cascaded rows (agents, rounds, messages) for the signed-in owner. */
export async function deleteCouncil(councilId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("councils").delete().eq("id", councilId);

  if (error) {
    throwSupabase("deleteCouncil", error);
  }
}

export async function triggerCouncilRun(councilId: string): Promise<void> {
  const headers = await authorizedJsonHeaders();

  let response: Response;
  try {
    response = await fetch(
      `${backendApiBase()}/council/${encodeURIComponent(councilId)}/run`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      },
    );
  } catch (err) {
    const base = backendApiBase();
    const msg = err instanceof Error ? err.message : String(err);
    const networkFail =
      /failed to fetch|load failed|networkerror/i.test(msg) ||
      err instanceof TypeError;
    const hint = networkFail
      ? ` Check that the API is running (${base}) — e.g. npm run api:dev from the repo root.`
      : "";
    throw new Error(`${msg}${hint}`.trim());
  }

  if (!response.ok) {
    const text = await response.text();
    let detail = `Request failed (${response.status})`;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (typeof j.error === "string" && j.error.length > 0) {
        detail = j.error;
      } else if (text.trim()) {
        detail = `${detail}: ${text.slice(0, 500)}`;
      }
    } catch {
      if (text.trim()) {
        detail = `${detail}: ${text.slice(0, 500)}`;
      }
    }
    throw new Error(detail);
  }
}

export async function pollCouncilMessages(
  councilId: string,
  afterSequence: number,
): Promise<DebateMessage[]> {
  const headers = await authorizedHeaders();
  const params = new URLSearchParams({
    after: String(afterSequence),
  });

  const response = await fetch(
    `${backendApiBase()}/debate/${encodeURIComponent(councilId)}/messages?${params}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Failed to poll messages: ${response.status}`);
  }

  const data = (await response.json()) as { messages: DebateMessage[] };

  return data.messages ?? [];
}
