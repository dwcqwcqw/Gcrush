// Debug endpoint to check environment variables on Cloudflare Pages
export async function onRequestGet(context) {
    const { env } = context;
    
    // Create a safe representation of environment variables
    const envInfo = {
        timestamp: new Date().toISOString(),
        availableKeys: Object.keys(env || {}),
        runpodConfig: {
            hasApiKey: !!env.RUNPOD_API_KEY,
            apiKeyLength: env.RUNPOD_API_KEY ? env.RUNPOD_API_KEY.length : 0,
            apiKeyPrefix: env.RUNPOD_API_KEY ? env.RUNPOD_API_KEY.substring(0, 8) + '...' : 'NOT SET',
            endpointId: env.RUNPOD_TEXT_ENDPOINT_ID || 'NOT SET'
        },
        supabaseConfig: {
            hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
            url: env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
            hasAnonKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            anonKeyLength: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0
        },
        allEnvVars: {}
    };
    
    // Add first 10 characters of each environment variable (safe for debugging)
    Object.keys(env || {}).forEach(key => {
        const value = env[key];
        if (typeof value === 'string') {
            envInfo.allEnvVars[key] = {
                length: value.length,
                preview: value.length > 10 ? value.substring(0, 10) + '...' : value,
                type: 'string'
            };
        } else {
            envInfo.allEnvVars[key] = {
                type: typeof value,
                value: value
            };
        }
    });
    
    return new Response(JSON.stringify(envInfo, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}