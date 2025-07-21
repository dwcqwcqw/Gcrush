export async function onRequestPost(context) {
    const { request, env, ctx } = context;
        // 处理CORS预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // 只允许POST请求
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
                status: 405,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            });
        }

        try {
            const requestData = await request.json();
            console.log('🎨 Generate Image API called with:', requestData);

            // 验证必需的环境变量
            const requiredEnvVars = ['RUNPOD_API_KEY', 'RUNPOD_IMAGE_ENDPOINT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID'];
            for (const envVar of requiredEnvVars) {
                if (!env[envVar]) {
                    console.error(`❌ Missing environment variable: ${envVar}`);
                    return new Response(JSON.stringify({ error: `Missing environment variable: ${envVar}` }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // 验证用户认证
            const { user_id, prompt, negative_prompt, batch_size, character_name } = requestData;
            if (!user_id) {
                return new Response(JSON.stringify({ error: 'User authentication required' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 获取用户信息以便命名图片
            let username = 'user';
            try {
                // 尝试从Supabase获取用户名
                if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    const supabaseResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=username`, {
                        headers: {
                            'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                        }
                    });
                    if (supabaseResponse.ok) {
                        const profiles = await supabaseResponse.json();
                        if (profiles && profiles.length > 0 && profiles[0].username) {
                            username = profiles[0].username;
                        }
                    }
                }
            } catch (error) {
                console.log('Could not fetch username, using default:', error.message);
            }

            // 构建ComfyUI工作流，使用用户名命名
            const workflow = buildComfyUIWorkflow({
                prompt: prompt || '',
                negative_prompt: negative_prompt || '',
                batch_size: batch_size || 2,
                width: 1080,
                height: 1440,
                steps: 30,
                cfg: 4,
                sampler_name: 'dpmpp_3m_sde_gpu',
                scheduler: 'karras',
                checkpoint_name: 'pornworksBadBoysPhoto.safetensors',
                seed: Math.floor(Math.random() * 2147483647),
                filename_prefix: `${username}-${character_name || 'image'}`
            });

            // 调用RunPod API
            const runpodResponse = await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_IMAGE_ENDPOINT_ID}/runsync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RUNPOD_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: { workflow }
                })
            });

            if (!runpodResponse.ok) {
                const errorText = await runpodResponse.text();
                console.error('❌ RunPod API error:', errorText);
                return new Response(JSON.stringify({ error: 'Image generation failed' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const runpodResult = await runpodResponse.json();
            console.log('✅ RunPod API response status:', runpodResult.status);

            if (runpodResult.status !== 'COMPLETED') {
                console.error('❌ RunPod generation failed:', runpodResult);
                return new Response(JSON.stringify({ error: 'Image generation failed' }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // 处理RunPod返回的图片URL（RunPod已经自动上传到他们的S3）
            const generatedImages = [];
            
            // 检查是否有output.images_url（RunPod自动上传的URL）
            if (runpodResult.output?.images_url && Array.isArray(runpodResult.output.images_url)) {
                console.log('✅ Using RunPod uploaded images:', runpodResult.output.images_url.length);
                for (let i = 0; i < runpodResult.output.images_url.length; i++) {
                    const imageUrl = runpodResult.output.images_url[i];
                    generatedImages.push({
                        filename: `${username}-${character_name || 'image'}_${Date.now()}_${i + 1}.png`,
                        url: imageUrl,
                        seed: runpodResult.output.seeds ? runpodResult.output.seeds[i] : Math.floor(Math.random() * 2147483647),
                        created_at: new Date().toISOString()
                    });
                }
            } 
            // 备用：如果没有images_url，尝试处理base64图片数据
            else if (runpodResult.output?.images && Array.isArray(runpodResult.output.images)) {
                console.log('✅ Processing base64 images:', runpodResult.output.images.length);
                for (let i = 0; i < runpodResult.output.images.length; i++) {
                    const imageData = runpodResult.output.images[i];
                    const imageBuffer = Buffer.from(imageData.image, 'base64');
                    const timestamp = Date.now();
                    const filename = `${username}/images/${timestamp}_${i + 1}.png`;

                    // 上传到R2
                    const uploadResult = await uploadToR2(imageBuffer, filename, env);
                    if (uploadResult.success) {
                        generatedImages.push({
                            filename: filename,
                            url: `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/${filename}`,
                            seed: imageData.seed || Math.floor(Math.random() * 2147483647),
                            created_at: new Date().toISOString()
                        });
                    } else {
                        console.error('❌ Failed to upload image:', uploadResult.error);
                    }
                }
            } else {
                console.error('❌ No images found in RunPod response');
                return new Response(JSON.stringify({ error: 'No images generated' }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // 返回结果
            return new Response(JSON.stringify({
                success: true,
                images: generatedImages,
                generation_time: runpodResult.output?.workflow_duration || 0,
                character_name: character_name,
                username: username
            }), {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });

        } catch (error) {
            console.error('❌ Generate Image API error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
}

// 构建ComfyUI工作流
function buildComfyUIWorkflow(params) {
    return {
        "1": {
            "inputs": {
                "ckpt_name": params.checkpoint_name
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "2": {
            "inputs": {
                "text": params.prompt,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "3": {
            "inputs": {
                "text": params.negative_prompt,
                "clip": ["1", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "4": {
            "inputs": {
                "width": params.width,
                "height": params.height,
                "batch_size": params.batch_size
            },
            "class_type": "EmptyLatentImage"
        },
        "5": {
            "inputs": {
                "seed": params.seed,
                "steps": params.steps,
                "cfg": params.cfg,
                "sampler_name": params.sampler_name,
                "scheduler": params.scheduler,
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            },
            "class_type": "KSampler"
        },
        "6": {
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            },
            "class_type": "VAEDecode"
        },
        "7": {
            "inputs": {
                "images": ["6", 0],
                "filename_prefix": params.filename_prefix || "Gcrush-image"
            },
            "class_type": "SaveImage"
        }
    };
}

// 上传到R2存储
async function uploadToR2(buffer, filename, env) {
    try {
        const r2Url = `https://c7c141ce43d175e60601edc46d904553.r2.cloudflarestorage.com/gcrush/${filename}`;
        
        // 创建AWS签名
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const date = timestamp.substr(0, 8);
        
        const response = await fetch(r2Url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length.toString(),
                'x-amz-content-sha256': await sha256(buffer),
                'x-amz-date': timestamp,
                'Authorization': await createAuthHeader(env, 'PUT', filename, timestamp, date, buffer)
            },
            body: buffer
        });

        if (response.ok) {
            return { success: true };
        } else {
            const errorText = await response.text();
            return { success: false, error: errorText };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 创建AWS签名头
async function createAuthHeader(env, method, filename, timestamp, date, buffer) {
    const region = 'auto';
    const service = 's3';
    const algorithm = 'AWS4-HMAC-SHA256';
    
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const credential = `${env.R2_ACCESS_KEY_ID}/${credentialScope}`;
    
    const canonicalRequest = [
        method,
        `/${filename}`,
        '',
        `host:c7c141ce43d175e60601edc46d904553.r2.cloudflarestorage.com`,
        `x-amz-content-sha256:${await sha256(buffer)}`,
        `x-amz-date:${timestamp}`,
        '',
        'host;x-amz-content-sha256;x-amz-date',
        await sha256(buffer)
    ].join('\n');
    
    const stringToSign = [
        algorithm,
        timestamp,
        credentialScope,
        await sha256(canonicalRequest)
    ].join('\n');
    
    const signature = await sign(stringToSign, env.R2_SECRET_ACCESS_KEY, date, region, service);
    
    return `${algorithm} Credential=${credential}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;
}

// SHA256哈希函数
async function sha256(data) {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// AWS签名函数
async function sign(stringToSign, secretKey, date, region, service) {
    const kDate = await hmac(`AWS4${secretKey}`, date);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, 'aws4_request');
    const signature = await hmac(kSigning, stringToSign);
    return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC函数
async function hmac(key, data) {
    const encoder = new TextEncoder();
    const keyBuffer = typeof key === 'string' ? encoder.encode(key) : key;
    const dataBuffer = encoder.encode(data);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
} 