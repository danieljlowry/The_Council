// This file is responsible for handling the interactions with the LLM API, specifically for making requests to the OpenRouter API and processing the responses.

export async function callLLM(model: string, prompt: string) {

    // Make POST request to OperRouter API with specificied model and user prompt in req body, include auth header with API key
    const res = await fetch('https://openrouter.ai.com/v1/chat/completions', {

        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // Use API key for auth
            'Content-Type': 'application/json', // Set content type to JSON for request body
        },
        body: JSON.stringify({
            model, // Model used for generating response, passed as argument to function
            messages: [ {role: 'user', content: prompt}] // User prompt sent as message in request body
        })
        
    })

    // Check if the response is successful
    const json = await res.json();
    // Error Handler: If the response is not successful, throw error
    if (!res.ok) {
        throw new Error(`LLM API error: ${json.error.message}`);
    } else {

    // Return the content of the first message in the choices array, which is the LLM's response to the user's prompt
    return json.choices[0].message.content;
        
    } // end callLLM




}