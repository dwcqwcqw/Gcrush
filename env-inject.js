// Environment variable injection script for Cloudflare Pages
// This script handles loading environment variables with proper fallbacks

(function() {
    'use strict';
    
    // Function to inject environment variables
    function injectEnvironmentVariables() {
        // Check if environment variables are already set
        if (window.RUNPOD_API_KEY !== undefined) {
            console.log('Environment variables already loaded');
            return;
        }
        
        // Try to load from various sources
        const sources = [
            // 1. Check meta tags
            () => {
                const apiKey = document.querySelector('meta[name="runpod-api-key"]')?.content;
                const endpointId = document.querySelector('meta[name="runpod-endpoint-id"]')?.content;
                if (apiKey) {
                    return {
                        RUNPOD_API_KEY: apiKey,
                        RUNPOD_TEXT_ENDPOINT_ID: endpointId || '4cx6jtjdx6hdhr'
                    };
                }
                return null;
            },
            
            // 2. Check Cloudflare-injected globals
            () => {
                if (window.CF_RUNPOD_API_KEY) {
                    return {
                        RUNPOD_API_KEY: window.CF_RUNPOD_API_KEY,
                        RUNPOD_TEXT_ENDPOINT_ID: window.CF_RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr'
                    };
                }
                return null;
            },
            
            // 3. Default values for development
            () => {
                console.warn('Using default environment configuration');
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
                
                if (config.RUNPOD_API_KEY) {
                    console.log('Environment variables loaded:', {
                        hasApiKey: !!window.RUNPOD_API_KEY,
                        endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
                        hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
                        hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                        source: source.name
                    });
                    return;
                }
            }
        }
        
        // Final fallback - ensure all variables are set
        window.RUNPOD_API_KEY = window.RUNPOD_API_KEY || '';
        window.RUNPOD_TEXT_ENDPOINT_ID = window.RUNPOD_TEXT_ENDPOINT_ID || '4cx6jtjdx6hdhr';
        window.NEXT_PUBLIC_SUPABASE_URL = window.NEXT_PUBLIC_SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co';
        window.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
        console.warn('Using default environment configuration');
    }
    
    // Inject immediately
    injectEnvironmentVariables();
    
    // Also make available globally
    window.injectEnvironmentVariables = injectEnvironmentVariables;
})();