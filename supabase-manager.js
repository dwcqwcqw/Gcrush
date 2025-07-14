// Global Supabase Manager
// This ensures only ONE Supabase client instance exists across the entire application
// Preventing authentication conflicts and "fake login" issues

(function() {
    'use strict';
    
    const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';
    
    // Check if Supabase SDK is loaded
    if (!window.supabase || !window.supabase.createClient) {
        console.error('[SUPABASE-MANAGER] Supabase SDK not loaded! Make sure to include the SDK before this script.');
        return;
    }
    
    // Prevent multiple client creation
    if (window._supabaseClientInitialized) {
        console.warn('[SUPABASE-MANAGER] Supabase client already initialized. Skipping duplicate initialization.');
        return;
    }
    
    console.log('[SUPABASE-MANAGER] Initializing global Supabase client...');
    
    // Create the ONE and ONLY Supabase client
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'sb-kuflobojizyttadwcbhe-auth-token',
            flowType: 'pkce'
        }
    });
    
    // Make it globally available
    window.supabase = supabaseClient;
    window._supabaseClientInitialized = true;
    
    // Log auth state changes globally
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('[SUPABASE-MANAGER] Global auth state change:', {
            event: event,
            hasSession: !!session,
            userEmail: session?.user?.email,
            timestamp: new Date().toISOString()
        });
    });
    
    console.log('[SUPABASE-MANAGER] Global Supabase client ready');
    
    // Dispatch event to notify other scripts
    window.dispatchEvent(new CustomEvent('supabase-ready', { 
        detail: { client: supabaseClient } 
    }));
})();