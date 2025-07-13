// Image Debug Tool - Real-time image visibility debugging
console.log('🖼️ Image Debug Tool Loaded');

// Function to check all character images
function checkAllImages() {
    const images = document.querySelectorAll('.character-image img');
    console.log(`🔍 Found ${images.length} character images`);
    
    images.forEach((img, index) => {
        const container = img.closest('.character-image');
        const card = img.closest('.character-card');
        
        console.log(`📸 Image ${index + 1}:`);
        console.log('  - Source:', img.src);
        console.log('  - Complete:', img.complete);
        console.log('  - Natural size:', img.naturalWidth + 'x' + img.naturalHeight);
        
        // Get computed styles
        const imgStyles = getComputedStyle(img);
        const containerStyles = getComputedStyle(container);
        
        console.log('  - Image computed styles:');
        console.log('    * opacity:', imgStyles.opacity);
        console.log('    * visibility:', imgStyles.visibility);
        console.log('    * display:', imgStyles.display);
        console.log('    * z-index:', imgStyles.zIndex);
        console.log('    * position:', imgStyles.position);
        console.log('    * width:', imgStyles.width);
        console.log('    * height:', imgStyles.height);
        
        console.log('  - Container computed styles:');
        console.log('    * opacity:', containerStyles.opacity);
        console.log('    * visibility:', containerStyles.visibility);
        console.log('    * display:', containerStyles.display);
        console.log('    * overflow:', containerStyles.overflow);
        
        // Get actual position and size
        const rect = img.getBoundingClientRect();
        console.log('  - Element rect:', rect);
        
        // Check if image is actually visible
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         imgStyles.opacity !== '0' && 
                         imgStyles.visibility !== 'hidden' && 
                         imgStyles.display !== 'none';
        
        console.log('  - Is visible:', isVisible ? '✅ YES' : '❌ NO');
        
        if (!isVisible) {
            console.log('  - 🚨 PROBLEM DETECTED! Forcing visibility...');
            
            // Force visibility with maximum strength
            img.style.setProperty('opacity', '1', 'important');
            img.style.setProperty('visibility', 'visible', 'important');
            img.style.setProperty('display', 'block', 'important');
            img.style.setProperty('z-index', '999', 'important');
            img.style.setProperty('position', 'absolute', 'important');
            img.style.setProperty('top', '0', 'important');
            img.style.setProperty('left', '0', 'important');
            img.style.setProperty('width', '100%', 'important');
            img.style.setProperty('height', '100%', 'important');
            
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('display', 'block', 'important');
            
            console.log('  - 🔧 Forced visibility applied');
        }
        
        console.log('---');
    });
    
    return images.length;
}

// Function to force all images visible immediately
function forceAllImagesVisible() {
    console.log('🚀 NUCLEAR FORCE: Making all images visible');
    
    const images = document.querySelectorAll('.character-image img');
    images.forEach((img, index) => {
        const container = img.closest('.character-image');
        
        // Remove any potentially conflicting classes
        img.classList.remove('loading', 'hidden');
        container.classList.remove('loading', 'hidden');
        
        // Force styles with maximum priority
        img.style.cssText = `
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            z-index: 999 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        `;
        
        container.style.cssText += `
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            background: transparent !important;
        `;
        
        console.log(`✅ Forced image ${index + 1} visible`);
    });
    
    console.log(`🎯 Force applied to ${images.length} images`);
}

// Auto-check on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded - checking images in 1 second...');
    setTimeout(() => {
        checkAllImages();
        
        // If no images are visible, force them
        setTimeout(() => {
            forceAllImagesVisible();
        }, 1000);
    }, 1000);
});

// Also check after window fully loads
window.addEventListener('load', () => {
    console.log('🪟 Window loaded - final image check...');
    setTimeout(() => {
        checkAllImages();
        forceAllImagesVisible();
    }, 500);
});

// Export debug functions to global scope
window.checkImages = checkAllImages;
window.forceImages = forceAllImagesVisible;

console.log('🛠️ Image Debug Tool Ready');
console.log('💡 Use window.checkImages() to check image status');
console.log('💡 Use window.forceImages() to force all images visible');