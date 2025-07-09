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
            
            // Check if profile is complete
            const profileComplete = await checkUserProfile(session.user);
            if (profileComplete) {
                updateUIForLoggedInUser(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            // Reset UI
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (createAccountBtn) createAccountBtn.style.display = 'inline-block';
            if (userProfile) userProfile.style.display = 'none';
            
            // Hide premium button
            const premiumBtn = document.querySelector('.premium-button');
            if (premiumBtn) {
                premiumBtn.style.display = 'none';
            }
        }
    });
}

// Initialize Auth UI
let authView = 'sign_in';

function renderAuthUI() {
    const isLogin = authView === 'sign_in';
    
    authContainer.innerHTML = `
        <div class="auth-ui-container">
            <h2 class="auth-title">${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            
            <form id="authForm" class="auth-form">
                <div class="form-group">
                    <input type="email" id="authEmail" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" id="authPassword" placeholder="Password" required>
                </div>
                
                <button type="submit" class="submit-btn ${isLogin ? 'login-style' : ''}">
                    ${isLogin ? 'Sign In' : 'Sign Up'}
                </button>
            </form>
            
            <div class="auth-divider">
                <span>or continue with</span>
            </div>
            
            <div class="social-auth">
                <button class="social-btn" data-provider="google">
                    <i class="fab fa-google"></i><span>Google</span>
                </button>
                <button class="social-btn" data-provider="twitter">
                    <span class="x-logo">𝕏</span><span>X</span>
                </button>
            </div>
            
            <div class="auth-switch">
                ${isLogin ? 
                    `Don't have an account? <a href="#" id="switchToSignup">Sign up</a>` : 
                    `Already have an account? <a href="#" id="switchToLogin">Sign in</a>`
                }
            </div>
        </div>
    `;
    
    // Add event listeners
    const form = document.getElementById('authForm');
    form.addEventListener('submit', handleAuthSubmit);
    
    // Social auth buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const provider = e.currentTarget.dataset.provider;
            handleSocialAuth(provider);
        });
    });
    
    // Switch between login/signup
    const switchLink = document.getElementById(isLogin ? 'switchToSignup' : 'switchToLogin');
    if (switchLink) {
        switchLink.addEventListener('click', (e) => {
            e.preventDefault();
            authView = isLogin ? 'sign_up' : 'sign_in';
            renderAuthUI();
        });
    }
}

// Handle auth form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    // Clear any previous errors
    clearInlineError();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const submitBtn = document.querySelector('#authForm button[type="submit"]');
    
    // Validate inputs
    if (!email || !password) {
        showInlineError('Please fill in all fields');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showInlineError('Password must be at least 6 characters');
        return;
    }
    
    // Store original button text and show loading
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    
    if (authView === 'sign_in') {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
    }
    
    try {
        let result;
        if (authView === 'sign_in') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            // Check if email is already registered
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                throw new Error('This email is already registered. Please log in instead.');
            }
            
            // Sign up without email confirmation
            result = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });
            
            // Check if user already exists
            if (result.error && result.error.message.includes('User already registered')) {
                throw new Error('This email is already registered. Please log in instead.');
            }
            
            // For signup, we want to automatically sign in the user
            if (result.data.user && !result.error) {
                // Automatically sign in after successful signup
                const signInResult = await supabase.auth.signInWithPassword({ email, password });
                if (signInResult.error) {
                    throw signInResult.error;
                }
                result = signInResult;
            }
        }
        
        if (result.error) throw result.error;
        
        console.log('Auth successful:', result);
        
        // Success - the auth state change listener will handle UI updates
        
    } catch (error) {
        console.error('Auth error:', error);
        let errorMessage = 'Authentication failed';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password';
        } else if (error.message.includes('already registered')) {
            errorMessage = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'Password must be at least 6 characters';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showInlineError(errorMessage);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Handle social auth
async function handleSocialAuth(provider) {
    console.log(`Starting ${provider} authentication...`);
    
    // Clear any previous errors
    clearInlineError();
    
    // Find the clicked button and show loading state
    const socialBtn = document.querySelector(`[data-provider="${provider}"]`);
    if (socialBtn) {
        const originalHTML = socialBtn.innerHTML;
        socialBtn.disabled = true;
        socialBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>`;
        
        // Reset button after 10 seconds (in case of redirect failure)
        setTimeout(() => {
            socialBtn.disabled = false;
            socialBtn.innerHTML = originalHTML;
        }, 10000);
    }
    
    try {
        // Use the correct production URL for OAuth redirect
        const redirectUrl = 'https://kuflobojizyttadwcbhe.supabase.co/auth/v1/callback';
        console.log('Using OAuth redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectUrl
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
                        alert('Authentication system is not ready. Please refresh the page.');
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
                        alert('Authentication system is not ready. Please refresh the page.');
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
                    alert('Authentication system is not ready. Please refresh the page.');
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
                    alert('Authentication system is not ready. Please refresh the page.');
                    return;
                }
                
                authView = 'sign_up';
                renderAuthUI();
                openModal(authModal);
            };
            
            console.log('Force initialization complete');
        } else {
            console.error('Force initialization failed: buttons not found');
        }
    }, 2000);
    
    return false;
}

