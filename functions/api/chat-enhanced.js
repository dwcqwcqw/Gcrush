// Enhanced chat API with character system prompts and chat history
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { character, message, sessionId, userId } = await request.json();
        
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
        console.log('=== Enhanced Chat API Environment Check ===');
        const apiKey = env.RUNPOD_API_KEY;
        const endpointId = env.RUNPOD_TEXT_ENDPOINT_ID || env.RUNPOD_ENDPOINT_ID;
        
        console.log('- RUNPOD_API_KEY exists:', !!apiKey);
        console.log('- RUNPOD_API_KEY length:', apiKey ? apiKey.length : 0);
        console.log('- RUNPOD_TEXT_ENDPOINT_ID:', endpointId);
        
        if (!apiKey || !endpointId) {
            console.error('Missing environment variables - using mock response');
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
        
        // Build enhanced prompt with system prompt and chat history
        console.log('Building enhanced prompt for character:', character.name);
        
        let prompt = '';
        
        // 1. Start with system prompt if available
        if (character.system_prompt) {
            prompt += character.system_prompt + '\n\n';
            console.log('Using character system_prompt');
        } else {
            // Fallback to building system prompt from character data
            prompt += `You are ${character.name || 'Assistant'}`;
            
            if (character.age) {
                prompt += `, a ${character.age}-year-old`;
            }
            prompt += '. ';
            
            if (character.personality) {
                prompt += `Your personality: ${character.personality}. `;
            }
            
            if (character.background) {
                prompt += `Your background: ${character.background}. `;
            }
            
            if (character.description) {
                prompt += `About you: ${character.description}. `;
            }
            
            if (character.style) {
                prompt += `Your speaking style: ${character.style}. `;
            }
            
            if (character.situation) {
                prompt += `Current situation: ${character.situation}. `;
            }
            
            const tags = [character.tag1, character.tag2, character.tag3].filter(tag => tag && tag.trim() !== '');
            if (tags.length > 0) {
                prompt += `Your personality traits include: ${tags.join(', ')}. `;
            }
            
            prompt += `\n\nIMPORTANT: Stay in character as ${character.name}. Respond naturally and conversationally. `;
            prompt += `Keep your response concise (1-3 sentences) and engaging. `;
            prompt += `Use first person ("I", "me", "my") and respond as if you are having a real conversation.\n\n`;
            
            console.log('Built system prompt from character data');
        }
        
        // 2. Add recent chat history if sessionId is provided
        // Note: In a real implementation, you'd fetch this from Supabase
        // For now, we'll add the current message
        prompt += `Recent conversation:\n`;
        prompt += `User: "${message}"\n`;
        prompt += `${character.name}:`;
        
        console.log('Final prompt length:', prompt.length);
        console.log('Prompt preview:', prompt.substring(0, 300) + '...');
        
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
                    model: 'L3.2-8X4B.gguf'
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
        console.log('Response status:', data.status);
        console.log('Has output:', !!data.output);
        
        // Extract response text
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
            }
        }
        
        if (!generatedText && data.generated_text) {
            generatedText = data.generated_text;
            extractionMethod = 'data.generated_text';
        }
        
        if (!generatedText && data.text) {
            generatedText = data.text;
            extractionMethod = 'data.text';
        }
        
        console.log('Extraction method:', extractionMethod);
        console.log('Generated text length:', generatedText ? generatedText.length : 0);
        console.log('=== End Response Analysis ===');
        
        if (!generatedText) {
            console.error('Could not extract text from RunPod response');
            generatedText = 'I\'m having trouble generating a response right now. Could you try asking me something else?';
        }
        
        // Clean up the response
        const cleanedText = generatedText.trim();
        
        return new Response(JSON.stringify({ 
            response: cleanedText,
            sessionId: sessionId,
            debug: {
                extractionMethod: extractionMethod,
                promptLength: prompt.length,
                responseLength: cleanedText.length,
                hasSystemPrompt: !!character.system_prompt
            }
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Enhanced Chat API error:', error);
        
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
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// Mock response generator
function getMockResponse(characterName, userMessage) {
    const responses = [
        `That's really interesting! Tell me more about that.`,
        `I love hearing your thoughts on this topic.`,
        `*smiles* You always bring up such fascinating points!`,
        `Hmm, that's something I hadn't considered before. What do you think about...?`,
        `I find your perspective really engaging. Please continue!`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `[${characterName}] ${randomResponse}`;
}