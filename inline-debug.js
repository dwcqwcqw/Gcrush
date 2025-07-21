// Inline Debug Script for Cloudflare Pages
// Add this to your main page to debug authentication issues

console.log('🚀 Inline Debug Script Started');
console.log('Current URL:', window.location.href);
console.log('Environment:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    isCloudflare: window.location.hostname.includes('pages.dev'),
    isLocal: window.location.hostname === 'localhost'
});

// Track script loading
window.debugInfo = {
    scriptsLoaded: [],
    elementsFound: {},
    errors: [],
    authEvents: []
};

// Monitor script loading
const originalAppendChild = document.head.appendChild;
document.head.appendChild = function(element) {
    if (element.tagName === 'SCRIPT') {
        console.log('📜 Script loading:', element.src || 'inline');
        window.debugInfo.scriptsLoaded.push(element.src || 'inline');
    }
    return originalAppendChild.call(this, element);
};

// Monitor DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    // Check for required elements
    const elements = {
        loginBtn: '.login-btn',
        createBtn: '.create-account-btn',
        authModal: '#authModal',
        authContainer: '#auth-container',
        userProfile: '.user-profile'
    };
    
    Object.entries(elements).forEach(([name, selector]) => {
        const element = document.querySelector(selector);
        window.debugInfo.elementsFound[name] = !!element;
        console.log(`🎯 ${name}:`, element ? '✅ Found' : '❌ Not found');
    });
    
    // Check for Supabase
    setTimeout(() => {
        console.log('🔍 Supabase check:', {
            windowSupabase: !!window.supabase,
            globalSupabase: typeof supabase !== 'undefined'
        });
        
        if (window.supabase && window.supabase.createClient) {
            try {
                const client = window.supabase.createClient(
                    'https://kuflobojizyttadwcbhe.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
                );
                console.log('✅ Supabase client created successfully');
                
                // Test auth functionality
                client.auth.getSession().then(({ data, error }) => {
                    if (error) {
                        console.error('❌ Auth session error:', error);
                    } else {
                        console.log('✅ Auth session check successful:', data.session ? 'Logged in' : 'Not logged in');
                    }
                });
                
            } catch (error) {
                console.error('❌ Supabase client creation failed:', error);
            }
        } else {
            console.warn('⚠️ Supabase not available or createClient method missing');
        }
    }, 1000);
    
    // Test button clicks after a delay
    setTimeout(() => {
        console.log('🖱️ Testing button interactions...');
        
        const loginBtn = document.querySelector('.login-btn');
        const createBtn = document.querySelector('.create-account-btn');
        
        if (loginBtn) {
            console.log('🔐 Login button found, testing click handler...');
            // Create a test click event
            const testClick = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            // Add temporary listener to see if events work
            loginBtn.addEventListener('click', (e) => {
                console.log('✅ Login button click detected!');
                window.debugInfo.authEvents.push('login-click');
            }, { once: true });
            
            // Don't trigger test click - just log that handler is ready
            console.log('Login button handler ready for testing');
        }
        
        if (createBtn) {
            console.log('🔐 Create button found, testing click handler...');
            const testClick = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            createBtn.addEventListener('click', (e) => {
                console.log('✅ Create button click detected!');
                window.debugInfo.authEvents.push('create-click');
            }, { once: true });
            
            // Don't trigger test click - just log that handler is ready
            console.log('Create button handler ready for testing');
        }
    }, 3000);
});

// Monitor window load
window.addEventListener('load', () => {
    console.log('🚀 Window fully loaded');
    
    // Final debug summary
    setTimeout(() => {
        console.log('📊 Debug Summary:', window.debugInfo);
        
        // Make debug info available globally
        window.getDebugInfo = () => {
            const summary = {
                url: window.location.href,
                environment: {
                    hostname: window.location.hostname,
                    protocol: window.location.protocol,
                    isCloudflare: window.location.hostname.includes('pages.dev'),
                    isLocal: window.location.hostname === 'localhost'
                },
                supabase: {
                    available: !!window.supabase,
                    version: window.supabase ? 'loaded' : 'not loaded'
                },
                elements: window.debugInfo.elementsFound,
                scripts: window.debugInfo.scriptsLoaded,
                events: window.debugInfo.authEvents,
                errors: window.debugInfo.errors
            };
            
            console.log('🔍 Full Debug Report:', summary);
            return summary;
        };
        
        console.log('💡 Use window.getDebugInfo() to get full debug report');
    }, 5000);
});

// Global error tracking
window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error);
    window.debugInfo.errors.push({
        message: event.error.message,
        filename: event.filename,
        line: event.lineno,
        timestamp: new Date().toISOString()
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    window.debugInfo.errors.push({
        type: 'unhandled-promise',
        reason: event.reason.toString(),
        timestamp: new Date().toISOString()
    });
});

console.log('✅ Inline Debug Script Ready - Check console for detailed logs');