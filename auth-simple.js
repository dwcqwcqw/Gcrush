// Supabase Configuration
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

// Debug helper function
function authDebug(message, data = null) {
    const timestamp = new Date().toISOString();
    const url = window.location.href;
    const referrer = document.referrer || 'direct';
    const stack = new Error().stack;
    
    console.log(`[AUTH-DEBUG] ${timestamp} | ${message}`);
    if (data) {
        console.log(`[AUTH-DEBUG] Data:`, data);
    }
    console.log(`[AUTH-DEBUG] URL: ${url}`);
    console.log(`[AUTH-DEBUG] Referrer: ${referrer}`);
    console.log(`[AUTH-DEBUG] Stack:`, stack.split('\n').slice(1, 4).join('\n'));
    console.log(`[AUTH-DEBUG] LocalStorage auth token:`, localStorage.getItem('sb-kuflobojizyttadwcbhe-auth-token') ? 'EXISTS' : 'NONE');
    console.log(`[AUTH-DEBUG] ==========================================`);
}

// Initialize Supabase client
let supabase = null;

// DOM Elements
let authModal = null;
let profileModal = null;
let loginBtn = null;
let createAccountBtn = null;
let userProfile = null;
let authContainer = null;

// Auth state
let authView = 'sign_in'; // 'sign_in' or 'sign_up'

// Initialize Supabase client safely
function initializeSupabase() {
    authDebug('Starting Supabase initialization');
    
    // Use global Supabase client if already initialized
    if (window._supabaseClientInitialized && window.supabase) {
        authDebug('Using existing global Supabase client');
        supabase = window.supabase;
        console.log('Using global Supabase client from supabase-manager.js');
        return true;
    }
    
    if (!window.supabase || !window.supabase.createClient) {
        authDebug('ERROR: Supabase SDK not loaded!');
        console.error('Supabase SDK not loaded!');
        return false;
    }
    
    try {
        authDebug('Creating Supabase client with config', {
            url: SUPABASE_URL,
            storageKey: 'sb-kuflobojizyttadwcbhe-auth-token',
            detectSessionInUrl: true
        });
        
        // Only create if not already created by supabase-manager.js
        if (!window._supabaseClientInitialized) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage,
                    storageKey: 'sb-kuflobojizyttadwcbhe-auth-token',
                    flowType: 'pkce'
                }
            });
            window._supabaseClientInitialized = true;
        } else {
            supabase = window.supabase;
        }
        
        authDebug('Supabase client initialized successfully');
        console.log('Supabase client initialized with persistent session');
        return true;
    } catch (error) {
        authDebug('ERROR: Failed to initialize Supabase client', error);
        console.error('Failed to initialize Supabase client:', error);
        return false;
    }
}

// Initialize after DOM is loaded
function initializeAuth() {
    authDebug('Starting auth system initialization');
    console.log('Initializing auth system...');
    
    // First, initialize Supabase client
    if (!initializeSupabase()) {
        authDebug('ERROR: Failed to initialize Supabase, aborting auth init');
        console.error('Cannot initialize auth system without Supabase');
        return;
    }
    
    // Get DOM elements
    authModal = document.getElementById('authModal');
    profileModal = document.getElementById('profileModal');
    loginBtn = document.querySelector('.login-btn');
    createAccountBtn = document.querySelector('.create-account-btn');
    userProfile = document.querySelector('.user-profile');
    authContainer = document.getElementById('auth-container');
    
    console.log('Auth initialized:', { 
        supabase: !!supabase,
        authModal: !!authModal, 
        profileModal: !!profileModal, 
        loginBtn: !!loginBtn, 
        createAccountBtn: !!createAccountBtn, 
        userProfile: !!userProfile, 
        authContainer: !!authContainer 
    });
    
    // Setup auth state change listener only after supabase is initialized
    if (supabase) {
        setupAuthStateListener();
    }
}

