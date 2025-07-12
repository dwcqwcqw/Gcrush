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
        
        // Enhanced debugging for environment variables
        console.log('=== Chat API Environment Check ===');
        console.log('All available env keys:', Object.keys(env || {}));
        
        const apiKey = env.RUNPOD_API_KEY;
        const endpointId = env.RUNPOD_TEXT_ENDPOINT_ID || env.RUNPOD_ENDPOINT_ID;
        
        console.log('Environment variables check:');
        console.log('- RUNPOD_API_KEY exists:', !!apiKey);
        console.log('- RUNPOD_API_KEY length:', apiKey ? apiKey.length : 0);
        console.log('- RUNPOD_API_KEY first 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
        console.log('- RUNPOD_TEXT_ENDPOINT_ID:', endpointId);
        console.log('- All env vars (first 10 chars):', Object.fromEntries(
            Object.entries(env || {}).map(([key, value]) => [
                key, 
                typeof value === 'string' ? value.substring(0, 10) + '...' : value
            ])
        ));
        console.log('=== End Environment Check ===');
        
        if (!apiKey || !endpointId) {
            console.error('Missing environment variables:', { 
                hasApiKey: !!apiKey, 
                hasEndpointId: !!endpointId,
                envKeys: Object.keys(env || {}),
                apiKeyLength: apiKey ? apiKey.length : 0
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
        
        // Build comprehensive character prompt
        console.log('Building prompt for character:', character);
        
        let prompt = `You are ${character.name || 'Assistant'}`;
        
        // Add age if available
        if (character.age) {
            prompt += `, a ${character.age}-year-old`;
        }
        
        prompt += `. `;
        
        // Add personality traits
        if (character.personality) {
            prompt += `Your personality: ${character.personality}. `;
        }
        
        // Add background/description
        if (character.background) {
            prompt += `Your background: ${character.background}. `;
        }
        
        if (character.description) {
            prompt += `About you: ${character.description}. `;
        }
        
        // Add style if available
        if (character.style) {
            prompt += `Your speaking style: ${character.style}. `;
        }
        
        // Add current situation
        if (character.situation) {
            prompt += `Current situation: ${character.situation}. `;
        }
        
        // Add personality tags
        const tags = [character.tag1, character.tag2, character.tag3].filter(tag => tag && tag.trim() !== '');
        if (tags.length > 0) {
            prompt += `Your personality traits include: ${tags.join(', ')}. `;
        }
        
        // Add conversation context
        prompt += `\n\nIMPORTANT: Stay in character as ${character.name}. Respond naturally and conversationally. `;
        prompt += `Keep your response concise (1-3 sentences) and engaging. `;
        prompt += `Use first person ("I", "me", "my") and respond as if you are having a real conversation.\n\n`;
        prompt += `User: "${message}"\n\n${character.name}:`;
        
        console.log('Generated prompt:', prompt.substring(0, 200) + '...');
        
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
        console.log('=== RunPod Response Analysis ===');
        console.log('Full RunPod response:', JSON.stringify(data, null, 2));
        console.log('Response type:', typeof data);
        console.log('Has output:', !!data.output);
        console.log('Output type:', typeof data.output);
        
        // Extract the generated text from various possible response formats
        let generatedText = '';
        let extractionMethod = 'none';
        
        if (data.output) {
            if (typeof data.output === 'string') {
                generatedText = data.output;
                extractionMethod = 'output_string';
            } else if (data.output.generated_text) {
                generatedText = data.output.generated_text;
                extractionMethod = 'output.generated_text';
            } else if (data.output.choices && data.output.choices[0]) {
                const choice = data.output.choices[0];
                generatedText = choice.text || choice.message?.content || choice.content;
                extractionMethod = 'output.choices[0]';
            } else if (data.output.text) {
                generatedText = data.output.text;
                extractionMethod = 'output.text';
            } else if (data.output.content) {
                generatedText = data.output.content;
                extractionMethod = 'output.content';
            }
        }
        
        // Try direct properties
        if (!generatedText && data.generated_text) {
            generatedText = data.generated_text;
            extractionMethod = 'data.generated_text';
        }
        
        if (!generatedText && data.text) {
            generatedText = data.text;
            extractionMethod = 'data.text';
        }
        
        if (!generatedText && data.content) {
            generatedText = data.content;
            extractionMethod = 'data.content';
        }
        
        console.log('Text extraction result:');
        console.log('- Method used:', extractionMethod);
        console.log('- Generated text length:', generatedText ? generatedText.length : 0);
        console.log('- Generated text preview:', generatedText ? generatedText.substring(0, 100) + '...' : 'NONE');
        console.log('=== End Response Analysis ===');
        
        if (!generatedText) {
            console.error('Could not extract text from RunPod response. Full response:', data);
            generatedText = 'Sorry, I could not generate a response. Please try again.';
            extractionMethod = 'fallback';
        }
        
        return new Response(JSON.stringify({ 
            response: generatedText.trim(),
            sessionId: sessionId,
            debug: {
                extractionMethod: extractionMethod,
                hasOutput: !!data.output,
                responseLength: generatedText.length
            }
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