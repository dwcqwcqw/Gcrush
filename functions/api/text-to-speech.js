// Text to Speech API using Minimax
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    console.log('TTS API called, env available:', !!env);
    console.log('Available env keys:', Object.keys(env || {}));
    
    try {
            const { text, characterId, userId } = await request.json();

            if (!text || !characterId || !userId) {
                return new Response(JSON.stringify({ 
                    error: 'Missing required parameters: text, characterId, userId' 
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            console.log('Processing text-to-speech for character:', characterId, 'user:', userId);
            console.log('Original text:', text);
            
            // Filter out text within asterisks (e.g., *action* or *emotion*)
            // This removes stage directions, actions, and other non-spoken content
            const filteredText = text.replace(/\*[^*]*\*/g, '').trim();
            
            console.log('Filtered text (removed asterisk content):', filteredText);
            
            // Check if there's any text left after filtering
            if (!filteredText) {
                console.log('No speakable text found after filtering asterisk content');
                return new Response(JSON.stringify({
                    success: false,
                    error: 'No speakable text found - only stage directions or actions detected',
                    note: 'Text contained only content within asterisks (*action*) which is filtered out'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
            
            // Use filtered text for cache key and TTS generation
            const textForProcessing = filteredText;
            
            // Create cache key based on filtered text and character
            const textHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(textForProcessing));
            const hashArray = Array.from(new Uint8Array(textHash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const cacheKey = `gcrush/Sound/cache/${characterId}/${hashHex.substring(0, 16)}.mp3`;
            
            console.log('Checking cache for:', cacheKey);
            
            // Check if audio already exists in R2 cache
            if (env.R2_BUCKET) {
                try {
                    const cachedAudio = await env.R2_BUCKET.get(cacheKey);
                    if (cachedAudio) {
                        console.log('✅ Found cached audio, returning cached URL');
                        const cachedUrl = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/${cacheKey}`;
                        return new Response(JSON.stringify({
                            success: true,
                            audioUrl: cachedUrl,
                            r2Key: cacheKey,
                            cached: true
                        }), {
                            status: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    }
                } catch (cacheError) {
                    console.log('Cache check failed, proceeding with API call:', cacheError.message);
                }
            }
            
            console.log('No cached audio found, calling MiniMax API...');
            
            // Check if MiniMax API credentials are available
            if (!env.MINIMAX_API_KEY || !env.MINIMAX_GROUP_ID) {
                console.error('MiniMax API credentials not configured');
                return new Response(JSON.stringify({ 
                    error: 'MiniMax API credentials not configured on server' 
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Get character voice_id from Supabase (skip for test character)
            let voiceId = 'male-qn-qingse'; // Default voice
            let characterName = 'Test Character';
            
            if (!characterId.startsWith('test-')) {
                const supabaseUrl = 'https://kuflobojizyttadwcbhe.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
                
                console.log('🔍 Fetching character voice_id from database for character:', characterId);
                const characterResponse = await fetch(`${supabaseUrl}/rest/v1/characters?id=eq.${characterId}&select=voice_id,name`, {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!characterResponse.ok) {
                    console.error('Failed to fetch character data from Supabase');
                    return new Response(JSON.stringify({ error: 'Character not found in database' }), {
                        status: 404,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }

                const characters = await characterResponse.json();
                if (characters.length === 0) {
                    console.warn('Character not found in database, using default voice');
                    // Don't return error for missing character, use default voice instead
                    characterName = `Character ${characterId}`;
                } else {
                    const character = characters[0];
                    voiceId = character.voice_id || 'male-qn-qingse';
                    characterName = character.name;
                    console.log('✅ Found character in database:', characterName, 'voice_id:', voiceId);
                }
            } else {
                console.log('Using test character, skipping database lookup');
            }

            console.log('Using voice_id:', voiceId, 'for character:', characterName);

            // Call Minimax TTS API with correct endpoint
            const minimaxUrl = `https://api.minimax.io/v1/t2a_v2?GroupId=${env.MINIMAX_GROUP_ID || '1925025302392607036'}`;
            
            const minimaxPayload = {
                model: "speech-02-turbo",
                text: textForProcessing,
                stream: false,
                voice_setting: {
                    voice_id: voiceId,
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                },
                audio_setting: {
                    sample_rate: 32000,
                    bitrate: 128000,
                    format: "mp3",
                    channel: 1
                }
            };
            
            console.log('🚀 Calling MiniMax API:', minimaxUrl);
            console.log('📝 Payload:', JSON.stringify(minimaxPayload, null, 2));
            
            const minimaxResponse = await fetch(minimaxUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(minimaxPayload)
            });

            if (!minimaxResponse.ok) {
                const error = await minimaxResponse.text();
                console.error('MiniMax TTS API error:', minimaxResponse.status, error);
                return new Response(JSON.stringify({ 
                    error: 'Text-to-speech generation failed',
                    details: error,
                    status: minimaxResponse.status,
                    url: minimaxUrl
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const ttsResult = await minimaxResponse.json();
            console.log('Minimax TTS result:', ttsResult);

            // Check for MiniMax t2a_v2 response format: multiple possible formats
            let hexAudio = null;
            
            if (ttsResult.data && ttsResult.data.audio) {
                hexAudio = ttsResult.data.audio;
                console.log('Found hex audio in data.audio, length:', hexAudio.length);
            } else if (ttsResult.audio_file) {
                hexAudio = ttsResult.audio_file;
                console.log('Found hex audio in audio_file, length:', hexAudio.length);
            } else if (ttsResult.audio) {
                hexAudio = ttsResult.audio;
                console.log('Found hex audio in audio, length:', hexAudio.length);
            }
            
            if (hexAudio) {
                console.log('Converting hex to bytes...');
                
                // Convert hex string to byte array using your provided method
                function hexToBytes(hexString) {
                    const bytes = new Uint8Array(hexString.length / 2);
                    for (let i = 0; i < hexString.length; i += 2) {
                        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
                    }
                    return bytes;
                }
                
                const audioBuffer = hexToBytes(hexAudio);
                
                console.log('Converted audio buffer size:', audioBuffer.length);
                
                // Use the cache key for storage
                const r2Key = cacheKey;
                
                console.log('R2 bucket available:', !!env.R2_BUCKET);
                console.log('About to upload TTS audio to R2 with key:', r2Key);
                
                // Upload to R2 (skip if not configured)
                let r2AudioUrl;
                if (env.R2_BUCKET) {
                    try {
                        const r2Response = await env.R2_BUCKET.put(r2Key, audioBuffer, {
                            httpMetadata: {
                                contentType: 'audio/mpeg'
                            }
                        });
                        console.log('TTS audio uploaded to R2:', r2Key);
                        r2AudioUrl = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/${r2Key}`;
                    } catch (r2Error) {
                        console.error('R2 upload failed for TTS:', r2Error);
                        console.warn('Creating temporary blob URL...');
                        // Create a temporary blob URL since R2 failed
                        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
                        r2AudioUrl = 'blob-data-available-but-r2-failed';
                    }
                } else {
                    console.warn('R2 storage not configured, creating temporary blob URL');
                    // Without R2, we'll return the raw data and let frontend handle it
                    r2AudioUrl = 'blob-data-available-no-r2';
                }

                const responseData = {
                    success: true,
                    audioUrl: r2AudioUrl,
                    r2Key: r2Key
                };
                
                // If R2 failed or not configured, also send hex data for frontend processing
                if (r2AudioUrl.includes('blob-data-available')) {
                    responseData.hexAudio = hexAudio;
                    responseData.note = 'R2 storage not available, use hexAudio for blob creation';
                }
                
                return new Response(JSON.stringify(responseData), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else if (ttsResult.task && ttsResult.task.status === 'TASK_STATUS_SUCCEED' && 
                       ttsResult.audios && ttsResult.audios.length > 0 && ttsResult.audios[0].audio_url) {
                // Fallback: Old format with audio_url
                const audioUrl = ttsResult.audios[0].audio_url;
                console.log('Got audio URL from MiniMax (old format):', audioUrl);
                
                // Download the audio file from MiniMax
                const audioResponse = await fetch(audioUrl);
                if (!audioResponse.ok) {
                    throw new Error('Failed to download audio from MiniMax');
                }
                
                const audioBuffer = await audioResponse.arrayBuffer();
                const audioFileName = `tts_${characterId}_${Date.now()}.mp3`;
                const r2Key = `gcrush/Sound/${userId}/${audioFileName}`;
                
                // Upload to R2 (same as above)
                let r2AudioUrl;
                if (env.R2_BUCKET) {
                    try {
                        await env.R2_BUCKET.put(r2Key, audioBuffer, {
                            httpMetadata: { contentType: 'audio/mpeg' }
                        });
                        r2AudioUrl = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/${r2Key}`;
                    } catch (r2Error) {
                        console.warn('R2 upload failed, using original URL');
                        r2AudioUrl = audioUrl;
                    }
                } else {
                    r2AudioUrl = audioUrl;
                }
                
                return new Response(JSON.stringify({
                    success: true,
                    audioUrl: r2AudioUrl,
                    r2Key: r2Key
                }), {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                console.error('Unexpected Minimax response format:', ttsResult);
                return new Response(JSON.stringify({ 
                    error: 'Unexpected API response format',
                    details: JSON.stringify(ttsResult),
                    expected: 'Either audio_file (hex) or task.audios[0].audio_url'
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

        } catch (error) {
            console.error('Text-to-speech error:', error);
            console.error('Error stack:', error.stack);
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                details: error.message,
                stack: error.stack
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
}