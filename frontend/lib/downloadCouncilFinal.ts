import type { DebateMessage } from "@/lib/types";

export type CouncilDownloadFormat = "txt" | "md";

type CouncilFinalBodySource = {
  finalSummary: string | null;
  rounds: { messages: DebateMessage[] }[];
};

/** Prefer `final_summary`; otherwise last AGENT message by sequence. */
export function resolveCouncilFinalBody(
  council: CouncilFinalBodySource,
): string | null {
  const summary = council.finalSummary?.trim();
  if (summary) {
    return summary;
  }
  const agentMessages = council.rounds.flatMap((r) =>
    (r.messages ?? []).filter((m) => m.author === "AGENT"),
  );
  if (agentMessages.length === 0) {
    return null;
  }
  const last = agentMessages.reduce((a, b) =>
    a.sequence > b.sequence ? a : b,
  );
  const text = last.content?.trim();
  return text || null;
}

export type CouncilDownloadPayload = {
  title: string;
  topic: string;
  body: string;
};

function safeFilenamePart(raw: string, maxLen: number): string {
  const base = raw
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
  return base || "council-response";
}

function formatExportedAt(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function buildFinalResponseTxt(
  { title, topic, body, exportedAt }: CouncilDownloadPayload & { exportedAt: Date },
): string {
  return [
    "Prompt Odyssey — Final response",
    `Council: ${title}`,
    `Topic: ${topic}`,
    `Exported: ${formatExportedAt(exportedAt)}`,
    "",
    "---",
    "",
    body.trim(),
    "",
  ].join("\n");
}

export function buildFinalResponseMd(
  { title, topic, body, exportedAt }: CouncilDownloadPayload & { exportedAt: Date },
): string {
  return [
    "# Final response",
    "",
    `- **Council:** ${title}`,
    `- **Topic:** ${topic}`,
    `- **Exported:** ${formatExportedAt(exportedAt)}`,
    "",
    "---",
    "",
    body.trim(),
    "",
  ].join("\n");
}

export function triggerTextDownload(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCouncilFinalResponse(
  format: CouncilDownloadFormat,
  payload: CouncilDownloadPayload,
  exportedAt: Date = new Date(),
): void {
  const stamp = exportedAt.toISOString().slice(0, 10);
  const part = safeFilenamePart(payload.title, 48);
  if (format === "txt") {
    triggerTextDownload(
      `${part}-${stamp}.txt`,
      buildFinalResponseTxt({ ...payload, exportedAt }),
      "text/plain;charset=utf-8",
    );
    return;
  }
  triggerTextDownload(
    `${part}-${stamp}.md`,
    buildFinalResponseMd({ ...payload, exportedAt }),
    "text/markdown;charset=utf-8",
  );
}
