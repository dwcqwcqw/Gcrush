// Supabase Configuration
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const loginBtn = document.querySelector('.login-btn');
const createAccountBtn = document.querySelector('.create-account-btn');
const userProfile = document.querySelector('.user-profile');
const authContainer = document.getElementById('auth-container');

// Custom theme matching our design
const customTheme = {
    default: {
        colors: {
            brand: '#A259FF',
            brandAccent: '#F8A3FF',
            brandButtonText: 'white',
            defaultButtonBackground: 'rgba(60, 60, 70, 0.3)',
            defaultButtonBackgroundHover: 'rgba(60, 60, 70, 0.5)',
            defaultButtonBorder: 'rgba(80, 80, 90, 0.5)',
            defaultButtonText: '#C4C4C4',
            dividerBackground: 'rgba(80, 80, 90, 0.5)',
            inputBackground: 'rgba(60, 60, 70, 0.3)',
            inputBorder: 'rgba(80, 80, 90, 0.5)',
            inputBorderHover: '#A259FF',
            inputBorderFocus: '#A259FF',
            inputText: 'white',
            inputLabelText: '#C4C4C4',
            inputPlaceholder: 'rgba(255, 255, 255, 0.5)',
            messageText: '#C4C4C4',
            messageTextDanger: '#E63946',
            anchorTextColor: '#A259FF',
            anchorTextHoverColor: '#F8A3FF',
        },
        space: {
            spaceSmall: '8px',
            spaceMedium: '16px',
            spaceLarge: '24px',
            labelBottomMargin: '8px',
            anchorBottomMargin: '8px',
            emailInputSpacing: '8px',
            socialAuthSpacing: '8px',
            buttonPadding: '12px 24px',
            inputPadding: '12px 16px',
        },
        fontSizes: {
            baseBodySize: '14px',
            baseInputSize: '14px',
            baseLabelSize: '14px',
            baseButtonSize: '14px',
        },
        fonts: {
            bodyFontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
            buttonFontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
            inputFontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
            labelFontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
        },
        borderWidths: {
            buttonBorderWidth: '1px',
            inputBorderWidth: '1px',
        },
        radii: {
            borderRadiusButton: '50px',
            buttonBorderRadius: '50px',
            inputBorderRadius: '10px',
        },
    }
};

// Initialize Auth UI
let authView = 'sign_in';

function renderAuthUI() {
    // Clear previous content
    authContainer.innerHTML = '';
    
    // Create a container div
    const container = document.createElement('div');
    authContainer.appendChild(container);
    
    // Render Auth UI
    const { Auth } = window.SupabaseAuthUI || {};
    
    if (!Auth) {
        console.error('Supabase Auth UI not loaded');
        authContainer.innerHTML = '<p style="color: #E63946; text-align: center;">Authentication service is loading. Please try again.</p>';
        return;
    }
    
    const authComponent = window.React.createElement(Auth, {
        supabaseClient: supabase,
        view: authView,
        appearance: {
            theme: customTheme,
            style: {
                button: authView === 'sign_in' ? {
                    background: 'transparent',
                    color: '#A259FF',
                    borderRadius: '50px',
                    border: '2px solid #A259FF',
                } : {
                    background: 'linear-gradient(135deg, #A259FF, #F8A3FF)',
                    color: 'white',
                    borderRadius: '50px',
                },
                anchor: {
                    color: '#A259FF',
                },
                input: {
                    borderRadius: '10px',
                },
            },
        },
        localization: {
            variables: {
                sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign In',
                    loading_button_label: 'Signing in...',
                    social_provider_text: 'Sign in with {{provider}}',
                    link_text: "Don't have an account? Sign up",
                },
                sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign Up',
                    loading_button_label: 'Signing up...',
                    social_provider_text: 'Sign up with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                },
                forgotten_password: {
                    email_label: 'Email',
                    button_label: 'Send Reset Email',
                    loading_button_label: 'Sending...',
                    link_text: 'Back to sign in',
                },
            },
        },
        providers: ['google', 'github'],
        onlyThirdPartyProviders: false,
        magicLink: false,
        showLinks: true,
        otpType: 'email',
    });
    
    // Mount the component
    window.ReactDOM.render(authComponent, container);
}

// Modal Controls
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event Listeners for opening modals
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        authView = 'sign_in';
        renderAuthUI();
        openModal(authModal);
    });
}

if (createAccountBtn) {
    createAccountBtn.addEventListener('click', () => {
        console.log('Create account button clicked');
        authView = 'sign_up';
        renderAuthUI();
        openModal(authModal);
    });
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

// Handle Profile Setup
document.getElementById('profileForm').addEventListener('submit', async (e) => {
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
});

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
        
        // Auto-login after registration
        const isNewUser = event === 'SIGNED_IN' && !session.user.confirmed_at;
        
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

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for Auth UI module to load
    setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            const profileComplete = await checkUserProfile(session.user);
            if (profileComplete) {
                updateUIForLoggedInUser(session.user);
            }
        }
    }, 500);
});

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

// Toggle dropdown on user profile click
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

// Create profiles table in Supabase (run this in SQL editor)
/*
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    gender TEXT,
    age INTEGER CHECK (age >= 18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
*/