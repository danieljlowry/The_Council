import type { ReactNode } from "react";
import type { AgentSlot } from "@/lib/types";

type EvaluatorShape = {
  summary?: string;
  issues?: unknown;
  evaluation?: string;
  suggested_improvements?: unknown;
};

type ModelAShape = {
  answer?: string;
  assumptions?: unknown;
  uncertainties?: unknown;
};

function normalizeIssues(issues: unknown): string[] {
  if (Array.isArray(issues)) {
    return issues.map((x) => String(x));
  }
  if (typeof issues === "string" && issues.trim()) {
    return [issues.trim()];
  }
  return [];
}

/** Match backend `extractJsonObjectString` so fenced or messy Model A output still parses. */
function extractJsonObjectString(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    const afterOpen = s.indexOf("\n");
    if (afterOpen !== -1) {
      s = s.slice(afterOpen + 1);
    } else {
      s = s.replace(/^```[a-z]*\s*/i, "");
    }
    const close = s.lastIndexOf("```");
    if (close !== -1) {
      s = s.slice(0, close);
    }
    s = s.trim();
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return s.slice(start, end + 1);
  }
  return s;
}

/** Legacy rows: Model A stored raw JSON with answer / assumptions / uncertainties. */
export function tryParseModelAJson(content: string): ModelAShape | null {
  const t = extractJsonObjectString(content).trim();
  if (!t.startsWith("{")) {
    return null;
  }
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (typeof o.summary === "string") {
      return null;
    }
    const hasA =
      typeof o.answer === "string" ||
      Array.isArray(o.assumptions) ||
      Array.isArray(o.uncertainties);
    if (!hasA) {
      return null;
    }
    return o as ModelAShape;
  } catch {
    return null;
  }
}

/** Legacy rows stored JSON.stringify(evaluator object). */
export function tryParseEvaluatorJson(content: string): EvaluatorShape | null {
  const t = extractJsonObjectString(content).trim();
  if (!t.startsWith("{")) {
    return null;
  }
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    const hasShape =
      typeof o.summary === "string" ||
      typeof o.evaluation === "string" ||
      (Array.isArray(o.issues) && o.issues.length > 0) ||
      (Array.isArray(o.suggested_improvements) &&
        o.suggested_improvements.length > 0);
    if (!hasShape) {
      return null;
    }
    return o as EvaluatorShape;
  } catch {
    return null;
  }
}

function Section({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function LegacyModelASections({ data }: { data: ModelAShape }) {
  const assumptions = normalizeIssues(data.assumptions);
  const uncertainties = normalizeIssues(data.uncertainties);

  return (
    <div className="relative z-10 space-y-4">
      {typeof data.answer === "string" && data.answer.trim() ? (
        <Section label="Answer">
          <p className="whitespace-pre-wrap">{data.answer.trim()}</p>
        </Section>
      ) : null}
      {assumptions.length > 0 ? (
        <Section label="Assumptions">
          <ul className="list-disc space-y-1 pl-4">
            {assumptions.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {uncertainties.length > 0 ? (
        <Section label="Uncertainties">
          <ul className="list-disc space-y-1 pl-4">
            {uncertainties.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function LegacyEvaluatorSections({ data }: { data: EvaluatorShape }) {
  const issues = normalizeIssues(data.issues);
  const suggestions = normalizeIssues(data.suggested_improvements);

  return (
    <div className="relative z-10 space-y-4">
      {typeof data.summary === "string" && data.summary.trim() ? (
        <Section label="Summary">
          <p className="whitespace-pre-wrap">{data.summary.trim()}</p>
        </Section>
      ) : null}
      {issues.length > 0 ? (
        <Section label="Issues">
          <ul className="list-disc space-y-1 pl-4">
            {issues.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {typeof data.evaluation === "string" && data.evaluation.trim() ? (
        <Section label="Evaluation">
          <p className="whitespace-pre-wrap">{data.evaluation.trim()}</p>
        </Section>
      ) : null}
      {suggestions.length > 0 ? (
        <Section label="Suggested improvements">
          <ul className="list-disc space-y-1 pl-4">
            {suggestions.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

export function CouncilLogMessageBody({
  content,
  slot,
}: {
  content: string;
  slot: AgentSlot | undefined;
}) {
  if (slot === "CROWN") {
    const legacyA = tryParseModelAJson(content);
    if (legacyA) {
      return <LegacyModelASections data={legacyA} />;
    }
  }
  if (slot === "AGENT_D") {
    const legacy = tryParseEvaluatorJson(content);
    if (legacy) {
      return <LegacyEvaluatorSections data={legacy} />;
    }
  }
  return (
    <span className="relative z-10 whitespace-pre-wrap break-words">
      {content}
    </span>
  );
}
