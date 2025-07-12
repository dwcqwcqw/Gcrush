// Simplified environment loader with multiple fallbacks
// This should be loaded early in your HTML files

(function() {
    'use strict';
    
    console.log('Simplified environment loader starting...');
    
    // Default configuration
    const defaultConfig = {
        RUNPOD_API_KEY: '',
        RUNPOD_TEXT_ENDPOINT_ID: '4cx6jtjdx6hdhr',
        NEXT_PUBLIC_SUPABASE_URL: 'https://kuflobojizyttadwcbhe.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
    };
    
    // Apply default configuration immediately
    Object.keys(defaultConfig).forEach(key => {
        if (!window[key]) {
            window[key] = defaultConfig[key];
        }
    });
    
    // Try to load env-config.js with multiple strategies
    function loadEnvConfig() {
        const strategies = [
            // Strategy 1: Try fetch API
            () => {
                return fetch('/env-config.js')
                    .then(response => {
                        if (!response.ok) throw new Error('Not found');
                        return response.text();
                    })
                    .then(code => {
                        console.log('Loaded env-config.js via fetch');
                        // Create and execute script
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.textContent = code;
                        document.head.appendChild(script);
                        return true;
                    })
                    .catch(() => false);
            },
            
            // Strategy 2: Try loading from Functions endpoint
            () => {
                return fetch('/api/env-config')
                    .then(response => {
                        if (!response.ok) throw new Error('Not found');
                        return response.json();
                    })
                    .then(config => {
                        console.log('Loaded env config from API');
                        Object.assign(window, config);
                        return true;
                    })
                    .catch(() => false);
            },
            
            // Strategy 3: Try script tag with error handling
            () => {
                return new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = '/env-config.js';
                    script.type = 'text/javascript';
                    script.onload = () => {
                        console.log('Loaded env-config.js via script tag');
                        resolve(true);
                    };
                    script.onerror = () => {
                        console.warn('Failed to load env-config.js via script tag');
                        resolve(false);
                    };
                    document.head.appendChild(script);
                });
            }
        ];
        
        // Try each strategy in sequence
        return strategies.reduce((promise, strategy) => {
            return promise.then(success => {
                if (success) return true;
                return strategy();
            });
        }, Promise.resolve(false));
    }
    
    // Load configuration
    loadEnvConfig().then(success => {
        if (!success) {
            console.warn('All strategies failed to load env-config.js, using defaults');
        }
        
        // Final check and log
        console.log('Environment configuration final state:', {
            hasApiKey: !!window.RUNPOD_API_KEY,
            endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
            hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });
        
        // Dispatch event to notify other scripts
        window.dispatchEvent(new Event('envConfigLoaded'));
    });
    
    // Export utility functions
    window.EnvLoader = {
        loadEnvConfig,
        getConfig: () => ({
            RUNPOD_API_KEY: window.RUNPOD_API_KEY,
            RUNPOD_TEXT_ENDPOINT_ID: window.RUNPOD_TEXT_ENDPOINT_ID,
            NEXT_PUBLIC_SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY
        })
    };
})();