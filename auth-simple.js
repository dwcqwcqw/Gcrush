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

// Initialize after DOM is loaded
function initializeAuth() {
    console.log('Initializing auth system...');
    console.log('window.supabase:', window.supabase);
    
    if (!window.supabase) {
        console.error('Supabase not loaded!');
        return;
    }
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
}"

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
                    <i class="fab fa-google"></i>
                    <span>Google</span>
                </button>
                <button class="social-btn" data-provider="twitter">
                    <i class="fab fa-twitter"></i>
                    <span>Twitter/X</span>
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

// Handle form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = authView === 'sign_in' ? 'Signing in...' : 'Signing up...';
    
    try {
        let result;
        if (authView === 'sign_in') {
            // Check if user exists first
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', email)
                .single();
            
            if (userError && userError.code === 'PGRST116') {
                alert('This email is not registered. Please sign up first.');
                return;
            }
            
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            // Check if user already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', email)
                .single();
            
            if (existingUser && !checkError) {
                alert('This email is already registered. Please log in instead.');
                return;
            }
            
            result = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });
            
            if (result.data.user && !result.error) {
                alert('Registration successful! Please check your email to confirm your account.');
            }
        }
        
        if (result.error) throw result.error;
        
        console.log('Auth successful:', result);
        
    } catch (error) {
        console.error('Auth error:', error);
        let errorMessage = 'Authentication failed';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password';
        } else if (error.message.includes('User already registered')) {
            errorMessage = 'This email is already registered';
        } else if (error.message.includes('Password should be at least 6 characters')) {
            errorMessage = 'Password must be at least 6 characters';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = authView === 'sign_in' ? 'Sign In' : 'Sign Up';
    }
}

// Handle social auth
async function handleSocialAuth(provider) {
    console.log(`Starting ${provider} authentication...`);
    
    try {
        const redirectUrl = window.location.origin + window.location.pathname;
        console.log('Redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectUrl
            }
        });
        
        if (error) throw error;
        
        console.log(`${provider} auth initiated successfully`, data);
        
    } catch (error) {
        console.error('Social auth error:', error);
        alert(`${provider} authentication failed: ${error.message}`);
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

// Modal Controls
function openModal(modal) {
    console.log('Opening modal:', modal);
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    console.log('Closing modal:', modal);
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event Listeners for opening modals
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    if (loginBtn) {
        console.log('Adding login button listener');
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login button clicked');
            if (!authModal || !authContainer) {
                console.error('Auth modal or container not found');
                return;
            }
            authView = 'sign_in';
            renderAuthUI();
            openModal(authModal);
        });
    } else {
        console.log('Login button not found');
    }
    
    if (createAccountBtn) {
        console.log('Adding create account button listener');
        createAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Create account button clicked');
            if (!authModal || !authContainer) {
                console.error('Auth modal or container not found');
                return;
            }
            authView = 'sign_up';
            renderAuthUI();
            openModal(authModal);
        });
    } else {
        console.log('Create account button not found');
    }
    
    // Close modal on clicking X or outside
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
}


// Handle Profile Setup
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('profileUsername').value;
    const gender = document.getElementById('profileGender').value;
    const age = parseInt(document.getElementById('profileAge').value);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username,
                    email: user.email,
                    gender: gender,
                    age: age,
                    updated_at: new Date().toISOString()
                });
                
            if (error) throw error;
            
            closeModal(profileModal);
            updateUIForLoggedInUser(user, username);
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Failed to update profile: ' + error.message);
        }
    }
}

// Update UI for logged in user
async function updateUIForLoggedInUser(user, username = null) {
    // Hide login/signup buttons
    if (loginBtn) loginBtn.style.display = 'none';
    if (createAccountBtn) createAccountBtn.style.display = 'none';
    
    // Show user profile
    if (userProfile) {
        userProfile.style.display = 'flex';
        
        // Set default avatar
        const profileImg = userProfile.querySelector('.profile-img');
        if (profileImg) {
            profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || user.email)}&background=A259FF&color=fff&size=128`;
        }
        
        // Get username from profile if not provided
        if (!username) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
                
            username = profile?.username;
        }
        
        const usernameDisplay = document.querySelector('.username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = 'My Profile';
        }
    }
}

// Check if user needs to complete profile
async function checkUserProfile(user) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, gender, age')
        .eq('id', user.id)
        .single();
        
    if (!profile || !profile.username || !profile.gender || !profile.age) {
        // Show profile setup modal
        openModal(profileModal);
        return false;
    }
    
    return true;
}

// Auth State Change Listener
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
    }
});

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
        <div class="dropdown-item" id="logoutOption">
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

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Starting auth initialization');
    
    // Wait for DOM to be fully loaded and scripts to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize auth system
    initializeAuth();
    
    // Wait a bit more for Supabase to fully initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup profile form if it exists
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
        console.log('Profile form listener added');
    }
    
    // Setup user profile dropdown
    setupProfileDropdown();
    
    // Check for existing session
    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Existing session:', session);
            
            if (session) {
                const profileComplete = await checkUserProfile(session.user);
                if (profileComplete) {
                    updateUIForLoggedInUser(session.user);
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }
    
    console.log('Auth initialization complete');
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
        initializeAuth();
        await new Promise(resolve => setTimeout(resolve, 200));
        setupEventListeners();
        setupProfileDropdown();
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        if (supabase) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const profileComplete = await checkUserProfile(session.user);
                    if (profileComplete) {
                        updateUIForLoggedInUser(session.user);
                    }
                }
            } catch (error) {
                console.error('Error in backup initialization:', error);
            }
        }
        console.log('Backup initialization complete');
    }, 1000);
}

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