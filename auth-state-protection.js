// Authentication State Protection System
// Protects auth state when navigating to potentially problematic pages

class AuthStateProtection {
    constructor() {
        this.PROTECTED_AUTH_KEY = 'gcrush_protected_auth_state';
        this.MAIN_AUTH_KEY = 'sb-kuflobojizyttadwcbhe-auth-token';
        this.PROTECTION_TIMESTAMP_KEY = 'gcrush_auth_protection_timestamp';
        this.PROTECTION_DURATION = 30 * 60 * 1000; // 30 minutes
        
        this.init();
    }
    
    init() {
        console.log('[AUTH-PROTECTION] Initializing auth state protection');
        
        // Check if we're returning from a protected navigation
        this.checkAndRestoreProtectedState();
        
        // Set up protection for generate-media links
        this.setupProtectionForLinks();
        
        // Set up protection for manual navigation
        this.setupNavigationProtection();
    }
    
    // Save current auth state before navigating to risky pages
    saveCurrentAuthState() {
        const currentAuthData = localStorage.getItem(this.MAIN_AUTH_KEY);
        const rememberMe = localStorage.getItem('rememberMe');
        
        if (currentAuthData) {
            const protectedState = {
                authToken: currentAuthData,
                rememberMe: rememberMe,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            localStorage.setItem(this.PROTECTED_AUTH_KEY, JSON.stringify(protectedState));
            localStorage.setItem(this.PROTECTION_TIMESTAMP_KEY, Date.now().toString());
            
            console.log('[AUTH-PROTECTION] Auth state saved for protection');
            return true;
        }
        
        console.log('[AUTH-PROTECTION] No auth state to protect');
        return false;
    }
    
    // Restore protected auth state if it was corrupted
    checkAndRestoreProtectedState() {
        const protectedStateStr = localStorage.getItem(this.PROTECTED_AUTH_KEY);
        const protectionTimestamp = localStorage.getItem(this.PROTECTION_TIMESTAMP_KEY);
        
        if (!protectedStateStr || !protectionTimestamp) {
            return false;
        }
        
        // Check if protection is still valid (not expired)
        const timeSinceProtection = Date.now() - parseInt(protectionTimestamp);
        if (timeSinceProtection > this.PROTECTION_DURATION) {
            console.log('[AUTH-PROTECTION] Protection expired, cleaning up');
            this.cleanupProtection();
            return false;
        }
        
        try {
            const protectedState = JSON.parse(protectedStateStr);
            const currentAuthData = localStorage.getItem(this.MAIN_AUTH_KEY);
            
            // Check if current auth state is different/corrupted
            if (this.isAuthStateCorrupted(currentAuthData, protectedState.authToken)) {
                console.log('[AUTH-PROTECTION] Detected corrupted auth state, restoring...');
                
                // Restore the protected state
                localStorage.setItem(this.MAIN_AUTH_KEY, protectedState.authToken);
                if (protectedState.rememberMe) {
                    localStorage.setItem('rememberMe', protectedState.rememberMe);
                }
                
                console.log('[AUTH-PROTECTION] Auth state restored successfully');
                
                // Clean up protection after successful restore
                this.cleanupProtection();
                
                // Force page reload to apply restored state
                setTimeout(() => {
                    window.location.reload();
                }, 100);
                
                return true;
            }
            
        } catch (error) {
            console.error('[AUTH-PROTECTION] Error restoring protected state:', error);
            this.cleanupProtection();
        }
        
        return false;
    }
    
    // Check if auth state is corrupted
    isAuthStateCorrupted(currentAuth, protectedAuth) {
        if (!currentAuth && protectedAuth) {
            return true; // Auth was lost
        }
        
        if (!currentAuth && !protectedAuth) {
            return false; // Both empty, not corrupted
        }
        
        if (!protectedAuth) {
            return false; // No protected state to compare
        }
        
        try {
            const currentData = JSON.parse(currentAuth);
            const protectedData = JSON.parse(protectedAuth);
            
            // Check if user ID changed (major corruption)
            if (currentData.user?.id !== protectedData.user?.id) {
                return true;
            }
            
            // Check if email changed (major corruption)
            if (currentData.user?.email !== protectedData.user?.email) {
                return true;
            }
            
            // Check if token structure is invalid
            if (!currentData.access_token || !currentData.user) {
                return true;
            }
            
        } catch (error) {
            return true; // Parse error indicates corruption
        }
        
        return false;
    }
    
    // Clean up protection data
    cleanupProtection() {
        localStorage.removeItem(this.PROTECTED_AUTH_KEY);
        localStorage.removeItem(this.PROTECTION_TIMESTAMP_KEY);
        console.log('[AUTH-PROTECTION] Protection data cleaned up');
    }
    
    // Set up protection for generate-media links
    setupProtectionForLinks() {
        // Protect all links to generate-media
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a, button');
            if (!link) return;
            
            const href = link.href || link.getAttribute('onclick') || '';
            
            if (href.includes('generate-media') || 
                link.textContent.includes('Generate Media') ||
                link.classList.contains('banner-split-cta')) {
                
                console.log('[AUTH-PROTECTION] Protecting auth state before generate-media navigation');
                this.saveCurrentAuthState();
            }
        });
    }
    
    // Set up protection for manual navigation
    setupNavigationProtection() {
        // Protect before page unload if going to generate-media
        window.addEventListener('beforeunload', () => {
            if (document.referrer.includes(window.location.origin)) {
                this.saveCurrentAuthState();
            }
        });
    }
    
    // Manual protection trigger (for programmatic navigation)
    protectAndNavigate(url) {
        this.saveCurrentAuthState();
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }
    
    // Force restore from protection (emergency function)
    forceRestore() {
        console.log('[AUTH-PROTECTION] Force restoring auth state...');
        return this.checkAndRestoreProtectedState();
    }
}

// Initialize protection system
let authProtection = null;

document.addEventListener('DOMContentLoaded', () => {
    authProtection = new AuthStateProtection();
    
    // Make it globally available for emergency use
    window.authProtection = authProtection;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthStateProtection;
} 