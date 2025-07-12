// Environment variable injection script for Cloudflare Pages
// This script handles loading environment variables with proper fallbacks

(function() {
    'use strict';
    
    console.log('Environment injection script loading...');
    
    // Function to inject environment variables
    function injectEnvironmentVariables() {
        // Check if environment variables are already set
        if (window.RUNPOD_API_KEY !== undefined && window.RUNPOD_API_KEY !== '') {
            console.log('Environment variables already loaded');
            return;
        }
        
        // Try to load from various sources
        const sources = [
            // 1. Check meta tags
            function checkMetaTags() {
                const apiKey = document.querySelector('meta[name="runpod-api-key"]')?.content;
                const endpointId = document.querySelector('meta[name="runpod-endpoint-id"]')?.content;
                const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
                const supabaseKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
                
                if (apiKey) {
                    console.log('Loading environment from meta tags');
                    return {
                        RUNPOD_API_KEY: apiKey,
                        RUNPOD_TEXT_ENDPOINT_ID: endpointId || '4cx6jtjdx6hdhr',
                        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'https://kuflobojizyttadwcbhe.supabase.co',
                        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
                    };
                }
                return null;
            },
            
            // 2. Check Cloudflare-injected globals
            function checkCloudflareGlobals() {
                if (window.CF_RUNPOD_API_KEY || window.CF_PAGES_RUNPOD_API_KEY) {
                    console.log('Loading environment from Cloudflare globals');
                    return {
                        RUNPOD_API_KEY: window.CF_RUNPOD_API_KEY || window.CF_PAGES_RUNPOD_API_KEY,
                        RUNPOD_TEXT_ENDPOINT_ID: window.CF_RUNPOD_TEXT_ENDPOINT_ID || window.CF_PAGES_RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr',
                        NEXT_PUBLIC_SUPABASE_URL: window.CF_NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co',
                        NEXT_PUBLIC_SUPABASE_ANON_KEY: window.CF_NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
                    };
                }
                return null;
            },
            
            // 3. Check if already loaded by env-config.js
            function checkExistingGlobals() {
                if (window.RUNPOD_API_KEY && window.RUNPOD_API_KEY !== '') {
                    console.log('Environment variables already loaded by env-config.js');
                    return {
                        RUNPOD_API_KEY: window.RUNPOD_API_KEY,
                        RUNPOD_TEXT_ENDPOINT_ID: window.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr',
                        NEXT_PUBLIC_SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co',
                        NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
                    };
                }
                return null;
            },
            
            // 4. Default values for development
            function useDefaults() {
                console.warn('Using default environment configuration - API key may be missing');
                return {
                    RUNPOD_API_KEY: '',
                    RUNPOD_TEXT_ENDPOINT_ID: '4cx6jtjdx6hdhr',
                    NEXT_PUBLIC_SUPABASE_URL: 'https://kuflobojizyttadwcbhe.supabase.co',
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
                };
            }
        ];
        
        // Try each source in order
        for (const source of sources) {
            const config = source();
            if (config) {
                // Set RunPod variables
                window.RUNPOD_API_KEY = config.RUNPOD_API_KEY || window.RUNPOD_API_KEY || '';
                window.RUNPOD_TEXT_ENDPOINT_ID = config.RUNPOD_TEXT_ENDPOINT_ID || window.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';
                
                // Set Supabase variables
                window.NEXT_PUBLIC_SUPABASE_URL = config.NEXT_PUBLIC_SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co';
                window.NEXT_PUBLIC_SUPABASE_ANON_KEY = config.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
                
                console.log('Environment variables loaded from env-inject.js:', {
                    hasApiKey: !!window.RUNPOD_API_KEY,
                    apiKeyLength: window.RUNPOD_API_KEY ? window.RUNPOD_API_KEY.length : 0,
                    endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
                    hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
                    hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                    source: source.name
                });
                
                // Dispatch event to notify other scripts
                window.dispatchEvent(new CustomEvent('envConfigLoaded', {
                    detail: {
                        source: 'env-inject',
                        hasApiKey: !!window.RUNPOD_API_KEY
                    }
                }));
                
                return;
            }
        }
        
        console.error('Failed to load environment variables from any source');
    }
    
    // Try to load env-config.js from Cloudflare Function
    function loadEnvConfigFromFunction() {
        return fetch('/env-config.js')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(code => {
                console.log('Successfully loaded env-config.js from Cloudflare Function');
                // Execute the code
                try {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.textContent = code;
                    document.head.appendChild(script);
                    return true;
                } catch (error) {
                    console.error('Error executing env-config.js:', error);
                    return false;
                }
            })
            .catch(error => {
                console.warn('Failed to load env-config.js from Cloudflare Function:', error.message);
                return false;
            });
    }
    
    // Initialize environment variables
    async function initializeEnvironment() {
        console.log('Initializing environment variables...');
        
        // First try to load from Cloudflare Function
        const loadedFromFunction = await loadEnvConfigFromFunction();
        
        // If that fails, use the injection method
        if (!loadedFromFunction) {
            console.log('Falling back to environment injection');
            injectEnvironmentVariables();
        }
        
        // Wait a bit for any async loading to complete
        setTimeout(() => {
            console.log('Final environment check:', {
                hasApiKey: !!window.RUNPOD_API_KEY,
                apiKeyLength: window.RUNPOD_API_KEY ? window.RUNPOD_API_KEY.length : 0,
                endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
                hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
                hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY
            });
        }, 100);
    }
    
    // Start initialization
    initializeEnvironment();
    
    // Also make available globally for manual loading
    window.injectEnvironmentVariables = injectEnvironmentVariables;
    window.initializeEnvironment = initializeEnvironment;
    
    // Listen for env-config loaded events
    window.addEventListener('envConfigLoaded', function(event) {
        console.log('Environment configuration loaded:', event.detail);
    });
    
})();