// Setup auth state change listener separately
function setupAuthStateListener() {
    authDebug('Setting up auth state listener');
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        authDebug(`Auth state change detected`, {
            event: event,
            hasSession: !!session,
            hasUser: !!(session && session.user),
            userEmail: session?.user?.email,
            userId: session?.user?.id,
            provider: session?.user?.app_metadata?.provider,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
        
        console.log('Auth state changed:', event, session);
        
        // Handle all auth events that result in a valid session
        if (session && session.user) {
            authDebug(`Valid session found for event: ${event}`, {
                userEmail: session.user.email,
                provider: session.user.app_metadata?.provider,
                userMetadata: session.user.user_metadata,
                appMetadata: session.user.app_metadata
            });
            
            console.log(`Auth event: ${event}, User: ${session.user.email}`);
            
            // Close any open auth modal
            if (authModal) {
                authDebug('Closing auth modal');
                closeModal(authModal);
            }
            
            // Always update UI for logged in user
            authDebug('Updating UI for logged in user');
            await updateUIForLoggedInUser(session.user);
            
            // For OAuth providers, handle the redirect properly
            if (event === 'SIGNED_IN' && session.user.app_metadata?.provider) {
                authDebug('OAuth sign in detected', {
                    provider: session.user.app_metadata.provider,
                    currentPath: window.location.pathname,
                    currentSearch: window.location.search,
                    fullURL: window.location.href
                });
                
                console.log('OAuth sign in completed for provider:', session.user.app_metadata.provider);
                console.log('Full user data:', JSON.stringify(session.user, null, 2));
                
                // Force UI update for Twitter users who might have different metadata structure
                if (session.user.app_metadata.provider === 'twitter' || session.user.app_metadata.provider === 'twitter_v2') {
                    authDebug('Twitter user detected, forcing delayed UI update');
                    console.log('Twitter user detected, forcing UI update');
                    setTimeout(() => {
                        updateUIForLoggedInUser(session.user);
                    }, 500);
                }
                
                // Ensure we're on the main page after OAuth redirect
                if (window.location.pathname.includes('/auth/callback') || window.location.search.includes('code=')) {
                    authDebug('OAuth callback detected, redirecting to main page', {
                        fromPath: window.location.pathname,
                        fromSearch: window.location.search
                    });
                    console.log('Redirecting to main page after OAuth callback');
                    window.location.href = '/';
                }
            }
        } else if (event === 'SIGNED_OUT') {
            authDebug('User signed out event');
            console.log('User signed out');
            
            // Reset UI to show login/create account buttons
            const currentLoginBtn = document.querySelector('.login-btn');
            const currentCreateBtn = document.querySelector('.create-account-btn');
            const currentUserProfile = document.querySelector('.user-profile');
            
            authDebug('Resetting UI elements for signed out state', {
                hasLoginBtn: !!currentLoginBtn,
                hasCreateBtn: !!currentCreateBtn,
                hasUserProfile: !!currentUserProfile
            });
            
            if (currentLoginBtn) currentLoginBtn.style.display = 'inline-block';
            if (currentCreateBtn) currentCreateBtn.style.display = 'inline-block';
            if (currentUserProfile) currentUserProfile.style.display = 'none';
            
            // Hide premium button
            const premiumBtn = document.querySelector('.premium-button');
            if (premiumBtn) {
                premiumBtn.style.display = 'none';
            }
        }
    });
    
    // Check current session on initialization with better validation
    authDebug('Starting session check on initialization');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            authDebug('ERROR: Session check failed', error);
            console.error('Error checking session:', error);
            // Clear any corrupted auth data
            const authKeys = ['sb-kuflobojizyttadwcbhe-auth-token', 'rememberMe'];
            authKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            return;
        }
        
        if (session && session.user) {
            authDebug('Existing session found on initialization', {
                userEmail: session.user.email,
                userId: session.user.id,
                expiresAt: new Date(session.expires_at * 1000).toISOString(),
                provider: session.user.app_metadata?.provider
            });
            
            console.log('Existing session found on initialization');
            console.log(`Session expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
            
            // Validate session is not expired
            const now = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at < now) {
                authDebug('Session is expired, clearing auth data');
                console.log('Session is expired, clearing...');
                localStorage.removeItem('sb-kuflobojizyttadwcbhe-auth-token');
                localStorage.removeItem('rememberMe');
                return;
            }
            
            // Check if user had "remember me" enabled
            const rememberMe = localStorage.getItem('rememberMe') === 'true';
            authDebug('Remember me setting checked', { rememberMe });
            console.log('Remember me setting:', rememberMe);
            
            // Always update UI if we have a valid session
            authDebug('Updating UI for existing session user');
            updateUIForLoggedInUser(session.user);
        } else {
            authDebug('No existing session found on initialization');
            console.log('No existing session found');
            
            // Ensure UI is in logged-out state
            const currentLoginBtn = document.querySelector('.login-btn');
            const currentCreateBtn = document.querySelector('.create-account-btn');
            const currentUserProfile = document.querySelector('.user-profile');
            
            authDebug('Setting UI to logged-out state', {
                hasLoginBtn: !!currentLoginBtn,
                hasCreateBtn: !!currentCreateBtn,
                hasUserProfile: !!currentUserProfile
            });
            
            if (currentLoginBtn) currentLoginBtn.style.display = 'inline-block';
            if (currentCreateBtn) currentCreateBtn.style.display = 'inline-block';
            if (currentUserProfile) currentUserProfile.style.display = 'none';
        }
    }).catch(sessionError => {
        authDebug('ERROR: Session check failed with exception', sessionError);
        console.error('Session check failed:', sessionError);
        // Clear potentially corrupted auth data
        localStorage.removeItem('sb-kuflobojizyttadwcbhe-auth-token');
        localStorage.removeItem('rememberMe');
    });
}

// Render authentication UI
function renderAuthUI() {
    console.log('🎨 renderAuthUI() called, authView:', authView);
    
    if (!authContainer) {
        console.error('❌ Auth container not found!');
        // Try to find it again
        authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            console.error('❌ Still cannot find auth container!');
            return;
        }
        console.log('✅ Found auth container on retry');
    }
    
    const isSignUp = authView === 'sign_up';
    console.log('🎨 Rendering auth UI for:', isSignUp ? 'sign_up' : 'sign_in');
    
    authContainer.innerHTML = `
        <div class="auth-form">
            <div class="auth-header">
                <h2 class="auth-title">${isSignUp ? 'Create Your Account' : 'Welcome Back'}</h2>
                <p class="auth-subtitle">${isSignUp ? 'Join thousands of users exploring AI companions' : 'Sign in to continue your conversations'}</p>
            </div>
            
            <form id="authForm" class="email-auth-form">
                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" id="email" class="form-input" placeholder="Enter your email" required>
                </div>
                
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-input" placeholder="${isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}" required ${isSignUp ? 'minlength="6"' : ''}>
                    ${!isSignUp ? '<!-- <a href="#" class="forgot-password">Forgot password?</a> -->' : ''}
                </div>
                
                ${!isSignUp ? `
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: -10px;">
                    <input type="checkbox" id="rememberMe" checked style="width: auto; margin: 0;">
                    <label for="rememberMe" style="margin: 0; font-size: 0.9rem; color: var(--text-silver); cursor: pointer;">
                        Keep me logged in
                    </label>
                </div>
                ` : ''}
                
                <button type="submit" class="submit-btn primary-btn">
                    <span class="btn-text">${isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            </form>
            
            <div class="auth-divider">
                <span>or continue with</span>
            </div>
            
            <div class="social-auth">
                <button type="button" class="social-btn google-btn" data-provider="google">
                    <i class="fab fa-google"></i>
                    <span>Continue with Google</span>
                </button>
                
                <button type="button" class="social-btn twitter-btn" data-provider="twitter">
                    <i class="fab fa-twitter"></i>
                    <span>Continue with X (Twitter)</span>
                </button>
            </div>
            
            <div class="auth-footer">
                <p>${isSignUp ? 'Already have an account?' : "Don't have an account?"} 
                   <a href="#" id="${isSignUp ? 'switchToSignIn' : 'switchToSignUp'}" class="auth-link-primary">
                       ${isSignUp ? 'Sign In' : 'Create Account'}
                   </a>
                </p>
            </div>
        </div>
    `;
    
    console.log('✅ Auth UI HTML rendered');
    
    // Add event listeners
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', handleAuthSubmit);
        console.log('✅ Form submit handler added');
    } else {
        console.error('❌ Auth form not found after rendering');
    }
    
    // Social auth buttons
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const provider = e.currentTarget.dataset.provider;
            console.log('🔗 Social auth clicked:', provider);
            handleSocialAuth(provider);
        });
    });
    console.log(`✅ Added ${socialBtns.length} social auth handlers`);
    
    // Switch auth view
    const switchToSignIn = document.getElementById('switchToSignIn');
    const switchToSignUp = document.getElementById('switchToSignUp');
    
    if (switchToSignIn) {
        switchToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Switching to sign in');
            authView = 'sign_in';
            renderAuthUI();
        });
    }
    
    if (switchToSignUp) {
        switchToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Switching to sign up');
            authView = 'sign_up';
            renderAuthUI();
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Switching to forgot password');
            authView = 'forgot_password';
            renderForgotPasswordUI();
        });
    }
    
    console.log('🎨 renderAuthUI() completed successfully');
}

// Render forgot password UI
function renderForgotPasswordUI() {
    if (!authContainer) {
        console.error('Auth container not found!');
        return;
    }
    
    authContainer.innerHTML = `
        <div class="auth-form">
            <div class="auth-header">
                <h2 class="auth-title">Reset Your Password</h2>
                <p class="auth-subtitle">Enter your email address and we'll send you a link to reset your password</p>
            </div>
            
            <form id="forgotPasswordForm" class="email-auth-form">
                <div class="form-group">
                    <label for="resetEmail" class="form-label">Email Address</label>
                    <input type="email" id="resetEmail" class="form-input" placeholder="Enter your email" required>
                </div>
                
                <button type="submit" class="submit-btn primary-btn">
                    <span class="btn-text">Send Reset Link</span>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
            
            <div class="auth-footer" style="margin-top: 30px;">
                <p>Remember your password? 
                   <a href="#" id="backToSignIn" class="auth-link-primary">
                       Back to Sign In
                   </a>
                </p>
            </div>
        </div>
    `;
    
    // Add event listeners
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', handleForgotPasswordSubmit);
    }
    
    // Back to sign in link
    const backToSignIn = document.getElementById('backToSignIn');
    if (backToSignIn) {
        backToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            authView = 'sign_in';
            renderAuthUI();
        });
    }
}

// Handle forgot password form submission
async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const submitBtn = document.querySelector('.primary-btn');
    const originalHTML = submitBtn.innerHTML;
    
    if (!email) {
        showInlineError('Please enter your email address');
        return;
    }
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Checking...</span>`;
        
        // Skip email existence check to avoid rate limiting
        // Let Supabase handle the validation during the actual reset call
        console.log('Proceeding with password reset for:', email);
        
        // Update loading text
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Sending...</span>`;
        
        // Use Supabase's password reset feature with redirect to main page
        // Redirect back to main page instead of reset password page
        const currentOrigin = window.location.origin;
        const redirectUrl = `${currentOrigin}/`;
        console.log('Password reset redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        
        if (error) {
            console.log('Password reset error details:', error);
            
            // Handle specific error cases
            const errorMessage = error.message.toLowerCase();
            
            if (errorMessage.includes('rate limit') || 
                errorMessage.includes('too many requests') ||
                errorMessage.includes('for security purposes')) {
                throw new Error('Please wait a moment before requesting another password reset. This is a security measure to protect your account.');
            } else if (errorMessage.includes('user not found') || 
                       errorMessage.includes('unable to validate email address') ||
                       errorMessage.includes('invalid email') ||
                       errorMessage.includes('email not found')) {
                throw new Error('No account found with this email address. Please check your email or create a new account.');
            } else {
                throw error;
            }
        }
        
        // Show success message
        showInlineError('Password reset link sent! If your email is correct, you will receive a reset email shortly. Please check your email and follow the instructions.', 'success');
        
        // Clear the form
        document.getElementById('resetEmail').value = '';
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Failed to send reset link';
        if (error.message.includes('Please wait a moment') || 
            error.message.includes('security measure')) {
            errorMessage = error.message;
        } else if (error.message.includes('Rate limit') || 
                   error.message.includes('too many requests') ||
                   error.message.includes('for security purposes')) {
            errorMessage = 'Please wait a moment before requesting another password reset. This is a security measure to protect your account.';
        } else if (error.message.includes('No account found')) {
            errorMessage = error.message;
        } else {
            errorMessage = error.message || 'Failed to send reset link';
        }
        
        showInlineError(errorMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Handle form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Check if user wants to be remembered (only for sign in)
    const rememberMe = authView === 'sign_in' ? document.getElementById('rememberMe')?.checked : false;
    console.log('Remember me option:', rememberMe);
    
    // Clear any previous errors
    clearInlineError();
    
    // Validate password for sign up
    if (authView === 'sign_up' && password.length < 6) {
        showInlineError('Password must be at least 6 characters long');
        return;
    }
    
    const submitBtn = document.querySelector('.primary-btn');
    const originalHTML = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">${authView === 'sign_up' ? 'Creating Account...' : 'Signing In...'}</span>`;
        
        if (authView === 'sign_up') {
            // Check if email already exists
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                showInlineError('An account with this email already exists. Please sign in instead.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
                return;
            }
            
            // Sign up new user with email confirmation disabled
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        email_confirm: false
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('Sign up successful:', data);
            
            // Immediately sign in the user after signup
            if (data.user && !data.session) {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (signInError) {
                    console.error('Auto sign-in after signup failed:', signInError);
                    showInlineError('Account created successfully. Please sign in.');
                } else {
                    console.log('Auto sign-in successful:', signInData);
                }
            }
            // If session exists, auth state change will handle the rest
            
        } else {
            // Sign in existing user
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            console.log('Sign in successful:', data);
            
            // Store the remember me preference for future session validation
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                console.log('Remember me enabled - session will persist');
            } else {
                localStorage.removeItem('rememberMe');
                console.log('Remember me disabled - standard session duration');
            }
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        
        let errorMessage = 'Authentication failed';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link';
        } else if (error.message.includes('User already registered')) {
            errorMessage = 'An account with this email already exists';
        } else {
            errorMessage = error.message;
        }
        
        showInlineError(errorMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Handle social authentication
async function handleSocialAuth(provider) {
    authDebug(`Initiating ${provider} authentication`);
    console.log(`Initiating ${provider} authentication...`);
    
    const socialBtn = document.querySelector(`[data-provider="${provider}"]`);
    const originalHTML = socialBtn.innerHTML;
    
    // Clear any previous errors
    clearInlineError();
    
    // Show loading state
    socialBtn.disabled = true;
    socialBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
    
    // Set timeout to reset button state
    setTimeout(() => {
        if (socialBtn.disabled) {
            socialBtn.disabled = false;
            socialBtn.innerHTML = originalHTML;
            authDebug(`${provider} auth timeout - resetting button`);
            console.log(`${provider} auth timeout - resetting button`);
        }
    }, 10000);
    
    try {
        // Use the current page URL for redirect after OAuth
        const redirectUrl = window.location.origin + '/';
        
        authDebug(`OAuth Debug Info for ${provider}`, {
            currentURL: window.location.href,
            currentOrigin: window.location.origin,
            redirectURL: redirectUrl,
            provider: provider
        });
        
        // Log current environment for debugging
        console.log(`OAuth Debug Info for ${provider}:`);
        console.log('- Current URL:', window.location.href);
        console.log('- Current Origin:', window.location.origin);
        console.log('- Redirect URL:', redirectUrl);
        console.log('- Provider:', provider);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
        
        console.log(`${provider} auth initiated successfully`, data);
        
        // For social logins, default to "remember me" behavior
        // This will be applied when the user returns from OAuth
        localStorage.setItem('rememberMe', 'true');
        console.log('Social login - remember me enabled by default');
        
        // The redirect will happen automatically, so we don't need to do anything else
        
    } catch (error) {
        console.error('Social auth error:', error);
        showInlineError(`${provider} authentication failed: ${error.message}`);
        
        // Reset button state on error
        if (socialBtn) {
            socialBtn.disabled = false;
            socialBtn.innerHTML = originalHTML;
        }
    }
}

// Add a test function to manually trigger authentication
window.testAuth = {
    signUp: async (email = 'test@example.com', password = 'test123456') => {
        console.log('Manual sign up test');
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            console.log('Sign up successful:', data);
            alert('Sign up successful! Check console for details.');
        } catch (error) {
            console.error('Sign up error:', error);
            alert('Sign up failed: ' + error.message);
        }
    },
    signIn: async (email = 'test@example.com', password = 'test123456') => {
        console.log('Manual sign in test');
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            console.log('Sign in successful:', data);
            alert('Sign in successful! Check console for details.');
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Sign in failed: ' + error.message);
        }
    },
    google: () => handleSocialAuth('google'),
    twitter: () => handleSocialAuth('twitter'),
    checkButtons: () => {
        console.log('Button check:', {
            loginBtn: !!document.querySelector('.login-btn'),
            createAccountBtn: !!document.querySelector('.create-account-btn'),
            authModal: !!document.getElementById('authModal'),
            authContainer: !!document.getElementById('auth-container')
        });
    }
};

// Setup event listeners for auth buttons
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Wait for elements to be available
    const waitForElements = async () => {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const loginBtn = document.querySelector('.login-btn');
            const createAccountBtn = document.querySelector('.create-account-btn');
            
            if (loginBtn && createAccountBtn) {
                console.log('Auth buttons found, setting up listeners');
                
                // Remove any existing listeners
                const newLoginBtn = loginBtn.cloneNode(true);
                const newCreateBtn = createAccountBtn.cloneNode(true);
                
                loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
                createAccountBtn.parentNode.replaceChild(newCreateBtn, createAccountBtn);
                
                // Add event listeners
                newLoginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Login button clicked');
                    
                    if (!supabase) {
                        console.error('Supabase not initialized');
                        showInlineError('Authentication system is not ready. Please refresh the page.');
                        return;
                    }
                    
                    authView = 'sign_in';
                    renderAuthUI();
                    openModal(authModal);
                });
                
                newCreateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Create account button clicked');
                    
                    if (!supabase) {
                        console.error('Supabase not initialized');
                        showInlineError('Authentication system is not ready. Please refresh the page.');
                        return;
                    }
                    
                    authView = 'sign_up';
                    renderAuthUI();
                    openModal(authModal);
                });
                
                console.log('Event listeners set up successfully');
                return true;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.error('Failed to find auth buttons after', maxAttempts, 'attempts');
        return false;
    };
    
    return waitForElements();
}

