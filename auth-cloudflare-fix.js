// Cloudflare Pages Authentication Fix
// This script addresses common issues with auth on Cloudflare Pages

console.log('🚀 Cloudflare Pages Auth Fix Loading...');

// Configuration
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

let supabase = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

// Robust initialization function
async function initializeSupabase() {
    initAttempts++;
    console.log(`🔄 Initialization attempt ${initAttempts}/${MAX_INIT_ATTEMPTS}`);
    
    if (initAttempts > MAX_INIT_ATTEMPTS) {
        console.error('❌ Maximum initialization attempts reached');
        return false;
    }
    
    try {
        // Wait for Supabase to be available
        if (!window.supabase) {
            console.log('⏳ Waiting for Supabase SDK...');
            await new Promise(resolve => setTimeout(resolve, 200));
            return initializeSupabase();
        }
        
        // Create client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client created');
        
        // Test connection
        await supabase.auth.getSession();
        console.log('✅ Supabase connection verified');
        
        return true;
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return initializeSupabase();
    }
}

// Robust DOM element finder
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// Enhanced authentication functions
async function performSignUp(email, password) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    console.log('🔐 Starting sign up process...');
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Sign up successful:', data);
        return data;
    } catch (error) {
        console.error('❌ Sign up failed:', error);
        throw error;
    }
}

async function performSignIn(email, password) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    console.log('🔐 Starting sign in process...');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        console.log('✅ Sign in successful:', data);
        return data;
    } catch (error) {
        console.error('❌ Sign in failed:', error);
        throw error;
    }
}

async function performSocialAuth(provider) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    console.log(`🔐 Starting ${provider} authentication...`);
    
    try {
        // Use proper OAuth redirect URLs
        let redirectUrl;
        if (provider === 'twitter') {
            // Twitter requires the Supabase callback URL
            redirectUrl = 'https://kuflobojizyttadwcbhe.supabase.co/auth/v1/callback';
        } else {
            // For Google and other providers, use the current domain
            redirectUrl = window.location.origin;
        }
        console.log(`Using OAuth redirect URL for ${provider}:`, redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectUrl
            }
        });
        
        if (error) throw error;
        
        console.log(`✅ ${provider} auth initiated:`, data);
        return data;
    } catch (error) {
        console.error(`❌ ${provider} auth failed:`, error);
        throw error;
    }
}

// Enhanced modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log(`📱 Modal ${modalId} opened`);
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    console.log(`📱 Modal ${modalId} closed`);
}

// Create authentication UI
function createAuthUI(isSignUp = false) {
    const title = isSignUp ? 'Create Account' : 'Welcome Back';
    const buttonText = isSignUp ? 'Sign Up' : 'Sign In';
    const switchText = isSignUp ? 'Already have an account?' : "Don't have an account?";
    const switchLink = isSignUp ? 'Sign in' : 'Sign up';
    
    return `
        <div class="auth-ui-container">
            <h2 class="auth-title">${title}</h2>
            
            <form id="authForm" class="auth-form">
                <div class="form-group">
                    <input type="email" id="authEmail" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" id="authPassword" placeholder="Password" required>
                </div>
                <button type="submit" class="submit-btn ${isSignUp ? '' : 'login-style'}">${buttonText}</button>
            </form>
            
            <div class="auth-divider">
                <span>or continue with</span>
            </div>
            
            <div class="social-auth">
                <button class="social-btn" data-provider="google">
                    <i class="fab fa-google"></i><span>Google</span>
                </button>
                <button class="social-btn" data-provider="twitter">
                    <i class="fab fa-twitter"></i><span>Twitter/X</span>
                </button>
            </div>
            
            <div class="auth-switch">
                ${switchText} <a href="#" id="switchAuth">${switchLink}</a>
            </div>
        </div>
    `;
}

