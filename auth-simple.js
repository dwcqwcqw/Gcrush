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
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
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
        
        if (event === 'SIGNED_IN' && session) {
            console.log('User signed in successfully');
            closeModal(authModal);
            
            // Always update UI for logged in user
            updateUIForLoggedInUser(session.user);
        } else if (event === 'SIGNED_OUT') {
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
        } else if (event === 'INITIAL_SESSION' && !session) {
            // User is not logged in on page load - do nothing
            console.log('No active session on page load');
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
                
                ${isSignUp ? `
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="terms" required>
                        <span>I agree to the <a href="#" class="auth-link">Terms of Service</a> and <a href="#" class="auth-link">Privacy Policy</a></span>
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
                    <span class="x-icon">𝕏</span>
                    <span>Continue with X</span>
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
        // Use the current page URL for OAuth redirect
        const redirectUrl = window.location.href.split('#')[0];
        console.log('Using OAuth redirect URL:', redirectUrl);
        
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
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
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
            
            // Add direct event listeners
            loginBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Force login clicked');
                
                if (!supabase && !initializeSupabase()) {
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_in';
                renderAuthUI();
                openModal(authModal);
            };
            
            createAccountBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Force create account clicked');
                
                if (!supabase && !initializeSupabase()) {
                    showInlineError('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_up';
                renderAuthUI();
                openModal(authModal);
            };
            
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
            <div class="dropdown-item logout-item" onclick="logout()">
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
}

// Update UI for logged in user
async function updateUIForLoggedInUser(user, username = null) {
    console.log('Updating UI for logged in user:', user.email);
    
    // Re-query DOM elements in case they were replaced
    const currentLoginBtn = document.querySelector('.login-btn');
    const currentCreateBtn = document.querySelector('.create-account-btn');
    
    // Hide login/create account buttons
    if (currentLoginBtn) currentLoginBtn.style.display = 'none';
    if (currentCreateBtn) currentCreateBtn.style.display = 'none';
    
    // Show premium button
    const premiumBtn = document.querySelector('.premium-button');
    if (premiumBtn) {
        premiumBtn.style.display = 'flex';
    }
    
    // Re-query user profile element and show it
    const currentUserProfile = document.querySelector('.user-profile');
    if (currentUserProfile) {
        currentUserProfile.style.display = 'flex';
        
        // Get username from profile if not provided
        if (!username) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                    
                username = profile?.username || user.email.split('@')[0];
            } catch (error) {
                console.error('Error getting username:', error);
                username = user.email.split('@')[0];
            }
        }
        
        // Generate avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || user.email)}&background=A259FF&color=fff&size=128`;
        
        // Set avatar in header
        const profileImg = currentUserProfile.querySelector('.profile-img');
        if (profileImg) {
            profileImg.src = avatarUrl;
        }
        
        // Set username in header
        const usernameDisplay = currentUserProfile.querySelector('.username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = username || 'My Profile';
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
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Reload page
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Make logout available globally
window.logout = logout;

// Check if email is already registered
async function checkEmailExists(email) {
    try {
        // Try to sign in with a dummy password to check if email exists
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy_check_12345678'
        });
        
        // If we get invalid credentials, the email exists
        if (error && error.message.includes('Invalid login credentials')) {
            return true;
        }
        
        // Any other error means email doesn't exist
        return false;
        
    } catch (error) {
        console.error('Error checking email:', error);
        return false; // On error, assume email doesn't exist
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