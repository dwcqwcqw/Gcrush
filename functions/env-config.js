// Cloudflare Function to serve env-config.js dynamically

export async function onRequestGet(context) {
    const { env } = context;
    
    // Generate the environment configuration dynamically
    const configContent = `// Auto-generated environment configuration
// Generated at runtime by Cloudflare Pages

window.RUNPOD_API_KEY = '${env.RUNPOD_API_KEY || ''}';
window.RUNPOD_TEXT_ENDPOINT_ID = '${env.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr'}';
window.NEXT_PUBLIC_SUPABASE_URL = '${env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co'}';
window.NEXT_PUBLIC_SUPABASE_ANON_KEY = '${env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'}';

console.log('Environment configuration loaded:', {
    hasApiKey: !!window.RUNPOD_API_KEY,
    endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
    hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY
});`;

    return new Response(configContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        }
    });
}