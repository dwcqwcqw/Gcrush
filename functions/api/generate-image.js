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
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
            }

            // 验证用户认证
            const { user_id, prompt, negative_prompt, batch_size, character_name, loading_id } = requestData;
            if (!user_id) {
                return new Response(JSON.stringify({ error: 'User authentication required' }), {
                    status: 401,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // 获取用户信息以便命名图片
            let username = 'user';
            try {
                // 尝试从Supabase获取用户名
                if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    const supabaseResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user_id}&select=username,display_name`, {
                        headers: {
                            'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                        }
                    });
                    if (supabaseResponse.ok) {
                        const profiles = await supabaseResponse.json();
                        if (profiles && profiles.length > 0) {
                            username = profiles[0].username || profiles[0].display_name || 'user';
                        }
                    } else {
                        console.warn('⚠️ Failed to fetch user profile:', supabaseResponse.status, await supabaseResponse.text());
                    }
                }
            } catch (error) {
                console.log('Could not fetch username, using default:', error.message);
            }

            console.log('📝 Received prompt:', prompt);
            console.log('📝 Received negative_prompt:', negative_prompt);
            
            // 构建ComfyUI工作流，使用用户名命名
            const workflow = buildComfyUIWorkflow({
                prompt: prompt || '',
                negative_prompt: negative_prompt || '(worst quality:2), (low quality:2), (blurry:2), (deformed), (disfigured), (bad anatomy), (wrong anatomy), (extra limb), (missing limb), (floating limbs), (mutated hands and fingers), (disconnected limbs), (mutation), (mutated), (ugly), (disgusting), (amputation), (signature), (watermark), (username), (blurry), (artist name), (out of focus), (ugly), (duplicate), (morbid), (mutilated), (extra fingers), (mutated hands), (poorly drawn hands), (poorly drawn face), (mutation), (deformed), (bad anatomy), (bad proportions), (extra limbs), (cloned face), (disfigured), (gross proportions), (malformed limbs), (missing arms), (missing legs), (extra arms), (extra legs), (fused fingers), (too many fingers), (long neck), (cross-eyed), (mutated), (bad body), (unnatural body), (unnatural skin), (weird colors), (skin spots), (acnes), (skin blemishes), (age spot), (glans), (nsfw), (nipples), (nude), (nudity), (topless), (partial nudity), (sexual), (sex), (sexy), (erotic), (porn), (pornographic), (xxx), (adult), (mature), (explicit), (inappropriate), (uncensored), (censored), (mosaic), (bar censor), (convenient censoring), (glowing), (distorted), (blurred), (grain), (poorly drawn), (mutated), (lowres), (low resolution), (bad), (error), (pattern), (beginner), (worst), (jpeg artifacts), (low quality), (unfinished), (chromatic aberration), (scan), (scan artifacts), (amateur), (extra), (fewer), (cropped), (worst quality), (low quality), (normal quality), (lowres), (monochrome), (grayscale), (skin spots), (acnes), (skin blemishes), (DeepNegative), (fat), (paintings), (sketches), (normal quality), (lowres), (blurry), (bad anatomy), (bad hands), (cropped), (extra digit), (fewer digits), (extra fingers), (missing fingers), (bad hands), (bad hand anatomy), (missing limb), (floating limbs), (disconnected limbs), (malformed hands), (blur), (out of focus), (long body), (disgusting), (childish), (mutated), (mangled), (old), (surreal), (duplicate), (morbid), (mutilated), (poorly drawn face), (deformed), (bad anatomy), (bad proportions), (extra limbs), (cloned face), (disfigured), (gross proportions), (malformed limbs), (missing arms), (missing legs), (extra arms), (extra legs), (fused fingers), (too many fingers), (long neck), (ugly), (tiling), (poorly drawn hands), (poorly drawn), (poorly drawn face), (out of frame), (extra limbs), (disfigured), (deformed), (body out of frame), (bad anatomy), (watermark), (signature), (cut off), (low contrast), (underexposed), (score_4), (score_5), (score_6)',
                batch_size: batch_size || 1,
                width: 768,   // 3:4竖长 - 宽度
                height: 1024, // 3:4竖长 - 高度  
                steps: 30,
                cfg: 3,       // CFG值设为3，让生成更自然
                sampler_name: 'dpmpp_3m_sde_gpu',
                scheduler: 'karras',
                checkpoint_name: 'pornworksBadBoysPhoto.safetensors',
                seed: Math.floor(Math.random() * 2147483647),
                filename_prefix: `gcrush-${username}-${character_name || 'image'}`
            });

            // 调用RunPod API - 设置3分钟超时
            console.log('🔗 Calling RunPod API...');
            console.log('🔗 RunPod URL:', `https://api.runpod.ai/v2/${env.RUNPOD_IMAGE_ENDPOINT_ID}/runsync`);
            console.log('🔑 API Key (first 10 chars):', env.RUNPOD_API_KEY?.substring(0, 10) + '...');
            console.log('⏱️ Setting 3-minute timeout for image generation...');
            
            // 创建AbortController用于超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 180000); // 3分钟 = 180秒
            
            let runpodResponse;
            try {
                runpodResponse = await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_IMAGE_ENDPOINT_ID}/runsync`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RUNPOD_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        input: { workflow }
                    }),
                    signal: controller.signal
                });
                
                // 清除超时器
                clearTimeout(timeoutId);
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    console.error('❌ RunPod API timeout after 3 minutes');
                    return new Response(JSON.stringify({ 
                        error: 'Image generation timeout',
                        message: 'The image generation took longer than 3 minutes. Please try again.',
                        timeout: true,
                        debug: 'RunPod API request timed out after 3 minutes'
                    }), {
                        status: 408, // Request Timeout
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                } else {
                    console.error('❌ RunPod API fetch error:', fetchError);
                    return new Response(JSON.stringify({ 
                        error: 'Network error',
                        message: 'Failed to connect to image generation service. Please try again.',
                        network_error: true,
                        debug: fetchError.message
                    }), {
                        status: 500,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                }
            }

            console.log('📡 RunPod Response Status:', runpodResponse.status, runpodResponse.statusText);
            console.log('📋 RunPod Response Headers:');
            for (let [key, value] of runpodResponse.headers) {
                console.log(`  ${key}: ${value}`);
            }

            const runpodResponseText = await runpodResponse.text();
            console.log('📄 RunPod Raw Response:', runpodResponseText);

            if (!runpodResponse.ok) {
                console.error('❌ RunPod API error - Response not OK');
                console.error('❌ Status:', runpodResponse.status, runpodResponse.statusText);
                console.error('❌ Response body:', runpodResponseText);
                
                return new Response(JSON.stringify({ 
                    error: 'RunPod API request failed',
                    runpod_status: runpodResponse.status,
                    runpod_status_text: runpodResponse.statusText,
                    runpod_response: runpodResponseText,
                    debug: 'RunPod API returned non-200 status code'
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            let runpodResult;
            try {
                runpodResult = JSON.parse(runpodResponseText);
            } catch (parseError) {
                console.error('❌ Failed to parse RunPod JSON response:', parseError);
                console.error('❌ Raw response that failed to parse:', runpodResponseText);
                
                return new Response(JSON.stringify({ 
                    error: 'RunPod API returned invalid JSON',
                    runpod_response: runpodResponseText,
                    parse_error: parseError.message,
                    debug: 'Failed to parse RunPod response as JSON'
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            console.log('✅ RunPod API response status:', runpodResult.status);
            console.log('🔍 Full RunPod response structure:', JSON.stringify(runpodResult, null, 2));
            
            // 创建详细的调试日志文件
            const debugLog = {
                timestamp: new Date().toISOString(),
                request: {
                    user_id,
                    prompt: prompt.substring(0, 100) + '...',
                    character_name,
                    batch_size
                },
                runpod_response: runpodResult,
                response_analysis: {
                    status: runpodResult.status,
                    has_output: !!runpodResult.output,
                    output_type: typeof runpodResult.output,
                    output_keys: runpodResult.output ? Object.keys(runpodResult.output) : []
                }
            };
            console.log('📋 Debug log created:', JSON.stringify(debugLog, null, 2));
            
            // 额外的调试信息
            console.log('=== DETAILED RUNPOD ANALYSIS ===');
            console.log('RunPod result type:', typeof runpodResult);
            console.log('RunPod result keys:', Object.keys(runpodResult));
            if (runpodResult.output) {
                console.log('Output exists:', true);
                console.log('Output type:', typeof runpodResult.output);
                console.log('Output keys:', Object.keys(runpodResult.output));
                if (runpodResult.output.images) {
                    console.log('Images field exists:', true);
                    console.log('Images type:', typeof runpodResult.output.images);
                    console.log('Images is array:', Array.isArray(runpodResult.output.images));
                    console.log('Images length:', runpodResult.output.images.length);
                    if (Array.isArray(runpodResult.output.images)) {
                        runpodResult.output.images.forEach((img, i) => {
                            console.log(`Image ${i} type:`, typeof img);
                            console.log(`Image ${i} content:`, img);
                            if (typeof img === 'object') {
                                console.log(`Image ${i} keys:`, Object.keys(img));
                            }
                        });
                    }
                } else {
                    console.log('Images field exists:', false);
                }
            } else {
                console.log('Output exists:', false);
            }
            console.log('=== END DETAILED ANALYSIS ===');
            
            if (runpodResult.output) {
                console.log('📋 Available output fields:', Object.keys(runpodResult.output));
                console.log('🖼️ Images field exists:', !!runpodResult.output.images);
                console.log('🖼️ Images field type:', typeof runpodResult.output.images);
                console.log('🖼️ Images array length:', runpodResult.output.images ? runpodResult.output.images.length : 'N/A');
                
                // 检查images数组的内容
                if (runpodResult.output.images && Array.isArray(runpodResult.output.images)) {
                    runpodResult.output.images.forEach((img, index) => {
                        console.log(`🔍 Image ${index + 1} structure:`, typeof img);
                        console.log(`🔍 Image ${index + 1} keys:`, typeof img === 'object' ? Object.keys(img) : 'Not an object');
                        console.log(`🔍 Image ${index + 1} full data:`, img);
                    });
                }
            }

            if (runpodResult.status !== 'COMPLETED') {
                console.error('❌ RunPod generation failed - Status not COMPLETED');
                console.error('❌ RunPod status:', runpodResult.status);
                console.error('❌ RunPod error:', runpodResult.error);
                console.error('❌ Full RunPod result:', runpodResult);
                
                return new Response(JSON.stringify({ 
                    error: 'Image generation failed',
                    runpod_status: runpodResult.status,
                    runpod_error: runpodResult.error || 'Unknown error',
                    runpod_output: runpodResult.output || null,
                    debug: 'RunPod status is not COMPLETED',
                    full_runpod_response: runpodResult
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // 处理RunPod返回的图片URL（RunPod已经自动上传到他们的S3）
            const generatedImages = [];
            
            // 从RunPod响应中提取实际的S3 URL
            console.log('🔍 Analyzing RunPod response for image extraction...');
            
            // 首先检查RunPod output的结构
            if (runpodResult.output) {
                console.log('📋 RunPod output structure:', Object.keys(runpodResult.output));
                
                // 方法1：检查ComfyUI的标准输出格式 - 通常是数字键名的节点
                const outputKeys = Object.keys(runpodResult.output);
                for (const key of outputKeys) {
                    const outputData = runpodResult.output[key];
                    console.log(`🔍 Checking output key '${key}':`, outputData);
                    
                    // ComfyUI SaveImage节点通常输出格式为 { "images": [...] }
                    if (outputData && outputData.images && Array.isArray(outputData.images)) {
                        console.log(`✅ Found images in output.${key}.images:`, outputData.images.length);
                        
                        for (let i = 0; i < outputData.images.length; i++) {
                            const imageData = outputData.images[i];
                            console.log(`📋 Image ${i + 1} data:`, imageData);
                            
                            let imageUrl = extractImageUrl(imageData);
                            if (imageUrl) {
                                const publicUrl = convertToPublicR2Url(imageUrl);
                                console.log(`🔄 Converting URL: ${imageUrl} -> ${publicUrl}`);
                                
                                generatedImages.push({
                                    filename: imageData.filename || `${username}-${character_name || 'image'}_${Date.now()}_${i + 1}.png`,
                                    url: publicUrl,
                                    seed: imageData.seed || Math.floor(Math.random() * 2147483647),
                                    created_at: new Date().toISOString()
                                });
                                console.log(`✅ Added image ${i + 1} to results`);
                            }
                        }
                        
                        // 如果找到图片就跳出循环
                        if (generatedImages.length > 0) break;
                    }
                }
                
                // 方法2：检查传统的images数组
                if (generatedImages.length === 0 && runpodResult.output.images && Array.isArray(runpodResult.output.images)) {
                    console.log('✅ Found images in output.images:', runpodResult.output.images.length);
                    
                    for (let i = 0; i < runpodResult.output.images.length; i++) {
                        const imageData = runpodResult.output.images[i];
                        console.log(`📋 Image ${i + 1} data:`, imageData);
                        
                        let imageUrl = extractImageUrl(imageData);
                        if (imageUrl) {
                            const publicUrl = convertToPublicR2Url(imageUrl);
                            console.log(`🔄 Converting URL: ${imageUrl} -> ${publicUrl}`);
                            
                            generatedImages.push({
                                filename: imageData.filename || `${username}-${character_name || 'image'}_${Date.now()}_${i + 1}.png`,
                                url: publicUrl,
                                seed: imageData.seed || Math.floor(Math.random() * 2147483647),
                                created_at: new Date().toISOString()
                            });
                            console.log(`✅ Added image ${i + 1} to results`);
                        }
                    }
                }
                
                // 方法3：检查其他可能的字段
                if (generatedImages.length === 0) {
                    console.log('⚠️ No images found in standard locations, checking alternative fields...');
                    
                    const possibleImageFields = ['image_urls', 's3_urls', 'urls', 'generated_images', 'results', 'files'];
                    for (const field of possibleImageFields) {
                        if (runpodResult.output[field]) {
                            console.log(`🔍 Checking field: ${field}`, runpodResult.output[field]);
                            if (Array.isArray(runpodResult.output[field])) {
                                runpodResult.output[field].forEach((item, i) => {
                                    const imageUrl = extractImageUrl(item);
                                    if (imageUrl) {
                                        const publicUrl = convertToPublicR2Url(imageUrl);
                                        generatedImages.push({
                                            filename: `${username}-${character_name || 'image'}_${Date.now()}_${i + 1}.png`,
                                            url: publicUrl,
                                            seed: Math.floor(Math.random() * 2147483647),
                                            created_at: new Date().toISOString()
                                        });
                                        console.log(`✅ Found image via ${field}[${i}]`);
                                    }
                                });
                                
                                // 如果找到图片就跳出循环
                                if (generatedImages.length > 0) break;
                            }
                        }
                    }
                }
            }
            
            // 最后的fallback机制 - 如果真的找不到图片就返回错误
            if (generatedImages.length === 0) {
                console.error('❌ No images found in RunPod response after comprehensive analysis');
                console.log('🔍 Full RunPod output for debugging:', JSON.stringify(runpodResult.output, null, 2));
                
                return new Response(JSON.stringify({ 
                    error: 'No images generated',
                    debug: 'Images were expected but not found in RunPod API response',
                    runpod_output: runpodResult.output,
                    runpod_status: runpodResult.status,
                    suggestion: 'Check RunPod endpoint configuration and ComfyUI workflow',
                    full_runpod_response: runpodResult
                }), {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            console.log(`✅ Successfully extracted ${generatedImages.length} images`);
            generatedImages.forEach((img, i) => {
                console.log(`📸 Image ${i + 1}: ${img.url}`);
            });

            // 保存图片到用户画廊数据库
            try {
                console.log('🔍 Checking Supabase environment variables...');
                console.log('• NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Available' : '❌ Missing');
                console.log('• NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Available' : '❌ Missing');
                
                if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                    console.log('💾 Saving images to user gallery...');
                    console.log('📊 Generated images count:', generatedImages.length);
                    
                    for (let i = 0; i < generatedImages.length; i++) {
                        const image = generatedImages[i];
                        console.log(`📸 Processing image ${i + 1}/${generatedImages.length}:`, image.filename);
                        
                        const galleryData = {
                            user_id: user_id,
                            image_url: image.url,
                            filename: image.filename,
                            prompt: prompt,
                            negative_prompt: negative_prompt,
                            character_name: character_name,
                            seed: image.seed,
                            generation_params: {
                                width: 768,
                                height: 1024,
                                steps: 30,
                                cfg: 3,
                                sampler_name: 'dpmpp_3m_sde_gpu',
                                scheduler: 'karras',
                                batch_size: batch_size || 1
                            }
                        };
                        
                        console.log(`📤 Sending gallery data for image ${i + 1}:`, JSON.stringify(galleryData, null, 2));
                        
                        const saveResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_gallery`, {
                            method: 'POST',
                            headers: {
                                'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=minimal'
                            },
                            body: JSON.stringify(galleryData)
                        });
                        
                        console.log(`📡 Supabase response status for image ${i + 1}:`, saveResponse.status, saveResponse.statusText);
                        
                        if (saveResponse.ok) {
                            console.log(`✅ Successfully saved image ${i + 1} to gallery: ${image.filename}`);
                            const responseText = await saveResponse.text();
                            if (responseText) {
                                console.log(`📋 Supabase response body:`, responseText);
                            }
                        } else {
                            const errorText = await saveResponse.text();
                            console.error(`❌ Failed to save image ${i + 1} to gallery:`, errorText);
                            console.error(`📋 Response headers:`, [...saveResponse.headers.entries()]);
                        }
                    }
                    
                    // 如果有loading_id，更新加载状态为完成状态
                    if (loading_id && generatedImages.length > 0) {
                        console.log('🔄 Updating loading state to completed...');
                        try {
                            const firstImage = generatedImages[0];
                            const updateResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_gallery?id=eq.${loading_id}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                                    'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify({
                                    image_url: firstImage.url,
                                    filename: firstImage.filename,
                                    seed: firstImage.seed,
                                                                         generation_params: {
                                         status: 'completed',
                                         completed_at: new Date().toISOString(),
                                         width: 768,
                                         height: 1024,
                                        steps: 30,
                                        cfg: 3,
                                        sampler_name: 'dpmpp_3m_sde_gpu',
                                        scheduler: 'karras',
                                        batch_size: batch_size || 1
                                    }
                                })
                            });
                            
                            if (updateResponse.ok) {
                                console.log('✅ Loading state updated successfully');
                            } else {
                                const errorText = await updateResponse.text();
                                console.error('❌ Failed to update loading state:', errorText);
                            }
                        } catch (updateError) {
                            console.error('❌ Error updating loading state:', updateError);
                        }
                    }
                } else {
                    console.error('❌ Supabase environment variables not available');
                    console.error('• Missing NEXT_PUBLIC_SUPABASE_URL:', !env.NEXT_PUBLIC_SUPABASE_URL);
                    console.error('• Missing NEXT_PUBLIC_SUPABASE_ANON_KEY:', !env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
                }
            } catch (galleryError) {
                console.error('❌ Error saving to gallery:', galleryError);
                console.error('❌ Gallery error stack:', galleryError.stack);
                // 不影响图片生成的主要流程，只记录错误
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
            console.error('❌ Error stack:', error.stack);
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                error_message: error.message,
                error_stack: error.stack,
                debug: 'Unexpected error in generate-image API'
            }), {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
}

