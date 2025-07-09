// Debug script to run in console
console.log('=== Authentication Debug Info ===');

// Check if Supabase is loaded
console.log('1. Supabase loaded:', typeof window.supabase !== 'undefined');

// Check if DOM elements exist
const elements = {
    loginBtn: document.querySelector('.login-btn'),
    createAccountBtn: document.querySelector('.create-account-btn'),
    authModal: document.getElementById('authModal'),
    authContainer: document.getElementById('auth-container'),
    profileModal: document.getElementById('profileModal')
};

console.log('2. DOM Elements:');
Object.entries(elements).forEach(([key, element]) => {
    console.log(`   ${key}:`, element ? 'Found' : 'NOT FOUND');
});

// Check if event listeners are attached
if (elements.loginBtn) {
    console.log('3. Login button click test...');
    elements.loginBtn.click();
} else {
    console.log('3. Cannot test login button - element not found');
}

// Test Supabase connection
if (window.supabase) {
    console.log('4. Testing Supabase connection...');
    const supabase = window.supabase.createClient(
        'https://kuflobojizyttadwcbhe.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
    );
    
    supabase.auth.getSession().then(result => {
        console.log('   Supabase session check:', result);
    }).catch(error => {
        console.error('   Supabase error:', error);
    });
} else {
    console.log('4. Supabase not available');
}

// Check if testAuth is available
console.log('5. Test functions available:', typeof window.testAuth !== 'undefined');

console.log('=== End Debug Info ===');