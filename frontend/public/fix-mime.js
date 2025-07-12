// Client-side MIME type fix for script loading issues
// This script should be loaded as early as possible in the HTML

(function() {
    'use strict';
    
    console.log('MIME type fix script loaded');
    
    // Override createElement to ensure script tags have correct type
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            // Set default type for script elements
            element.type = 'text/javascript';
            
            // Override setAttribute to prevent type from being changed
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name.toLowerCase() === 'type' && value !== 'text/javascript' && value !== 'module') {
                    console.warn(`Prevented setting script type to "${value}", using "text/javascript" instead`);
                    value = 'text/javascript';
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
    
    // Fix existing script tags
    function fixExistingScripts() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (!script.type || script.type === 'text/html') {
                console.log(`Fixing script type for: ${script.src}`);
                
                // Create a new script element with correct type
                const newScript = document.createElement('script');
                newScript.src = script.src;
                newScript.type = 'text/javascript';
                
                // Copy other attributes
                Array.from(script.attributes).forEach(attr => {
                    if (attr.name !== 'src' && attr.name !== 'type') {
                        newScript.setAttribute(attr.name, attr.value);
                    }
                });
                
                // Copy event handlers
                if (script.onload) newScript.onload = script.onload;
                if (script.onerror) newScript.onerror = script.onerror;
                
                // Replace the script
                script.parentNode.replaceChild(newScript, script);
            }
        });
    }
    
    // Handle dynamic script loading with fetch fallback
    window.loadScriptWithFallback = async function(src) {
        console.log(`Loading script with fallback: ${src}`);
        
        try {
            // First try normal script loading
            return await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.type = 'text/javascript';
                script.onload = resolve;
                script.onerror = () => {
                    console.warn(`Normal script loading failed for ${src}, trying fetch...`);
                    
                    // Fallback to fetch
                    fetch(src)
                        .then(response => {
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            return response.text();
                        })
                        .then(code => {
                            // Execute the code
                            const scriptElement = document.createElement('script');
                            scriptElement.type = 'text/javascript';
                            scriptElement.textContent = code;
                            document.head.appendChild(scriptElement);
                            console.log(`Successfully loaded ${src} via fetch`);
                            resolve();
                        })
                        .catch(reject);
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error(`Failed to load script ${src}:`, error);
            throw error;
        }
    };
    
    // Monitor DOM changes and fix new scripts
    if (window.MutationObserver) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && node.src && (!node.type || node.type === 'text/html')) {
                        console.log(`Fixing dynamically added script: ${node.src}`);
                        node.type = 'text/javascript';
                    }
                });
            });
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
    
    // Fix scripts when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixExistingScripts);
    } else {
        fixExistingScripts();
    }
    
    // Export for use in other scripts
    window.MIMEFix = {
        fixExistingScripts,
        loadScriptWithFallback
    };
})();