// Enhanced modal controls with better error handling
function openModal(modal) {
    console.log('Opening modal:', modal);
    console.trace('Modal open call stack'); // Add stack trace to find what's calling this
    
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Clear any existing modal state first
    const allModals = document.querySelectorAll('.modal-overlay');
    allModals.forEach(m => {
        m.style.display = 'none';
        m.classList.remove('active');
    });
    
    // Reset body overflow
    document.body.style.overflow = '';
    
    try {
        // Re-add content if it was cleared
        if (modal.id === 'authModal') {
            const authContainer = modal.querySelector('#auth-container');
            if (authContainer && authContainer.innerHTML === '') {
                console.log('Auth container is empty, rendering auth UI...');
                renderAuthUI();
            }
        }
        
        // Show the target modal
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('✅ Modal opened successfully');
        
        // Setup modal close handlers (remove existing ones first)
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            // Clone to remove all existing event listeners
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeModal(modal);
            });
        }
        
        // Add fresh overlay click handler (without replacing the entire modal)
        // Remove existing listeners by cloning and replacing just the modal's event handlers
        modal.onclick = null; // Clear existing onclick
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        return modal; // Return the same modal reference
        
    } catch (error) {
        console.error('Error opening modal:', error);
        
        // Fallback: try simple modal show
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        return modal;
    }
}

