// Environment variable loader for Cloudflare Pages
// This script loads environment variables from Cloudflare Pages build environment

// Function to load environment variables
function loadEnvironmentVariables() {
    // Check if we're in a Cloudflare Pages environment
    if (typeof window !== 'undefined') {
        // These will be injected by Cloudflare Pages build process
        // or set via Cloudflare Pages dashboard environment variables
        
        // Try to get from meta tags first (if injected during build)
        const runpodApiKey = document.querySelector('meta[name="runpod-api-key"]')?.content;
        const runpodEndpointId = document.querySelector('meta[name="runpod-endpoint-id"]')?.content;
        
        // Set global variables for config.js to use
        if (runpodApiKey) {
            window.RUNPOD_API_KEY = runpodApiKey;
        }
        
        if (runpodEndpointId) {
            window.RUNPOD_TEXT_ENDPOINT_ID = runpodEndpointId;
        }
        
        // Fallback: try to get from global variables if they were injected
        window.RUNPOD_API_KEY = window.RUNPOD_API_KEY || window.CF_RUNPOD_API_KEY;
        window.RUNPOD_TEXT_ENDPOINT_ID = window.RUNPOD_TEXT_ENDPOINT_ID || window.CF_RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';
        
        console.log('Environment variables loaded:', {
            hasApiKey: !!window.RUNPOD_API_KEY,
            endpointId: window.RUNPOD_TEXT_ENDPOINT_ID
        });
    }
}

// Load environment variables immediately
loadEnvironmentVariables();

// Also export for manual loading if needed
if (typeof window !== 'undefined') {
    window.loadEnvironmentVariables = loadEnvironmentVariables;
} 