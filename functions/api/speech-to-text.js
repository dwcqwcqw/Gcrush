// Speech to Text API using OpenAI Whisper
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
            const formData = await request.formData();
            const audioFile = formData.get('audio');
            const userId = formData.get('userId');

            if (!audioFile) {
                return new Response(JSON.stringify({ error: 'No audio file provided' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            if (!userId) {
                return new Response(JSON.stringify({ error: 'User not authenticated' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            console.log('Processing speech-to-text for user:', userId);

            // Store audio file in R2
            const audioFileName = `user_${userId}_${Date.now()}.webm`;
            const r2Key = `gcrush/Sound/${userId}/${audioFileName}`;
            
            // Upload to R2
            const r2Response = await env.GCRUSH_R2.put(r2Key, audioFile.stream(), {
                httpMetadata: {
                    contentType: audioFile.type || 'audio/webm'
                }
            });

            console.log('Audio uploaded to R2:', r2Key);

            // Convert to OpenAI Whisper API
            const whisperFormData = new FormData();
            whisperFormData.append('file', audioFile, 'audio.webm');
            whisperFormData.append('model', 'whisper-1');
            whisperFormData.append('language', 'en');

            const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                },
                body: whisperFormData
            });

            if (!whisperResponse.ok) {
                const error = await whisperResponse.text();
                console.error('OpenAI Whisper API error:', error);
                return new Response(JSON.stringify({ 
                    error: 'Speech recognition failed',
                    details: error 
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            const result = await whisperResponse.json();
            console.log('Whisper transcription result:', result);

            return new Response(JSON.stringify({
                success: true,
                text: result.text,
                audioUrl: r2Key
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            console.error('Speech-to-text error:', error);
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