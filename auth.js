// Supabase Configuration
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.querySelector('.login-btn');
const createAccountBtn = document.querySelector('.create-account-btn');
const userProfile = document.querySelector('.user-profile');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

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
loginBtn.addEventListener('click', () => openModal(loginModal));
createAccountBtn.addEventListener('click', () => openModal(signupModal));

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

// Switch between login and signup
document.querySelectorAll('.switch-to-signup').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(signupModal);
    });
});

document.querySelectorAll('.switch-to-login').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signupModal);
        openModal(loginModal);
    });
});

// Handle Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const gender = document.getElementById('signupGender').value;
    const age = parseInt(document.getElementById('signupAge').value);
    
    try {
        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    gender: gender,
                    age: age
                }
            }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
            // Create user profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        username: username,
                        email: email,
                        gender: gender,
                        age: age,
                        created_at: new Date().toISOString()
                    }
                ]);
                
            if (profileError) {
                console.error('Profile creation error:', profileError);
            }
            
            alert('Account created successfully! Please check your email to verify your account.');
            closeModal(signupModal);
            signupForm.reset();
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message || 'An error occurred during signup');
    }
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
            console.log('Login successful:', data.user);
            closeModal(loginModal);
            loginForm.reset();
            updateUIForLoggedInUser(data.user);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Invalid email or password');
    }
});

// Update UI for logged in user
async function updateUIForLoggedInUser(user) {
    // Hide login/signup buttons
    loginBtn.style.display = 'none';
    createAccountBtn.style.display = 'none';
    
    // Show user profile
    userProfile.style.display = 'flex';
    
    // Get user profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
    if (profile) {
        document.querySelector('.username-display').textContent = profile.username;
    }
}

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        updateUIForLoggedInUser(session.user);
    }
});

// Handle logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Reset UI
        loginBtn.style.display = 'inline-block';
        createAccountBtn.style.display = 'inline-block';
        userProfile.style.display = 'none';
        
        // Reload page
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Add logout option to user profile dropdown (you'll need to add this to the HTML)
userProfile.addEventListener('click', () => {
    // For now, just logout on click
    if (confirm('Do you want to logout?')) {
        logout();
    }
});