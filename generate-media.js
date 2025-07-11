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