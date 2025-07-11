// Generate environment configuration for Cloudflare Pages
// This script creates env-config.js with environment variables

const fs = require('fs');

// Get environment variables
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || '';
const RUNPOD_TEXT_ENDPOINT_ID = process.env.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';

// Generate the configuration file content
const configContent = `// Auto-generated environment configuration
// Generated at build time for Cloudflare Pages

window.RUNPOD_API_KEY = '${RUNPOD_API_KEY}';
window.RUNPOD_TEXT_ENDPOINT_ID = '${RUNPOD_TEXT_ENDPOINT_ID}';

console.log('Environment configuration loaded:', {
    hasApiKey: !!window.RUNPOD_API_KEY,
    endpointId: window.RUNPOD_TEXT_ENDPOINT_ID
});
`;

// Write the configuration file
fs.writeFileSync('env-config.js', configContent);
console.log('Environment configuration generated successfully'); 