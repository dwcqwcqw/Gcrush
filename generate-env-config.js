// Generate environment configuration for Cloudflare Pages
// This script creates env-config.js with environment variables

const fs = require('fs');

// Get environment variables
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || '';
const RUNPOD_TEXT_ENDPOINT_ID = process.env.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co';
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

// Generate the configuration file content
const configContent = `// Auto-generated environment configuration
// Generated at build time for Cloudflare Pages

window.RUNPOD_API_KEY = '${RUNPOD_API_KEY}';
window.RUNPOD_TEXT_ENDPOINT_ID = '${RUNPOD_TEXT_ENDPOINT_ID}';
window.NEXT_PUBLIC_SUPABASE_URL = '${NEXT_PUBLIC_SUPABASE_URL}';
window.NEXT_PUBLIC_SUPABASE_ANON_KEY = '${NEXT_PUBLIC_SUPABASE_ANON_KEY}';

console.log('Environment configuration loaded:', {
    hasApiKey: !!window.RUNPOD_API_KEY,
    endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
    hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY
});
`;

// Write the configuration file to the root directory
fs.writeFileSync('env-config.js', configContent);
console.log('Environment configuration generated successfully');

// Also ensure public directory exists and copy there
const publicDir = './public';
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(`${publicDir}/env-config.js`, configContent);
console.log('Environment configuration also copied to public directory'); 