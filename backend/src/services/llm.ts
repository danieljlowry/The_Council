// This file is responsible for handling the interactions with the LLM API, specifically for making requests to the OpenRouter API and processing the responses.

/** OpenRouter / OpenAI Responses-style models may put text in `reasoning` while `content` is null (especially when max_tokens is consumed by reasoning). */
function extractAssistantText(message: {
  content?: string | null;
  reasoning?: string | null;
  refusal?: string | null;
} | undefined): string | null {
  if (!message) return null;
  const content =
    typeof message.content === "string" ? message.content.trim() : "";
  if (content) return content;
  const reasoning =
    typeof message.reasoning === "string" ? message.reasoning.trim() : "";
  if (reasoning) return reasoning;
  const refusal =
    typeof message.refusal === "string" ? message.refusal.trim() : "";
  if (refusal) return `[Refusal] ${refusal}`;
  return null;
}

export type CallLLMOptions = {
    /** When set (e.g. Model D JSON), uses a higher ceiling than the global default so long structured outputs are not cut off. */
    maxTokens?: number;
};

export async function callLLM(
    model: string,
    prompt: string,
    options?: CallLLMOptions
) {

    console.log(`[LLM] Calling model: ${model}`);
    console.log(`[LLM] API Key present: ${!!process.env.OPENROUTER_API_KEY}`);
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
    };
    // max_tokens: OpenRouter reserves this against your balance (402 if too high).
    // Cheaper / non-reasoning models usually need fewer $/token — you can raise these defaults.
    // Tight budget: set OPENROUTER_MAX_TOKENS=256 and OPENROUTER_MAX_TOKENS_CEILING=480 in .env
    const raw = Number(process.env.OPENROUTER_MAX_TOKENS);
    const configured =
      Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 768;
    const ceiling = Number(process.env.OPENROUTER_MAX_TOKENS_CEILING);
    const hardCap =
      Number.isFinite(ceiling) && ceiling > 0 ? Math.floor(ceiling) : 1024;
    const overrideCeilingRaw = Number(
        process.env.OPENROUTER_MAX_TOKENS_OVERRIDE_CEILING
    );
    const overrideCeiling =
      Number.isFinite(overrideCeilingRaw) && overrideCeilingRaw > 0
        ? Math.floor(overrideCeilingRaw)
        : 2048;

    let maxTokens: number;
    if (
      options?.maxTokens !== undefined &&
      Number.isFinite(options.maxTokens) &&
      options.maxTokens > 0
    ) {
      maxTokens = Math.min(
        Math.floor(options.maxTokens),
        overrideCeiling
      );
    } else {
      maxTokens = Math.min(configured, hardCap);
    }

    const temperatureRaw = Number(process.env.OPENROUTER_TEMPERATURE);
    const temperature =
      Number.isFinite(temperatureRaw) &&
      temperatureRaw >= 0 &&
      temperatureRaw <= 2
        ? temperatureRaw
        : 0.7;

    const payload: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    };

    const extra = process.env.OPENROUTER_EXTRA_BODY?.trim();
    if (extra) {
      try {
        Object.assign(payload, JSON.parse(extra));
      } catch {
        console.warn(
          "[LLM] OPENROUTER_EXTRA_BODY is not valid JSON; ignoring"
        );
      }
    }

    const body = JSON.stringify(payload);
    
    console.log(`[LLM] URL: ${url}`);
    console.log(`[LLM] Headers:`, headers);
    console.log(`[LLM] Body length: ${body.length}`);
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body
        });

        console.log(`[LLM] Response status: ${res.status}`);
        console.log(`[LLM] Response headers:`, Object.fromEntries(res.headers));
        
        const responseText = await res.text();
        console.log(`[LLM] Response text length: ${responseText.length}`);
        console.log(`[LLM] Response body: ${responseText.substring(0, 1000)}`);
        
        if (!responseText) {
            throw new Error(`LLM API returned empty response (status: ${res.status}). This suggests the request was intercepted or blocked (e.g., by antivirus, firewall, or proxy).`);
        }
        
        let json;
        try {
            json = JSON.parse(responseText);
        } catch (e) {
            console.error(`[LLM] Failed to parse response as JSON:`, responseText);
            throw new Error(`LLM API returned invalid JSON: ${responseText}`);
        }
        
        if (!res.ok) {
            console.error('LLM API Error Response:', json);
            throw new Error(`LLM API error (${res.status}): ${json.error?.message || JSON.stringify(json)}`);
        } else {
            const msg = json.choices?.[0]?.message;
            const text = extractAssistantText(msg);
            if (!text) {
                console.error("Invalid LLM response - no content or reasoning:", json);
                throw new Error(
                    `LLM returned no usable text (content and reasoning empty). ` +
                        `If using a reasoning model with a low max_tokens budget, raise OPENROUTER_MAX_TOKENS. ` +
                        `Response snippet: ${JSON.stringify(json).slice(0, 800)}`
                );
            }
            if (!msg?.content && msg?.reasoning) {
                console.log(
                    "[LLM] Using message.reasoning as assistant text (content was null)"
                );
            }
            console.log(`[LLM] Success - returning text of length ${text.length}`);
            return text;
        }
    } catch (error) {
        console.error('[LLM] Exception caught:', error);
        throw error;
    }
}