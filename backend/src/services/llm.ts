// This file is responsible for handling the interactions with the LLM API, specifically for making requests to the OpenRouter API and processing the responses.

export async function callLLM(model: string, prompt: string) {

    console.log(`[LLM] Calling model: ${model}`);
    console.log(`[LLM] API Key present: ${!!process.env.OPENROUTER_API_KEY}`);
    
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
    };
    const maxTokens = Number(process.env.OPENROUTER_MAX_TOKENS) || 2048;
    const body = JSON.stringify({
        model,
        messages: [ {role: 'user', content: prompt}],
        max_tokens: maxTokens,
    });
    
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
            const content = json.choices?.[0]?.message?.content;
            if (!content) {
                console.error('Invalid LLM response - no content:', json);
                throw new Error(`LLM returned empty content: ${JSON.stringify(json)}`);
            }
            console.log(`[LLM] Success - returning content of length ${content.length}`);
            return content;
        }
    } catch (error) {
        console.error('[LLM] Exception caught:', error);
        throw error;
    }
}