// 从图片数据中提取URL的辅助函数
function extractImageUrl(imageData) {
    console.log('🔍 Extracting URL from:', typeof imageData, imageData);
    
    if (!imageData) return null;
    
    // 如果是字符串且以http开头，直接返回
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
        console.log('✅ Found direct URL string:', imageData);
        return imageData;
    }
    
    // 如果是对象，检查各种可能的URL字段
    if (typeof imageData === 'object') {
        // 首先检查RunPod特有的data字段（这是我们从日志中发现的）
        if (imageData.data && typeof imageData.data === 'string' && imageData.data.startsWith('http')) {
            console.log('✅ Found URL in data field (RunPod format):', imageData.data);
            return imageData.data;
        }
        
        // 检查常见的URL字段
        const urlFields = ['url', 's3_url', 'image_url', 'file_url', 'path', 'src', 'filename'];
        for (const field of urlFields) {
            if (imageData[field] && typeof imageData[field] === 'string' && imageData[field].startsWith('http')) {
                console.log(`✅ Found URL in field '${field}':`, imageData[field]);
                return imageData[field];
            }
        }
        
        // 特殊情况：检查是否有嵌套的URL
        if (imageData.image && typeof imageData.image === 'string' && imageData.image.startsWith('http')) {
            console.log('✅ Found URL in nested image field:', imageData.image);
            return imageData.image;
        }
        
        // 检查ComfyUI特有的字段
        if (imageData.outputs && Array.isArray(imageData.outputs)) {
            for (const output of imageData.outputs) {
                if (output.url || output.filename) {
                    const url = output.url || output.filename;
                    if (typeof url === 'string' && url.startsWith('http')) {
                        console.log('✅ Found URL in outputs array:', url);
                        return url;
                    }
                }
            }
        }
    }
    
    console.log('❌ No URL found in image data');
    return null;
}

