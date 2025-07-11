export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { character, message, sessionId } = await request.json();
        
        if (!message || !character) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Check if environment variables are available
        const apiKey = env.RUNPOD_API_KEY;
        const endpointId = env.RUNPOD_TEXT_ENDPOINT_ID || env.RUNPOD_ENDPOINT_ID;
        
        if (!apiKey || !endpointId) {
            console.error('Missing environment variables:', { 
                hasApiKey: !!apiKey, 
                hasEndpointId: !!endpointId,
                envKeys: Object.keys(env || {})
            });
            
            // Fallback to mock response if no API credentials
            const mockResponse = getMockResponse(character.name, message);
            return new Response(JSON.stringify({ 
                response: mockResponse,
                sessionId: sessionId,
                mock: true
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
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
        
        prompt += `User says: "${message}"\n\nRespond as ${character.name} in a natural, conversational way:`;
        
        // Call RunPod API
        const runpodUrl = `https://api.runpod.ai/v2/${endpointId}/runsync`;
        console.log('Calling RunPod API:', runpodUrl);
        
        const response = await fetch(runpodUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                input: {
                    prompt: prompt,
                    max_tokens: 300,
                    temperature: 0.8,
                    top_p: 0.9,
                    model: 'L3.2-8X4B.gguf'  // Specify the model
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunPod API error:', response.status, errorText);
            throw new Error(`RunPod API failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('RunPod response:', data);
        
        // Extract the generated text from various possible response formats
        let generatedText = '';
        if (data.output) {
            if (typeof data.output === 'string') {
                generatedText = data.output;
            } else if (data.output.generated_text) {
                generatedText = data.output.generated_text;
            } else if (data.output.choices && data.output.choices[0]) {
                generatedText = data.output.choices[0].text || data.output.choices[0].message?.content;
            } else if (data.output.text) {
                generatedText = data.output.text;
            }
        }
        
        if (!generatedText && data.generated_text) {
            generatedText = data.generated_text;
        }
        
        if (!generatedText) {
            console.error('Could not extract text from RunPod response:', data);
            generatedText = 'Sorry, I could not generate a response. Please try again.';
        }
        
        return new Response(JSON.stringify({ 
            response: generatedText.trim(),
            sessionId: sessionId 
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        
        // Fallback to mock response on error
        const mockResponse = getMockResponse(
            character?.name || 'Assistant', 
            message || 'Hello'
        );
        
        return new Response(JSON.stringify({ 
            response: mockResponse,
            sessionId: sessionId,
            error: error.message,
            mock: true
        }), {
            status: 200, // Return 200 with mock response instead of 500
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Add OPTIONS handler for CORS
export async function onRequestOptions(context) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// Mock response generator for fallback
function getMockResponse(characterName, userMessage) {
    const responses = [
        `That's interesting! Tell me more about that.`,
        `I understand what you're saying. ${userMessage} is definitely something worth discussing.`,
        `*smiles* I love chatting with you about this!`,
        `Oh really? That sounds amazing! What else?`,
        `Hmm, let me think about that... I find your perspective fascinating!`,
        `*laughs* You always know how to make our conversations interesting!`,
        `I'm really enjoying our chat! Your thoughts on this are quite intriguing.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `[${characterName}] ${randomResponse}`;
}