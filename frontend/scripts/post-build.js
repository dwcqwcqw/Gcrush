#!/usr/bin/env node

// Post-build script to ensure env-config.js is generated with correct MIME type
const fs = require('fs');
const path = require('path');

console.log('Running post-build script...');

// Get environment variables from process.env or use defaults
const envConfig = {
    RUNPOD_API_KEY: process.env.RUNPOD_API_KEY || '',
    RUNPOD_TEXT_ENDPOINT_ID: process.env.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
};

// Generate env-config.js content
const envConfigContent = `// Auto-generated environment configuration
// Generated at build time by post-build.js
// MIME type: application/javascript

(function() {
    'use strict';
    
    // Environment configuration
    window.RUNPOD_API_KEY = '${envConfig.RUNPOD_API_KEY}';
    window.RUNPOD_TEXT_ENDPOINT_ID = '${envConfig.RUNPOD_TEXT_ENDPOINT_ID}';
    window.NEXT_PUBLIC_SUPABASE_URL = '${envConfig.NEXT_PUBLIC_SUPABASE_URL}';
    window.NEXT_PUBLIC_SUPABASE_ANON_KEY = '${envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
    
    // Log configuration status
    console.log('Environment configuration loaded from env-config.js:', {
        hasApiKey: !!window.RUNPOD_API_KEY,
        endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
        hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        timestamp: new Date().toISOString()
    });
    
    // Also set on window.ENV for backward compatibility
    window.ENV = window.ENV || {};
    Object.assign(window.ENV, {
        RUNPOD_API_KEY: window.RUNPOD_API_KEY,
        RUNPOD_TEXT_ENDPOINT_ID: window.RUNPOD_TEXT_ENDPOINT_ID,
        NEXT_PUBLIC_SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
})();
`;

// Paths to write the file
const outputPaths = [
    path.join(process.cwd(), 'env-config.js'),
    path.join(process.cwd(), 'public', 'env-config.js'),
    path.join(process.cwd(), 'frontend', 'public', 'env-config.js')
];

// Write to all possible locations
outputPaths.forEach(outputPath => {
    try {
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write the file
        fs.writeFileSync(outputPath, envConfigContent, 'utf8');
        console.log(`✓ Generated ${outputPath}`);
    } catch (error) {
        console.error(`✗ Failed to generate ${outputPath}:`, error.message);
    }
});

// Also create a .headers file for Cloudflare Pages to ensure correct MIME type
const headersContent = `/env-config.js
  Content-Type: application/javascript
  Cache-Control: no-cache

/*.js
  Content-Type: application/javascript
`;

try {
    fs.writeFileSync(path.join(process.cwd(), '_headers'), headersContent, 'utf8');
    console.log('✓ Generated _headers file for correct MIME types');
} catch (error) {
    console.error('✗ Failed to generate _headers file:', error.message);
}

console.log('Post-build script completed!');