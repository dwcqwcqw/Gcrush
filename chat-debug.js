// Debug script to check chat functionality
console.log('=== CHAT DEBUG SCRIPT LOADED ===');

// Check if mainChatSystem exists
setTimeout(() => {
    console.log('Checking mainChatSystem after 1 second...');
    console.log('window.mainChatSystem:', window.mainChatSystem);
    
    if (window.mainChatSystem) {
        console.log('mainChatSystem properties:', {
            currentCharacter: window.mainChatSystem.currentCharacter,
            currentUser: window.mainChatSystem.currentUser,
            isTyping: window.mainChatSystem.isTyping
        });
    }
    
    // Check DOM elements
    console.log('DOM Elements:');
    console.log('- messageInput:', document.getElementById('messageInput'));
    console.log('- sendButton:', document.getElementById('sendButton'));
    console.log('- chatMessages:', document.getElementById('chatMessages'));
    console.log('- chatInterface:', document.getElementById('chatInterface'));
    
    // Override sendMessage to add debugging
    const originalSendMessage = window.sendMessage;
    window.sendMessage = function() {
        console.log('=== sendMessage INTERCEPTED ===');
        console.log('Calling original sendMessage...');
        if (originalSendMessage) {
            originalSendMessage();
        } else {
            console.error('Original sendMessage not found!');
        }
    };
    
    // Add click listener directly to button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        console.log('Adding direct click listener to sendButton');
        sendButton.addEventListener('click', (e) => {
            console.log('=== SEND BUTTON CLICKED (direct listener) ===');
            console.log('Event:', e);
            console.log('Current onclick:', sendButton.onclick);
        });
    }
    
    // Monitor input changes
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', (e) => {
            console.log('Input changed:', e.target.value);
        });
    }
    
}, 1000);

// Monitor for character selection
document.addEventListener('click', (e) => {
    if (e.target.closest('.character-card')) {
        console.log('=== CHARACTER CARD CLICKED ===');
        setTimeout(() => {
            console.log('After character click:');
            console.log('- chatInterface display:', document.getElementById('chatInterface')?.style.display);
            console.log('- mainChatSystem.currentCharacter:', window.mainChatSystem?.currentCharacter);
        }, 500);
    }
});