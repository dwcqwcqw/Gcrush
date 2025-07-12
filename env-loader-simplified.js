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
            // Strategy 1: Try fetch API for Cloudflare Function
            () => {
                return fetch('/env-config.js')
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.text();
                    })
                    .then(code => {
                        console.log('Loaded env-config.js via fetch from Cloudflare Function');
                        // Create and execute script
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.textContent = code;
                        document.head.appendChild(script);
                        return true;
                    })
                    .catch(error => {
                        console.warn('Failed to load env-config.js via fetch:', error.message);
                        return false;
                    });
            },
            
            // Strategy 2: Try loading from API endpoint
            () => {
                return fetch('/api/env-config')
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    })
                    .then(config => {
                        console.log('Loaded env config from API endpoint');
                        // Apply configuration
                        Object.keys(defaultConfig).forEach(key => {
                            if (config[key] !== undefined) {
                                window[key] = config[key];
                            }
                        });
                        return true;
                    })
                    .catch(error => {
                        console.warn('Failed to load env config from API:', error.message);
                        return false;
                    });
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
            },
            
            // Strategy 4: Check for Cloudflare Pages environment variables
            () => {
                return new Promise((resolve) => {
                    // Check for various Cloudflare Pages environment variable patterns
                    const cfPatterns = [
                        'CF_PAGES_',
                        'CF_',
                        'CLOUDFLARE_',
                        'PAGES_'
                    ];
                    
                    let foundAny = false;
                    cfPatterns.forEach(prefix => {
                        if (window[prefix + 'RUNPOD_API_KEY']) {
                            window.RUNPOD_API_KEY = window[prefix + 'RUNPOD_API_KEY'];
                            foundAny = true;
                        }
                        if (window[prefix + 'RUNPOD_TEXT_ENDPOINT_ID']) {
                            window.RUNPOD_TEXT_ENDPOINT_ID = window[prefix + 'RUNPOD_TEXT_ENDPOINT_ID'];
                            foundAny = true;
                        }
                    });
                    
                    if (foundAny) {
                        console.log('Found Cloudflare Pages environment variables');
                    }
                    resolve(foundAny);
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
    
    // Load configuration with timeout
    function loadWithTimeout() {
        const timeout = new Promise((resolve) => {
            setTimeout(() => {
                console.warn('Environment loading timed out, using defaults');
                resolve(false);
            }, 5000);
        });
        
        return Promise.race([loadEnvConfig(), timeout]);
    }
    
    // Load configuration
    loadWithTimeout().then(success => {
        if (!success) {
            console.warn('All strategies failed to load environment config, using defaults');
        }
        
        // Final check and log
        const finalConfig = {
            hasApiKey: !!window.RUNPOD_API_KEY && window.RUNPOD_API_KEY !== '',
            apiKeyLength: window.RUNPOD_API_KEY ? window.RUNPOD_API_KEY.length : 0,
            endpointId: window.RUNPOD_TEXT_ENDPOINT_ID,
            hasSupabaseUrl: !!window.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!window.NEXT_PUBLIC_SUPABASE_ANON_KEY
        };
        
        console.log('Environment configuration final state:', finalConfig);
        
        // Dispatch event to notify other scripts
        window.dispatchEvent(new CustomEvent('envConfigLoaded', {
            detail: {
                source: 'simplified-loader',
                success: success,
                config: finalConfig
            }
        }));
    });
    
    // Export utility functions
    window.EnvLoader = {
        loadEnvConfig: loadEnvConfig,
        loadWithTimeout: loadWithTimeout,
        getConfig: () => ({
            RUNPOD_API_KEY: window.RUNPOD_API_KEY,
            RUNPOD_TEXT_ENDPOINT_ID: window.RUNPOD_TEXT_ENDPOINT_ID,
            NEXT_PUBLIC_SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }),
        reload: () => {
            console.log('Reloading environment configuration...');
            return loadWithTimeout();
        }
    };
})();