// Text to Speech API using Minimax
export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
                status: 405,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

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

            // Get character voice_id from Supabase
            const supabaseUrl = 'https://kuflobojizyttadwcbhe.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
            
            const characterResponse = await fetch(`${supabaseUrl}/rest/v1/characters?id=eq.${characterId}&select=voice_id,name`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!characterResponse.ok) {
                console.error('Failed to fetch character data from Supabase');
                return new Response(JSON.stringify({ error: 'Character not found' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const characters = await characterResponse.json();
            if (characters.length === 0) {
                return new Response(JSON.stringify({ error: 'Character not found' }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const character = characters[0];
            let voiceId = character.voice_id;
            
            if (!voiceId) {
                console.log('No voice_id found for character, using default voice');
                // Use a default voice if character doesn't have voice_id
                voiceId = 'default-voice-id';
            }

            console.log('Using voice_id:', voiceId, 'for character:', character.name);

            // Call Minimax TTS API
            const minimaxResponse = await fetch('https://api.minimax.chat/v1/text_to_speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    group_id: env.MINIMAX_GROUP_ID,
                    model: "speech-02-turbo",
                    voice_id: voiceId,
                    text: text,
                    audio_setting: {
                        sample_rate: 22050,
                        bitrate: 128000,
                        format: "mp3"
                    }
                })
            });

            if (!minimaxResponse.ok) {
                const error = await minimaxResponse.text();
                console.error('Minimax TTS API error:', error);
                return new Response(JSON.stringify({ 
                    error: 'Text-to-speech generation failed',
                    details: error 
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

            // If Minimax returns audio data directly as base64
            if (ttsResult.audio_file || ttsResult.data) {
                // Convert audio data to buffer and store in R2
                const audioData = ttsResult.audio_file || ttsResult.data;
                const audioBuffer = Buffer.from(audioData, 'base64');
                
                const audioFileName = `tts_${characterId}_${Date.now()}.mp3`;
                const r2Key = `gcrush/Sound/${userId}/${audioFileName}`;
                
                // Upload to R2
                const r2Response = await env.GCRUSH_R2.put(r2Key, audioBuffer, {
                    httpMetadata: {
                        contentType: 'audio/mpeg'
                    }
                });

                console.log('TTS audio uploaded to R2:', r2Key);

                // Return R2 URL for the audio
                const audioUrl = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/${r2Key}`;

                return new Response(JSON.stringify({
                    success: true,
                    audioUrl: audioUrl,
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
                    error: 'Unexpected API response format' 
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
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};