// 将RunPod的内部S3 URL转换为Public R2 URL - 修复版本
function convertToPublicR2Url(runpodUrl) {
    try {
        console.log('🔗 Converting URL:', runpodUrl);
        
        // 检查是否已经是公共URL
        if (runpodUrl.includes('pub-5a18b069cd06445889010bf8c29132d6.r2.dev')) {
            console.log('✅ URL is already in public format:', runpodUrl);
            return runpodUrl;
        }
        
        // RunPod URL格式: https://c7c141ce43d175e60601edc46d904553.r2.cloudflarestorage.com/image-generation/07-25/sync-xxx/file.png?X-Amz-...
        // 需要转换为: https://pub-5a18b069cd06445889010bf8c29132d6.r2.dev/07-25/sync-xxx/file.png
        if (runpodUrl.includes('c7c141ce43d175e60601edc46d904553.r2.cloudflarestorage.com')) {
            // 移除查询参数
            const urlWithoutQuery = runpodUrl.split('?')[0];
            
            // 提取路径部分（image-generation/...）
            const urlParts = urlWithoutQuery.split('/');
            const pathIndex = urlParts.findIndex(part => part === 'image-generation');
            
            if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
                // 获取image-generation之后的完整路径
                const pathAfterImageGeneration = urlParts.slice(pathIndex + 1).join('/');
                // 构建公共URL，保持原始的目录结构
                const publicUrl = `https://pub-5a18b069cd06445889010bf8c29132d6.r2.dev/${pathAfterImageGeneration}`;
                console.log('✅ Converted to public URL:', publicUrl);
                return publicUrl;
            }
            
            // 如果找不到image-generation路径，尝试直接提取后面的路径
            const imageGenerationIndex = runpodUrl.indexOf('/image-generation/');
            if (imageGenerationIndex !== -1) {
                const pathAfterImageGeneration = runpodUrl.substring(imageGenerationIndex + '/image-generation/'.length);
                // 移除查询参数
                const cleanPath = pathAfterImageGeneration.split('?')[0];
                const publicUrl = `https://pub-5a18b069cd06445889010bf8c29132d6.r2.dev/${cleanPath}`;
                console.log('✅ Converted to public URL (method 2):', publicUrl);
                return publicUrl;
            }
        }
        
        // 如果无法转换，返回原URL
        console.warn('⚠️ Could not convert URL to public format:', runpodUrl);
        return runpodUrl;
    } catch (error) {
        console.error('❌ Error converting URL:', error);
        return runpodUrl;
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