// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContainer = document.querySelector('.tab-container');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get selected tab type
        const selectedTab = button.getAttribute('data-tab');
        console.log('Selected tab:', selectedTab);
        
        // You can add logic here to show/hide different content based on tab
    });
});

// Number selector functionality
const numberButtons = document.querySelectorAll('.number-button');
let selectedNumber = 1;

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        numberButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        // Get selected number
        selectedNumber = parseInt(button.getAttribute('data-value'));
        console.log('Selected number of images:', selectedNumber);
    });
});

// Generate button functionality
const generateButton = document.querySelector('.generate-button');
const customPrompt = document.getElementById('custom-prompt');
const negativePrompt = document.getElementById('negative-prompt');

generateButton.addEventListener('click', () => {
    // Collect all the data
    const mediaType = document.querySelector('.tab-button.active').getAttribute('data-tab');
    const customPromptValue = customPrompt.value.trim();
    const negativePromptValue = negativePrompt.value.trim();
    
    // Create generation request object
    const generationRequest = {
        type: mediaType,
        numberOfImages: selectedNumber,
        customPrompt: customPromptValue,
        negativePrompt: negativePromptValue,
        timestamp: new Date().toISOString()
    };
    
    console.log('Generation request:', generationRequest);
    
    // Show loading state
    generateButton.disabled = true;
    generateButton.innerHTML = `
        <svg class="generate-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        Generating...
    `;
    
    // Simulate API call (replace with actual API call)
    setTimeout(() => {
        // Reset button state
        generateButton.disabled = false;
        generateButton.innerHTML = `
            <svg class="generate-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Generate
        `;
        
        // Show success message or redirect
        alert(`Generating ${selectedNumber} ${mediaType}(s) with your specifications!`);
        
        // TODO: Implement actual generation logic here
        // This could involve:
        // 1. Sending request to your backend API
        // 2. Showing progress indicator
        // 3. Displaying results when ready
        
    }, 2000);
});

// Selection box click handlers
const selectionBoxes = document.querySelectorAll('.selection-box');

selectionBoxes.forEach(box => {
    box.addEventListener('click', () => {
        // Get the type of selection from the header text
        const headerText = box.querySelector('h3').textContent;
        console.log('Clicked on:', headerText);
        
        // TODO: Implement selection modals/dropdowns here
        // This could open a modal with options for:
        // - Character selection
        // - Pose selection
        // - Background selection
        // - Outfit selection
        
        // For now, just show a placeholder message
        if (headerText === 'Select Character') {
            alert('Character selection modal would open here');
        } else {
            alert(`${headerText} selection would open here`);
        }
    });
});

// Advanced settings toggle animation
const advancedSettings = document.querySelector('.advanced-settings');
const arrow = advancedSettings.querySelector('.arrow');

advancedSettings.addEventListener('toggle', () => {
    if (advancedSettings.open) {
        arrow.style.transform = 'rotate(180deg)';
    } else {
        arrow.style.transform = 'rotate(0deg)';
    }
});

// Add spinning animation to generate icon when loading
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .generate-button[disabled] .generate-icon {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// Gallery Management
let galleryItems = JSON.parse(localStorage.getItem('galleryItems') || '[]');
const galleryGrid = document.getElementById('galleryGrid');

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', () => {
    updateGalleryDisplay();
});

// Update gallery display based on current tab
function updateGalleryDisplay() {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    const filteredItems = galleryItems.filter(item => item.type === activeTab);
    
    // Sort by timestamp (newest first)
    filteredItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Clear gallery
    galleryGrid.innerHTML = '';
    
    // Add generating item if exists
    const generatingItem = filteredItems.find(item => item.status === 'generating');
    if (generatingItem) {
        const generatingEl = createGalleryItem(generatingItem);
        galleryGrid.appendChild(generatingEl);
    }
    
    // Add completed items
    filteredItems.filter(item => item.status === 'completed').forEach(item => {
        const itemEl = createGalleryItem(item);
        galleryGrid.appendChild(itemEl);
    });
}

// Create gallery item element
function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item glass-card';
    
    if (item.status === 'generating') {
        div.classList.add('generating');
        div.innerHTML = '<span class="status-text">Generating...</span>';
    } else {
        if (item.type === 'image') {
            div.innerHTML = `
                <img src="${item.url}" alt="Generated image">
                <span class="timestamp">${formatTimestamp(item.timestamp)}</span>
            `;
        } else {
            div.innerHTML = `
                <video src="${item.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()">
                    Your browser does not support the video tag.
                </video>
                <div class="play-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
                <span class="timestamp">${formatTimestamp(item.timestamp)}</span>
            `;
        }
        
        div.onclick = () => openFullscreen(item);
    }
    
    return div;
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Update generate button to add items to gallery
const originalGenerateClick = generateButton.onclick;
generateButton.onclick = () => {
    const mediaType = document.querySelector('.tab-button.active').getAttribute('data-tab');
    
    // Add generating item to gallery
    const generatingItem = {
        id: Date.now().toString(),
        type: mediaType,
        status: 'generating',
        timestamp: new Date().toISOString()
    };
    
    galleryItems.unshift(generatingItem);
    localStorage.setItem('galleryItems', JSON.stringify(galleryItems));
    updateGalleryDisplay();
    
    // Call original generate function
    originalGenerateClick();
    
    // Simulate completion (replace with actual API callback)
    setTimeout(() => {
        // Update item status and add mock URL
        const index = galleryItems.findIndex(item => item.id === generatingItem.id);
        if (index !== -1) {
            galleryItems[index].status = 'completed';
            galleryItems[index].url = mediaType === 'image' 
                ? `https://picsum.photos/400/400?random=${Date.now()}`
                : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            
            localStorage.setItem('galleryItems', JSON.stringify(galleryItems));
            updateGalleryDisplay();
        }
    }, 3000);
};

// Fullscreen preview functions
function openFullscreen(item) {
    const preview = document.getElementById('fullscreenPreview');
    const content = document.getElementById('fullscreenContent');
    
    if (item.type === 'image') {
        content.innerHTML = `<img src="${item.url}" alt="Fullscreen preview">`;
    } else {
        content.innerHTML = `
            <video src="${item.url}" controls autoplay>
                Your browser does not support the video tag.
            </video>
        `;
    }
    
    preview.classList.add('active');
}

function closeFullscreen() {
    const preview = document.getElementById('fullscreenPreview');
    const content = document.getElementById('fullscreenContent');
    
    preview.classList.remove('active');
    
    // Stop video if playing
    const video = content.querySelector('video');
    if (video) {
        video.pause();
    }
    
    // Clear content after animation
    setTimeout(() => {
        content.innerHTML = '';
    }, 300);
}

// Close fullscreen on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
});

// Update gallery when tab changes
tabButtons.forEach(button => {
    const originalClick = button.onclick;
    button.onclick = (e) => {
        if (originalClick) originalClick(e);
        updateGalleryDisplay();
    };
});