// Handle Profile Setup
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('profileUsername').value.trim();
    const gender = document.getElementById('profileGender').value;
    const ageValue = document.getElementById('profileAge').value;
    const age = ageValue ? parseInt(ageValue) : null;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        try {
            // Prepare profile data - only include non-empty values
            const profileData = {
                id: user.id,
                email: user.email,
                updated_at: new Date().toISOString()
            };
            
            if (username) profileData.username = username;
            if (gender) profileData.gender = gender;
            if (age) profileData.age = age;
            
            const { error } = await supabase
                .from('profiles')
                .upsert(profileData);
                
            if (error) throw error;
            
            closeModal(profileModal);
            updateUIForLoggedInUser(user, username || user.email);
        } catch (error) {
            console.error('Profile update error:', error);
            
            // More specific error handling
            if (error.message.includes('relation "profiles" does not exist')) {
                alert('Database not properly configured. Please run the setup-profiles.sql script in your Supabase SQL editor.');
            } else if (error.message.includes('violates row-level security policy')) {
                alert('Permission denied. Please check your authentication status.');
            } else {
                alert('Failed to update profile: ' + (error.message || 'Unknown error'));
            }
        }
    }
}

// Check if user needs to complete profile - now optional
async function checkUserProfile(user) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (error && error.code === 'PGRST116') {
            // No profile found, show profile setup modal
            openModal(profileModal);
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

// Create dropdown menu for user profile
let dropdownMenu = null;

function createDropdownMenu() {
    if (dropdownMenu) return dropdownMenu;
    
    dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'profile-dropdown';
    dropdownMenu.innerHTML = `
        <div class="dropdown-item" id="settingsOption">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
        </div>
        <div class="dropdown-item logout-item" id="logoutOption">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </div>
    `;
    
    document.body.appendChild(dropdownMenu);
    
    // Event listeners for dropdown items
    document.getElementById('settingsOption').addEventListener('click', () => {
        alert('Settings page coming soon!');
        hideDropdown();
    });
    
    document.getElementById('logoutOption').addEventListener('click', () => {
        logout();
        hideDropdown();
    });
    
    return dropdownMenu;
}

function showDropdown() {
    const dropdown = createDropdownMenu();
    const rect = userProfile.getBoundingClientRect();
    
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.classList.add('active');
}

function hideDropdown() {
    if (dropdownMenu) {
        dropdownMenu.classList.remove('active');
    }
}

// Setup profile dropdown
function setupProfileDropdown() {
    if (userProfile) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = createDropdownMenu();
            if (dropdown.classList.contains('active')) {
                hideDropdown();
            } else {
                showDropdown();
            }
        });
    }
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', () => {
        hideDropdown();
    });
}

// Update UI for logged in user
async function updateUIForLoggedInUser(user, username = null) {
    // Hide login/signup buttons
    if (loginBtn) loginBtn.style.display = 'none';
    if (createAccountBtn) createAccountBtn.style.display = 'none';
    
    // Show premium button
    const premiumBtn = document.querySelector('.premium-button');
    if (premiumBtn) {
        premiumBtn.style.display = 'flex';
    }
    
    // Show user profile
    if (userProfile) {
        userProfile.style.display = 'flex';
        
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
        const profileImg = userProfile.querySelector('.profile-img');
        if (profileImg) {
            profileImg.src = avatarUrl;
        }
        
        // Set username in header
        const usernameDisplay = document.querySelector('.username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = username || 'My Profile';
        }
        
        // Update dropdown menu if it exists
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

// Check for existing session on page load
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
    
    // Don't check for existing session automatically - let users click login
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

// Check if email is already registered
async function checkEmailExists(email) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy_password_to_check_if_email_exists'
        });
        
        // If we get an "Invalid login credentials" error, it means email exists but password is wrong
        if (error && error.message.includes('Invalid login credentials')) {
            return true; // Email exists
        }
        
        // If we get any other error, email might not exist
        return false;
    } catch (error) {
        // Alternative method: try to sign up with the email
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: 'dummy_password_check_only'
            });
            
            if (signUpError && signUpError.message.includes('User already registered')) {
                return true; // Email exists
            }
            
            return false;
        } catch (e) {
            console.error('Error checking email:', e);
            return false;
        }
    }
}

// Show inline error message
function showInlineError(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.textContent = message;
    
    // Insert error message after the form title
    const authForm = document.getElementById('authForm');
    const formTitle = authForm.querySelector('h2');
    if (formTitle) {
        formTitle.insertAdjacentElement('afterend', errorElement);
    }
}

// Clear inline error message
function clearInlineError() {
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
}