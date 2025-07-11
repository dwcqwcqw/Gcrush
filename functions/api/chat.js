export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { character, message, sessionId } = await request.json();
        
        if (!message || !character) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Build the prompt
        let prompt = `You are ${character.name}. `;
        
        if (character.personality) {
            prompt += `Your personality: ${character.personality}. `;
        }
        
        if (character.background) {
            prompt += `Your background: ${character.background}. `;
        }
        
        prompt += `User says: "${message}"\n\nRespond as ${character.name}:`;
        
        // Call RunPod API
        const response = await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_ENDPOINT_ID}/runsync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.RUNPOD_API_KEY}`
            },
            body: JSON.stringify({
                input: {
                    prompt: prompt,
                    max_tokens: 300,
                    temperature: 0.8,
                    top_p: 0.9
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunPod API error:', errorText);
            throw new Error(`RunPod API failed: ${response.status}`);
        }
        
        const data = await response.json();
        const generatedText = data.output?.generated_text || data.output || 'Sorry, I could not generate a response.';
        
        return new Response(JSON.stringify({ 
            response: generatedText,
            sessionId: sessionId 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to process chat request',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}