// Setup authentication form
function setupAuthForm(isSignUp) {
    const form = document.getElementById('authForm');
    const switchLink = document.getElementById('switchAuth');
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        try {
            if (isSignUp) {
                await performSignUp(email, password);
                alert('Registration successful! Please check your email to confirm your account.');
            } else {
                await performSignIn(email, password);
                alert('Sign in successful!');
            }
            hideModal('authModal');
        } catch (error) {
            let message = 'Authentication failed';
            if (error.message.includes('Invalid login credentials')) {
                message = 'Invalid email or password';
            } else if (error.message.includes('User already registered')) {
                message = 'This email is already registered';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                message = 'Password must be at least 6 characters';
            }
            alert(message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
        }
    });
    
    // Social auth buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const provider = btn.dataset.provider;
            
            try {
                await performSocialAuth(provider);
            } catch (error) {
                alert(`${provider} authentication failed: ${error.message}`);
            }
        });
    });
    
    // Switch between sign up/in
    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        const container = document.getElementById('auth-container');
        const newIsSignUp = !isSignUp;
        container.innerHTML = createAuthUI(newIsSignUp);
        setupAuthForm(newIsSignUp);
    });
}

// Main initialization function
async function initializeAuth() {
    console.log('🚀 Starting authentication initialization...');
    
    try {
        // Initialize Supabase
        const supabaseReady = await initializeSupabase();
        if (!supabaseReady) {
            console.error('❌ Failed to initialize Supabase');
            return;
        }
        
        // Wait for DOM elements
        const [loginBtn, createBtn, authModal, authContainer] = await Promise.all([
            waitForElement('.login-btn'),
            waitForElement('.create-account-btn'),
            waitForElement('#authModal'),
            waitForElement('#auth-container')
        ]);
        
        console.log('✅ DOM elements found');
        
        // Setup button event listeners
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔐 Login button clicked');
            authContainer.innerHTML = createAuthUI(false);
            setupAuthForm(false);
            showModal('authModal');
        });
        
        createBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔐 Create account button clicked');
            authContainer.innerHTML = createAuthUI(true);
            setupAuthForm(true);
            showModal('authModal');
        });
        
        // Setup modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) hideModal(modal.id);
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modal.id);
            });
        });
        
        // Setup auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(`🔄 Auth state changed: ${event}`);
            if (event === 'SIGNED_IN' && session) {
                console.log('✅ User signed in:', session.user.email);
                hideModal('authModal');
            } else if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
            }
        });
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('✅ Existing session found:', session.user.email);
        }
        
        console.log('✅ Authentication system initialized successfully');
        
    } catch (error) {
        console.error('❌ Authentication initialization failed:', error);
        
        // Fallback: Show debug info
        setTimeout(() => {
            console.log('🔧 Debug info:');
            console.log('- URL:', window.location.href);
            console.log('- Supabase available:', !!window.supabase);
            console.log('- Login button:', !!document.querySelector('.login-btn'));
            console.log('- Create button:', !!document.querySelector('.create-account-btn'));
            console.log('- Auth modal:', !!document.getElementById('authModal'));
        }, 1000);
    }
}

// Multiple initialization strategies
function startInitialization() {
    // Strategy 1: DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth);
    } else {
        // Strategy 2: Document already loaded
        initializeAuth();
    }
    
    // Strategy 3: Window load (fallback)
    window.addEventListener('load', () => {
        setTimeout(initializeAuth, 1000);
    });
    
    // Strategy 4: Aggressive retry (for Cloudflare Pages)
    setTimeout(() => {
        if (!supabase) {
            console.log('🔄 Aggressive initialization retry...');
            initializeAuth();
        }
    }, 3000);
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Start initialization
startInitialization();

// Export for debugging
window.authDebug = {
    supabase: () => supabase,
    testSignUp: (email, password) => performSignUp(email, password),
    testSignIn: (email, password) => performSignIn(email, password),
    testGoogle: () => performSocialAuth('google'),
    testTwitter: () => performSocialAuth('twitter'),
    reinitialize: initializeAuth
};

console.log('🚀 Cloudflare Pages Auth Fix Loaded - Use window.authDebug for testing');