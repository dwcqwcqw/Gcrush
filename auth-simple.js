// Supabase Configuration
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

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
    if (!window.supabase) {
        console.error('Supabase SDK not loaded!');
        return false;
    }
    
    try {
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
        console.log('Supabase client initialized with persistent session');
        return true;
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        return false;
    }
}

// Initialize after DOM is loaded
function initializeAuth() {
    console.log('Initializing auth system...');
    
    // First, initialize Supabase client
    if (!initializeSupabase()) {
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
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // Handle all auth events that result in a valid session
        if (session && session.user) {
            console.log(`Auth event: ${event}, User: ${session.user.email}`);
            
            // Close any open auth modal
            if (authModal) {
                closeModal(authModal);
            }
            
            // Always update UI for logged in user
            await updateUIForLoggedInUser(session.user);
            
            // For OAuth providers, handle the redirect properly
            if (event === 'SIGNED_IN' && session.user.app_metadata?.provider) {
                console.log('OAuth sign in completed for provider:', session.user.app_metadata.provider);
                console.log('Full user data:', JSON.stringify(session.user, null, 2));
                
                // Force UI update for Twitter users who might have different metadata structure
                if (session.user.app_metadata.provider === 'twitter' || session.user.app_metadata.provider === 'twitter_v2') {
                    console.log('Twitter user detected, forcing UI update');
                    setTimeout(() => {
                        updateUIForLoggedInUser(session.user);
                    }, 500);
                }
                
                // Ensure we're on the main page after OAuth redirect
                if (window.location.pathname.includes('/auth/callback') || window.location.search.includes('code=')) {
                    console.log('Redirecting to main page after OAuth callback');
                    window.location.href = '/';
                }
            }
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            // Reset UI to show login/create account buttons
            const currentLoginBtn = document.querySelector('.login-btn');
            const currentCreateBtn = document.querySelector('.create-account-btn');
            const currentUserProfile = document.querySelector('.user-profile');
            
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
    
    // Check current session on initialization
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!error && session) {
            console.log('Existing session found on initialization');
            
            // Check if session is still valid using expires_at instead of created_at
            const now = Math.floor(Date.now() / 1000); // Current time in seconds
            const expiresAt = session.expires_at;
            
            if (expiresAt && now < expiresAt) {
                console.log(`Session is valid, expires at: ${new Date(expiresAt * 1000).toLocaleString()}`);
                updateUIForLoggedInUser(session.user);
            } else {
                console.log('Session has expired - requiring new login');
                supabase.auth.signOut();
            }
        } else {
            console.log('No existing session found');
        }
    });
}

