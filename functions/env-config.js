// Cloudflare Pages Function to serve env-config.js dynamically
// This file handles requests to /env-config.js

// Handle OPTIONS requests for CORS
export async function onRequestOptions(context) {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}

export async function onRequestGet(context) {
    const { env } = context;
    
    // Log available environment variables for debugging
    console.log('Cloudflare Pages Function - Available env keys:', Object.keys(env || {}));
    console.log('RUNPOD_API_KEY exists:', !!env.RUNPOD_API_KEY);
    console.log('RUNPOD_TEXT_ENDPOINT_ID exists:', !!env.RUNPOD_TEXT_ENDPOINT_ID);
    
    // Get environment variables with proper fallbacks
    const runpodApiKey = env.RUNPOD_API_KEY || '';
    const runpodEndpointId = env.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co';
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
    
    // Generate the environment configuration JavaScript
    const configContent = `// Auto-generated environment configuration
// Generated at runtime by Cloudflare Pages Function
// Timestamp: ${new Date().toISOString()}

(function() {
    'use strict';
    
    console.log('Loading environment configuration from Cloudflare Function...');
    
    // Set environment variables
    window.RUNPOD_API_KEY = '${runpodApiKey}';
    window.RUNPOD_TEXT_ENDPOINT_ID = '${runpodEndpointId}';
    window.NEXT_PUBLIC_SUPABASE_URL = '${supabaseUrl}';
    window.NEXT_PUBLIC_SUPABASE_ANON_KEY = '${supabaseKey}';
    
    // Log configuration status
    console.log('Environment configuration loaded from Cloudflare Function:', {
        hasApiKey: !!window.RUNPOD_API_KEY,
        apiKeyLength: window.RUNPOD_API_KEY ? window.RUNPOD_API_KEY.length : 0,
        endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
        hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
    });
    
    // Dispatch event to notify other scripts
    window.dispatchEvent(new CustomEvent('envConfigLoaded', {
        detail: {
            source: 'cloudflare-function',
            hasApiKey: !!window.RUNPOD_API_KEY,
            timestamp: new Date().toISOString()
        }
    }));
    
    // Also set a flag to indicate successful loading
    window.ENV_CONFIG_LOADED = true;
    
})();`;

    return new Response(configContent, {
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}