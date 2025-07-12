// Debug endpoint to check environment variables
export async function onRequestGet(context) {
    const { env } = context;
    
    // Create a safe debug response (don't expose actual secrets)
    const debugInfo = {
        timestamp: new Date().toISOString(),
        envKeysCount: Object.keys(env || {}).length,
        envKeys: Object.keys(env || {}),
        envVariables: {
            RUNPOD_API_KEY: {
                exists: !!env.RUNPOD_API_KEY,
                length: env.RUNPOD_API_KEY ? env.RUNPOD_API_KEY.length : 0,
                prefix: env.RUNPOD_API_KEY ? env.RUNPOD_API_KEY.substring(0, 10) + '...' : 'NOT SET'
            },
            RUNPOD_TEXT_ENDPOINT_ID: {
                exists: !!env.RUNPOD_TEXT_ENDPOINT_ID,
                value: env.RUNPOD_TEXT_ENDPOINT_ID || 'NOT SET'
            },
            NEXT_PUBLIC_SUPABASE_URL: {
                exists: !!env.NEXT_PUBLIC_SUPABASE_URL,
                value: env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
            },
            NEXT_PUBLIC_SUPABASE_ANON_KEY: {
                exists: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                length: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0
            }
        }
    };
    
    // Log to Cloudflare console for debugging
    console.log('Environment Debug Info:', debugInfo);
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
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