// Render authentication UI
function renderAuthUI() {
    if (!authContainer) {
        console.error('Auth container not found!');
        return;
    }
    
    const isSignUp = authView === 'sign_up';
    
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
                    ${!isSignUp ? '<a href="#" class="forgot-password">Forgot password?</a>' : ''}
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
    
    // Add event listeners
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', handleAuthSubmit);
    }
    
    // Social auth buttons
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const provider = e.currentTarget.dataset.provider;
            handleSocialAuth(provider);
        });
    });
    
    // Switch auth view
    const switchToSignIn = document.getElementById('switchToSignIn');
    const switchToSignUp = document.getElementById('switchToSignUp');
    
    if (switchToSignIn) {
        switchToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            authView = 'sign_in';
            renderAuthUI();
        });
    }
    
    if (switchToSignUp) {
        switchToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            authView = 'sign_up';
            renderAuthUI();
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            authView = 'forgot_password';
            renderForgotPasswordUI();
        });
    }
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
        
        // First check if email exists in database
        const emailExists = await checkEmailExists(email);
        
        if (!emailExists) {
            showInlineError('No account found with this email address. Please check your email or create a new account.');
            return;
        }
        
        // Update loading text
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Sending...</span>`;
        
        // Use Supabase's password reset feature with explicit redirect URL
        // Use the full URL including protocol to ensure proper redirect
        const currentOrigin = window.location.origin;
        const redirectUrl = `${currentOrigin}/reset-password.html`;
        console.log('Password reset redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
            // Add additional headers to ensure proper redirect
            data: {
                redirect_to: redirectUrl
            }
        });
        
        if (error) throw error;
        
        // Show success message
        showInlineError('Password reset link sent! Please check your email.', 'success');
        
        // Clear the form
        document.getElementById('resetEmail').value = '';
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Failed to send reset link';
        if (error.message.includes('Rate limit')) {
            errorMessage = 'Too many requests. Please try again later';
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

// Handle form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
            console.log(`${provider} auth timeout - resetting button`);
        }
    }, 10000);
    
    try {
        // BOTH Google and Twitter should use the Supabase callback URL
        // This avoids issues with dynamic Cloudflare Pages URLs
        const redirectUrl = 'https://kuflobojizyttadwcbhe.supabase.co/auth/v1/callback';
        
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
    
    // Remove the blocking logic that's preventing the modal from working properly
    
    try {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Setup modal close handlers
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        }
        
        // Close on overlay click
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
        
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

function closeModal(modal) {
    console.log('Closing modal:', modal);
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    try {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    } catch (error) {
        console.error('Error closing modal:', error);
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
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                // Position dropdown below user profile
                const rect = userProfile.getBoundingClientRect();
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
            logoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideDropdown();
                logout();
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
            // Debug user metadata
            console.log('User metadata:', user.user_metadata);
            console.log('App metadata:', user.app_metadata);
            
            // Check for display_name in user metadata first
            if (user.user_metadata && user.user_metadata.display_name) {
                displayName = user.user_metadata.display_name;
            }
            // Check if user logged in with OAuth provider
            else if (user.app_metadata && user.app_metadata.provider) {
                const provider = user.app_metadata.provider;
                console.log('User logged in with provider:', provider);
                console.log('Full user object:', JSON.stringify(user, null, 2));
                
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
                    
                    console.log('Twitter/X display name found:', displayName);
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
    console.log('DOM Content Loaded - Starting auth initialization');
    
    // Wait for DOM to be fully loaded and scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use enhanced initialization
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
    console.log('Logout initiated');
    
    try {
        // First, check if we have a valid session
        if (supabase) {
            console.log('Checking for active session...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Error getting session:', sessionError);
            } else if (session) {
                console.log('Active session found, attempting signOut...');
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Supabase signOut error:', error);
                    // Continue with manual cleanup even if signOut fails
                } else {
                    console.log('Supabase signOut successful');
                }
            } else {
                console.log('No active session found, proceeding with manual cleanup');
            }
        }
    } catch (error) {
        console.error('Error during Supabase signOut:', error);
        // Continue with manual cleanup
    }
    
    // Clear all auth tokens from localStorage and sessionStorage
    const authKeys = [
        'gcrush-auth-token',
        'sb-kuflobojizyttadwcbhe-auth-token',
        'sb-kuflobojizyttadwcbhe-auth-token-refresh',
        'supabase.auth.token'
    ];
    
    // Clear specific auth keys
    authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    // Clear all localStorage items that might contain auth data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Local auth tokens cleared');
    
    // Reset UI immediately before reload
    const currentLoginBtn = document.querySelector('.login-btn');
    const currentCreateBtn = document.querySelector('.create-account-btn');
    const currentUserProfile = document.querySelector('.user-profile');
    
    if (currentLoginBtn) currentLoginBtn.style.display = 'inline-block';
    if (currentCreateBtn) currentCreateBtn.style.display = 'inline-block';
    if (currentUserProfile) currentUserProfile.style.display = 'none';
    
    // Always reload the page to reset UI state
    window.location.reload();
}

// Make logout available globally
window.logout = logout;

// Check if email is already registered
async function checkEmailExists(email) {
    try {
        console.log('Checking if email exists:', email);
        
        // Validate email format first
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format');
            return false;
        }
        
        // Only use the auth method to check email existence
        // This avoids RLS policy issues with the profiles table
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy_password_check_' + Math.random().toString(36).substring(7)
        });
        
        if (error) {
            console.log('Auth check response:', error.message);
            
            // Check for various error messages that indicate the email exists
            const errorMessage = error.message.toLowerCase();
            
            // If we get "Invalid login credentials", the email exists
            if (errorMessage.includes('invalid login credentials') || 
                errorMessage.includes('invalid credentials') ||
                errorMessage.includes('wrong password')) {
                console.log('Email exists - invalid credentials error');
                return true;
            }
            
            // If we get "Email not confirmed", the email exists but is unconfirmed
            if (errorMessage.includes('email not confirmed') || 
                errorMessage.includes('confirm your email')) {
                console.log('Email exists - unconfirmed account');
                return true;
            }
            
            // If we get rate limit error, we can't check, so return false to allow attempt
            if (errorMessage.includes('rate limit') || 
                errorMessage.includes('too many requests')) {
                console.log('Rate limited - cannot check email');
                return false;
            }
            
            // For any other error, assume email doesn't exist
            console.log('Email does not exist - other error:', error.message);
            return false;
        }
        
        // This shouldn't happen with a dummy password
        return false;
    } catch (error) {
        console.error('Error checking email existence:', error);
        // On error, assume email doesn't exist to allow registration
        return false;
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