function closeModal(modal) {
    console.log('Closing modal:', modal);
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    try {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear auth container if this is the auth modal
        if (modal.id === 'authModal') {
            const authContainer = modal.querySelector('#auth-container');
            if (authContainer) {
                authContainer.innerHTML = '';
            }
        }
        
        console.log('✅ Modal closed successfully');
    } catch (error) {
        console.error('Error closing modal:', error);
        
        // Fallback cleanup
        document.body.style.overflow = '';
    }
}

// Enhanced initialization with multiple fallback strategies
async function enhancedInitialization() {
    console.log('Starting enhanced initialization...');
    
    // Strategy 1: Normal initialization
    try {
        initializeAuth();
        const success = await setupEventListeners();
        if (success) {
            console.log('Normal initialization successful');
            return true;
        }
    } catch (error) {
        console.error('Normal initialization failed:', error);
    }
    
    // Strategy 2: Delayed initialization
    console.log('Trying delayed initialization...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        initializeAuth();
        const success = await setupEventListeners();
        if (success) {
            console.log('Delayed initialization successful');
            return true;
        }
    } catch (error) {
        console.error('Delayed initialization failed:', error);
    }
    
    // Strategy 3: Force initialization with direct DOM manipulation
    console.log('Trying force initialization...');
    setTimeout(() => {
        const loginBtn = document.querySelector('.login-btn');
        const createAccountBtn = document.querySelector('.create-account-btn');
        
        if (loginBtn && createAccountBtn) {
            console.log('Force initialization: buttons found');
            
            // Create modal if it doesn't exist
            if (!document.getElementById('authModal')) {
                console.log('Creating auth modal...');
                const modalHTML = `
                                        <div class="modal-overlay" id="authModal">
                        <div class="modal-content auth-modal">
                            <button class="modal-close">&times;</button>
                            <div id="auth-container"></div>
                            <p class="auth-disclaimer">
                                By signing up you confirm that you are over 18 years old and agree to the <a href="#">Terms and Conditions</a>.
                            </p>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Force setup
            authModal = document.getElementById('authModal');
            authContainer = document.getElementById('auth-container');
            
            // Add direct event listeners with proper event handling
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Force login clicked');
                
                if (!supabase && !initializeSupabase()) {
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_in';
                renderAuthUI();
                openModal(authModal);
            });
            
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Force create account clicked');
                
                if (!supabase && !initializeSupabase()) {
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_up';
                renderAuthUI();
                openModal(authModal);
            });
            
            console.log('Force initialization complete');
        }
    }, 2000);
    
    return false;
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error('No user found');
            return;
        }
        
        // Insert or update profile
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                username: username || null,
                email: user.email,
                gender: gender || null,
                age: age ? parseInt(age) : null
            });
        
        if (error) {
            console.error('Profile update error:', error);
            // Don't show error to user, just continue
        }
        
        console.log('Profile updated successfully');
        
        // Close profile modal and update UI
        closeModal(profileModal);
        updateUIForLoggedInUser(user, username);
        
    } catch (error) {
        console.error('Error in handleProfileSubmit:', error);
        // Don't show error to user, just continue
        closeModal(profileModal);
        
        // Get user and update UI anyway
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            updateUIForLoggedInUser(user);
        }
    }
}

// Check if user needs to complete profile - REMOVED AUTO POPUP
async function checkUserProfile(user) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error && error.code === 'PGRST116') {
            // No profile found, but don't show modal automatically
            console.log('No profile found for user');
            return false;
        }
        
        if (error) {
            console.error('Error checking profile:', error);
            // If there's a database error, just proceed without profile check
            return true;
        }
        
        // Profile exists, user can continue
        return true;
    } catch (error) {
        console.error('Error in checkUserProfile:', error);
        return true; // Don't show profile modal if there's an error
    }
}

// Create dropdown menu HTML
function createDropdownMenu() {
    return `
        <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-item">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </div>
            <div class="dropdown-item logout-item" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        </div>
    `;
}

// Show dropdown
function showDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.add('active');
    }
}

// Hide dropdown
function hideDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// Setup profile dropdown functionality
function setupProfileDropdown() {
    // Remove existing dropdown if any
    const existingDropdown = document.getElementById('profileDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Add dropdown HTML to body
    document.body.insertAdjacentHTML('beforeend', createDropdownMenu());
    
    // Setup user profile click handler
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        // Remove any existing click listeners by cloning
        const newUserProfile = userProfile.cloneNode(true);
        userProfile.parentNode.replaceChild(newUserProfile, userProfile);
        
        newUserProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                // Position dropdown below user profile
                const rect = newUserProfile.getBoundingClientRect();
                dropdown.style.top = (rect.bottom + 10) + 'px';
                dropdown.style.right = (window.innerWidth - rect.right) + 'px';
                
                // Toggle dropdown
                dropdown.classList.toggle('active');
            }
        });
    }
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profileDropdown');
        const userProfile = document.querySelector('.user-profile');
        
        if (dropdown && userProfile && !userProfile.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
    
    // Setup logout button click handler
    setTimeout(() => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remove any existing listeners by cloning
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Logout button clicked');
                hideDropdown();
                await logout();
            });
            console.log('Logout button event listener attached');
        } else {
            console.log('Logout button not found in dropdown');
        }
    }, 100);
}

// Update UI for logged in user
async function updateUIForLoggedInUser(user, username = null) {
    console.log('Updating UI for logged in user');
    
    // Re-query DOM elements in case they were replaced
    const currentLoginBtn = document.querySelector('.login-btn');
    const currentCreateBtn = document.querySelector('.create-account-btn');
    
    // Hide login/create account buttons immediately
    if (currentLoginBtn) currentLoginBtn.style.display = 'none';
    if (currentCreateBtn) currentCreateBtn.style.display = 'none';
    
    // Show premium button immediately
    const premiumBtn = document.querySelector('.premium-button');
    if (premiumBtn) {
        premiumBtn.style.display = 'flex';
    }
    
    // Re-query user profile element and show it
    const currentUserProfile = document.querySelector('.user-profile');
    if (currentUserProfile) {
        currentUserProfile.style.display = 'flex';
        
        // Determine display name - never show email
        let displayName = null;
        
        if (!username) {
            // Debug user metadata (minimal logging)
            console.log('User provider:', user.app_metadata?.provider || 'email');
            
            // Check for display_name in user metadata first
            if (user.user_metadata && user.user_metadata.display_name) {
                displayName = user.user_metadata.display_name;
            }
            // Check if user logged in with OAuth provider
            else if (user.app_metadata && user.app_metadata.provider) {
                const provider = user.app_metadata.provider;
                
                if (provider === 'google' && user.user_metadata) {
                    // For Google, use full_name or name
                    displayName = user.user_metadata.full_name || 
                                 user.user_metadata.name || 
                                 user.user_metadata.given_name ||
                                 null;
                } else if ((provider === 'twitter' || provider === 'twitter_v2') && user.user_metadata) {
                    // For Twitter/X, check all possible fields
                    // Twitter sometimes returns data in different structures
                    displayName = user.user_metadata.name || 
                                 user.user_metadata.full_name ||
                                 user.user_metadata.user_name || 
                                 user.user_metadata.preferred_username || 
                                 user.user_metadata.screen_name ||
                                 user.user_metadata.nickname ||
                                 user.user_metadata.provider_username ||
                                 null;
                    
                    // If still no name, try to extract from identities
                    if (!displayName && user.identities && user.identities.length > 0) {
                        const twitterIdentity = user.identities.find(id => id.provider === 'twitter' || id.provider === 'twitter_v2');
                        if (twitterIdentity && twitterIdentity.identity_data) {
                            displayName = twitterIdentity.identity_data.name ||
                                         twitterIdentity.identity_data.full_name ||
                                         twitterIdentity.identity_data.user_name ||
                                         twitterIdentity.identity_data.preferred_username ||
                                         twitterIdentity.identity_data.screen_name ||
                                         null;
                        }
                    }
                    
                    // Also check raw_user_meta_data for Twitter
                    if (!displayName && user.raw_user_meta_data) {
                        displayName = user.raw_user_meta_data.name ||
                                     user.raw_user_meta_data.full_name ||
                                     user.raw_user_meta_data.user_name ||
                                     user.raw_user_meta_data.preferred_username ||
                                     null;
                    }
                    
                    // Display name found
                }
            }
            
            // Only check profiles table if we don't have a name yet
            if (!displayName) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, display_name')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile) {
                        displayName = profile.display_name || profile.username || null;
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
            
            // Final fallback - but never use email
            username = displayName || 'My Profile';
        }
        
        // Use a fixed avatar image - local SVG file
        const avatarUrl = '/default-avatar.svg';
        
        // Set avatar in header
        const profileImg = currentUserProfile.querySelector('.profile-img');
        if (profileImg) {
            profileImg.src = avatarUrl;
        }
        
        // Set display name in header
        const usernameDisplay = currentUserProfile.querySelector('.username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
        
        // Update dropdown menu if it exists
        const dropdownMenu = document.getElementById('profileDropdown');
        if (dropdownMenu) {
            const dropdownProfileImg = dropdownMenu.querySelector('.dropdown-profile-img');
            const dropdownUsername = dropdownMenu.querySelector('.dropdown-username');
            const dropdownEmail = dropdownMenu.querySelector('.dropdown-email');
            
            if (dropdownProfileImg) dropdownProfileImg.src = avatarUrl;
            if (dropdownUsername) dropdownUsername.textContent = username || 'My Profile';
            if (dropdownEmail) dropdownEmail.textContent = user.email;
        }
        
        // Ensure profile dropdown is set up after login
        setupProfileDropdown();
    }
}

// Initialize only when user clicks login - NO AUTO LOGIN CHECK
document.addEventListener('DOMContentLoaded', async () => {
    authDebug('DOM Content Loaded - Starting auth initialization');
    console.log('DOM Content Loaded - Starting auth initialization');
    
    // Wait for DOM to be fully loaded and scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use enhanced initialization
    authDebug('Starting enhanced initialization');
    await enhancedInitialization();
    
    // Setup profile form if it exists
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
        console.log('Profile form listener added');
    }
    
    // Setup user profile dropdown
    setupProfileDropdown();
    
    console.log('Auth initialization complete - ready for user interaction');
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Document is still loading, event listener will work
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    // Document has already loaded, run initialization immediately
    console.log('Document already loaded, running immediate initialization');
    setTimeout(async () => {
        console.log('Backup initialization starting');
        await enhancedInitialization();
        setupProfileDropdown();
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        console.log('Backup initialization complete - ready for user interaction');
    }, 1000);
}

// Final fallback initialization
setTimeout(() => {
    console.log('Final fallback initialization check...');
    
    // Check if buttons are working
    const loginBtn = document.querySelector('.login-btn');
    const createAccountBtn = document.querySelector('.create-account-btn');
    
    if (loginBtn && createAccountBtn) {
        // Test if buttons have click handlers
        const hasLoginHandler = loginBtn.onclick || loginBtn.getAttribute('onclick');
        const hasCreateHandler = createAccountBtn.onclick || createAccountBtn.getAttribute('onclick');
        
        if (!hasLoginHandler || !hasCreateHandler) {
            console.log('Buttons found but no handlers detected, running final setup...');
            enhancedInitialization();
        } else {
            console.log('Buttons appear to be working correctly');
        }
    } else {
        console.log('Auth buttons not found in final check');
    }
}, 3000);

// Handle logout
async function logout() {
    authDebug('Logout initiated');
    console.log('🚪 Logout initiated');
    
    try {
        // Step 1: Try proper Supabase logout first
        if (supabase) {
            authDebug('Attempting Supabase logout');
            console.log('🔄 Attempting proper Supabase logout...');
            
            try {
                // Use global scope to ensure logout across all tabs
                const { error } = await supabase.auth.signOut({
                    scope: 'global'
                });
                
                if (error) {
                    authDebug('Supabase signOut warning', error);
                    console.warn('⚠️ Supabase signOut warning:', error.message);
                    // Don't throw error, continue with manual cleanup
                } else {
                    authDebug('Supabase signOut successful');
                    console.log('✅ Supabase signOut successful');
                }
            } catch (signOutError) {
                authDebug('SignOut exception', signOutError);
                console.warn('⚠️ SignOut exception:', signOutError.message);
                // Continue with manual cleanup
            }
        } else {
            authDebug('No supabase client available for logout');
        }
        
        // Step 2: Comprehensive cleanup of all auth data
        console.log('🧹 Performing comprehensive auth cleanup...');
        
        // Clear all possible auth-related storage keys
        const keysToRemove = [];
        
        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('supabase') || 
                key.includes('auth') || 
                key.includes('sb-') ||
                key.includes('gcrush') ||
                key === 'rememberMe'
            )) {
                keysToRemove.push(key);
            }
        }
        
        // Remove all auth-related keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        console.log('🗑️ Cleared auth keys:', keysToRemove);
        
        // Step 3: Reset UI state immediately and fix button event handlers
        console.log('🎨 Resetting UI to logged-out state...');
        
        const currentLoginBtn = document.querySelector('.login-btn');
        const currentCreateBtn = document.querySelector('.create-account-btn');
        const currentUserProfile = document.querySelector('.user-profile');
        const premiumBtn = document.querySelector('.premium-button');
        
        // Show login/create buttons
        if (currentLoginBtn) {
            currentLoginBtn.style.display = 'inline-block';
            currentLoginBtn.style.visibility = 'visible';
            
            // Fix event listener issue - remove all existing listeners and add fresh ones
            const newLoginBtn = currentLoginBtn.cloneNode(true);
            currentLoginBtn.parentNode.replaceChild(newLoginBtn, currentLoginBtn);
            
            // Add fresh event listener
            newLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Login button clicked after logout');
                
                if (!supabase) {
                    console.error('Supabase not initialized');
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_in';
                renderAuthUI();
                openModal(document.getElementById('authModal'));
            });
            
            console.log('✅ Login button event listener refreshed');
        }
        
        if (currentCreateBtn) {
            currentCreateBtn.style.display = 'inline-block';
            currentCreateBtn.style.visibility = 'visible';
            
            // Fix event listener issue for create button too
            const newCreateBtn = currentCreateBtn.cloneNode(true);
            currentCreateBtn.parentNode.replaceChild(newCreateBtn, currentCreateBtn);
            
            // Add fresh event listener
            newCreateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔐 Create account button clicked after logout');
                
                if (!supabase) {
                    console.error('Supabase not initialized');
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_up';
                renderAuthUI();
                openModal(document.getElementById('authModal'));
            });
            
            console.log('✅ Create account button event listener refreshed');
        }
        
        // Hide user profile and premium button
        if (currentUserProfile) {
            currentUserProfile.style.display = 'none';
        }
        if (premiumBtn) {
            premiumBtn.style.display = 'none';
        }
        
        // Step 4: Close any open dropdowns or modals and reset their states
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileDropdown) {
            profileDropdown.remove();
        }
        
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
            authModal.classList.remove('active');
            document.body.style.overflow = '';
            
            // Clear any existing modal content to prevent stale state
            const authContainer = document.getElementById('auth-container');
            if (authContainer) {
                authContainer.innerHTML = '';
            }
        }
        
        // Step 5: Clear global Supabase state
        console.log('🔄 Clearing global Supabase state...');
        
        // Don't reinitialize - keep using the global client
        // Just ensure we're properly logged out
        if (window.supabase && window.supabase.auth) {
            // Double-check logout was successful
            const { data: { session } } = await window.supabase.auth.getSession();
            if (session) {
                console.warn('⚠️ Session still exists after logout, forcing clear...');
                await window.supabase.auth.signOut({ scope: 'global' });
            }
        }
        
        console.log('✅ Logout completed successfully');
        
        // Optional: Show brief success message
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        notification.textContent = 'Successfully logged out';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error during logout:', error);
        
        // Emergency fallback: force clear everything and reload
        console.log('🆘 Emergency logout fallback...');
        
        // Clear all storage
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (clearError) {
            console.error('Failed to clear storage:', clearError);
        }
        
        // Force page reload as last resort
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Make logout available globally
window.logout = logout;

// Check if email is already registered (for signup)
async function checkEmailExists(email) {
    try {
        console.log('Checking if email exists:', email);
        
        // Validate email format first
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            return false;
        }
        
        // Temporarily disable email existence check to avoid false positives
        // The issue is that "Invalid login credentials" error can mean either:
        // 1. Email doesn't exist, or 
        // 2. Email exists but password is wrong
        // This ambiguity causes all emails to be treated as existing
        
        console.log('Email existence check disabled - allowing registration attempt');
        return false;
        
    } catch (error) {
        console.error('Error checking email existence:', error);
        // On error, assume email doesn't exist to allow registration
        return false;
    }
}

// Check if email exists for password reset (simplified approach)
async function checkEmailExistsForPasswordReset(email) {
    try {
        console.log('Checking if email exists for password reset:', email);
        
        // Validate email format first
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            return false;
        }
        
        // For password reset, we'll skip the pre-check to avoid rate limiting
        // Instead, we'll let the actual password reset call handle the validation
        // This is safer and avoids the 48-second security restriction
        
        console.log('Skipping pre-check for password reset to avoid rate limits');
        console.log('Email will be validated during actual password reset call');
        
        // Always return true for password reset - let Supabase handle the validation
        // This avoids the security rate limit and provides better user experience
        return true;
        
    } catch (error) {
        console.error('Error in password reset email check:', error);
        // On error, assume email exists to allow the reset attempt
        return true;
    }
}

// Show inline error or success message
function showInlineError(message, type = 'error') {
    // Remove any existing message
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create message element
    const msgElement = document.createElement('div');
    msgElement.className = `auth-message auth-${type}`;
    msgElement.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    
    // Insert message in auth form
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        const authHeader = authForm.querySelector('.auth-header');
        if (authHeader) {
            authHeader.insertAdjacentElement('afterend', msgElement);
        }
    }
}

// Clear inline error message
function clearInlineError() {
    const existingMsg = document.querySelector('.auth-message');
    if (existingMsg) {
        existingMsg.remove();
    }
}