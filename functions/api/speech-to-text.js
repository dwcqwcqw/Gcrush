// Speech to Text API using OpenAI Whisper
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
    
    console.log('STT API called, env available:', !!env);
    console.log('Available env keys:', Object.keys(env || {}));
    
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
            
            // Check if OpenAI API key is available
            if (!env.OPENAI_API_KEY) {
                console.error('OpenAI API key not configured');
                return new Response(JSON.stringify({ 
                    error: 'OpenAI API key not configured on server' 
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Store audio file in R2
            const audioFileName = `user_${userId}_${Date.now()}.webm`;
            let r2Key = `gcrush/Sound/${userId}/${audioFileName}`;
            
            console.log('R2 bucket available:', !!env.R2_BUCKET);
            console.log('About to upload to R2 with key:', r2Key);
            
            // Upload to R2 (skip if not configured)
            if (env.R2_BUCKET) {
                try {
                    const r2Response = await env.R2_BUCKET.put(r2Key, audioFile.stream(), {
                        httpMetadata: {
                            contentType: audioFile.type || 'audio/webm'
                        }
                    });
                    console.log('Audio uploaded to R2:', r2Key);
                } catch (r2Error) {
                    console.error('R2 upload failed:', r2Error);
                    console.warn('Continuing without R2 storage...');
                    r2Key = 'temp-storage-not-configured';
                }
            } else {
                console.warn('R2 storage not configured, skipping upload');
                r2Key = 'r2-not-configured';
            }

            // Check for region restrictions first
            console.log('🌍 Checking OpenAI region support...');
            
            try {
                // Test API availability with a simple request
                const testResponse = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                    }
                });
                
                if (!testResponse.ok) {
                    const testError = await testResponse.text();
                    console.log('OpenAI API test failed:', testResponse.status, testError);
                    
                    if (testResponse.status === 403 || testError.includes('unsupported_country_region_territory')) {
                        return new Response(JSON.stringify({ 
                            error: 'OpenAI services not available in this region',
                            details: 'Speech-to-text service is restricted in your location. Please use a VPN or try from a supported region.',
                            fallback: 'Consider using alternative speech recognition services.'
                        }), {
                            status: 403,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        });
                    }
                }
                
                console.log('✅ OpenAI API region check passed');
            } catch (regionError) {
                console.error('Region check failed:', regionError);
                return new Response(JSON.stringify({ 
                    error: 'Unable to verify OpenAI API availability',
                    details: regionError.message
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
            
            // Convert to OpenAI Whisper API
            console.log('🚀 Calling OpenAI Whisper API...');
            
            const whisperFormData = new FormData();
            whisperFormData.append('file', audioFile, 'audio.webm');
            whisperFormData.append('model', 'whisper-1');
            // Don't specify language to let Whisper auto-detect and avoid region restrictions
            
            console.log('📝 Audio file size:', audioFile.size);
            console.log('📝 Audio file type:', audioFile.type);

            const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.OPENAI_API_KEY}`
                },
                body: whisperFormData
            });

            if (!whisperResponse.ok) {
                const error = await whisperResponse.text();
                console.error('OpenAI Whisper API error:', whisperResponse.status, error);
                return new Response(JSON.stringify({ 
                    error: 'Speech recognition failed',
                    details: error,
                    status: whisperResponse.status
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

            if (!result.text) {
                console.error('No text in Whisper response:', result);
                return new Response(JSON.stringify({ 
                    error: 'No transcription text returned',
                    details: JSON.stringify(result)
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

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