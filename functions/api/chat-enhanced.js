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
        
        // Build enhanced prompt with system prompt and character data
        console.log('Building enhanced prompt for character:', character.name);
        
        let prompt = '';
        
        // 1. Start with system prompt if available, otherwise build from character data
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
            
            const tags = [character.tag1, character.tag2, character.tag3].filter(tag => tag && tag.trim() !== '');
            if (tags.length > 0) {
                prompt += `Your personality traits include: ${tags.join(', ')}. `;
            }
            
            prompt += `\n\nIMPORTANT: Stay in character as ${character.name}. Respond naturally and conversationally. `;
            prompt += `Keep your response concise (1-3 sentences) and engaging. `;
            prompt += `Use first person ("I", "me", "my") and respond as if you are having a real conversation.\n\n`;
            
            console.log('Built system prompt from character data');
        }
        
        // 2. Add situation context if available (important for role-playing)
        if (character.situation) {
            prompt += `Current situation/context: ${character.situation}\n\n`;
            console.log('Added character situation to prompt');
        }
        
        // 3. Add greeting information if this appears to be an initial conversation
        if (character.greeting && (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey'))) {
            prompt += `Your greeting style (as reference): ${character.greeting}\n\n`;
            console.log('Added character greeting style to prompt');
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
        console.log('Full response structure:', JSON.stringify(data, null, 2));
        console.log('Response status:', data.status);
        console.log('Has output:', !!data.output);
        console.log('Output type:', typeof data.output);
        
        // Extract response text with comprehensive fallback strategy
        let generatedText = '';
        let extractionMethod = 'none';
        
        // Strategy 1: Check if output is a direct string
        if (data.output && typeof data.output === 'string') {
            generatedText = data.output;
            extractionMethod = 'output_string';
        }
        // Strategy 2: Check standard output properties
        else if (data.output && typeof data.output === 'object') {
            if (data.output.generated_text) {
                generatedText = data.output.generated_text;
                extractionMethod = 'output.generated_text';
            } else if (data.output.text) {
                generatedText = data.output.text;
                extractionMethod = 'output.text';
            } else if (data.output.content) {
                generatedText = data.output.content;
                extractionMethod = 'output.content';
            } else if (data.output.response) {
                generatedText = data.output.response;
                extractionMethod = 'output.response';
            } else if (data.output.choices && Array.isArray(data.output.choices) && data.output.choices.length > 0) {
                const choice = data.output.choices[0];
                if (choice.text) {
                    generatedText = choice.text;
                    extractionMethod = 'output.choices[0].text';
                } else if (choice.message && choice.message.content) {
                    generatedText = choice.message.content;
                    extractionMethod = 'output.choices[0].message.content';
                } else if (choice.content) {
                    generatedText = choice.content;
                    extractionMethod = 'output.choices[0].content';
                }
            }
            // Strategy 3: Check if output has any string property
            else {
                const outputKeys = Object.keys(data.output);
                for (const key of outputKeys) {
                    if (typeof data.output[key] === 'string' && data.output[key].trim().length > 0) {
                        generatedText = data.output[key];
                        extractionMethod = `output.${key}`;
                        break;
                    }
                }
            }
        }
        
        // Strategy 4: Check direct data properties
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
        
        if (!generatedText && data.response) {
            generatedText = data.response;
            extractionMethod = 'data.response';
        }
        
        // Strategy 5: Check if data itself is the text response
        if (!generatedText && typeof data === 'string') {
            generatedText = data;
            extractionMethod = 'data_direct_string';
        }
        
        console.log('Extraction method:', extractionMethod);
        console.log('Generated text length:', generatedText ? generatedText.length : 0);
        console.log('Generated text preview:', generatedText ? generatedText.substring(0, 200) + '...' : 'NONE');
        console.log('=== End Response Analysis ===');
        
        if (!generatedText) {
            console.error('Could not extract text from RunPod response');
            generatedText = 'I\'m having trouble generating a response right now. Could you try asking me something else?';
        }
        
        // Clean up and post-process the response
        let cleanedText = generatedText.trim();
        
        // Remove common artifacts from AI responses
        cleanedText = cleanedText
            // Remove leading/trailing quotes
            .replace(/^["']|["']$/g, '')
            // Remove model artifacts like "<|im_end|>", "[INST]", etc.
            .replace(/<\|.*?\|>/g, '')
            .replace(/\[INST\]|\[\/INST\]/g, '')
            .replace(/\<s\>|\<\/s\>/g, '')
            // Remove repetitive character names at the start
            .replace(new RegExp(`^${character.name}:\\s*`, 'i'), '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
        
        // Ensure the response isn't empty after cleaning
        if (!cleanedText || cleanedText.length < 3) {
            console.warn('Response became empty after cleaning, using fallback');
            cleanedText = `*${character.name} smiles* That's interesting! Tell me more about that.`;
        }
        
        console.log('Final cleaned response:', cleanedText);
        
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