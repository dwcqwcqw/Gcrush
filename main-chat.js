// 简化的聊天系统，集成在主页中
class MainChatSystem {
    constructor() {
        this.currentCharacter = null;
        this.currentSessionId = null;
        this.characters = [];
        this.currentUser = null;
        this.pendingMessage = null;
        this.isTyping = false;
        
        // Initialize Supabase
        if (window.supabase && window.supabase.createClient) {
            this.supabase = window.supabase.createClient(
                'https://kuflobojizyttadwcbhe.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
            );
        } else {
            console.error('Supabase not loaded');
        }
        
        this.init();
    }
    
    async init() {
        await this.setupAuthentication();
        this.setupEventListeners();
        this.checkUrlParameters();
    }

    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const characterName = urlParams.get('character');
        
        if (characterName) {
            // Delay to ensure page is fully loaded
            setTimeout(() => {
                this.startChat(characterName);
            }, 500);
        }
    }
    
    async setupAuthentication() {
        // Setup auth state listener
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                console.log('User signed in:', this.currentUser.email);
                
                // Create chat session if we're in a chat and don't have one
                if (this.currentCharacter && !this.currentSessionId) {
                    await this.createChatSession(this.currentCharacter);
                }
                
                // If there's a pending message, send it now
                if (this.pendingMessage) {
                    const message = this.pendingMessage;
                    this.pendingMessage = null;
                    await this.processMessage(message);
                }
                
                this.closeLoginModal();
                
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                console.log('User signed out');
            }
        });
        
        // Check for existing session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            console.log('Existing session found:', this.currentUser.email);
        }
    }
    
    setupEventListeners() {
        // Enter key to send message
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.getElementById('messageInput') === document.activeElement) {
                console.log('Enter key pressed in message input');
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    async startChat(characterName) {
        console.log('Starting chat with:', characterName);
        
        // Update URL to show current character
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('character', characterName);
        window.history.pushState({}, '', currentUrl);
        
        // Always show chat interface first
        this.showChatInterface();
        
        try {
            // Load character data
            const { data: character, error } = await this.supabase
                .from('characters')
                .select('*')
                .eq('name', characterName)
                .single();
            
            if (error) {
                console.error('Database error:', error);
                // Use fallback character data
                this.currentCharacter = this.getFallbackCharacter(characterName);
            } else {
                this.currentCharacter = character;
            }
            
            // Update character info in UI
            this.updateCharacterInfo();
            
            // Create or load chat session (only if user is logged in)
            if (this.currentUser) {
                await this.createChatSession(this.currentCharacter);
            }
            
            // Send initial messages
            await this.sendInitialMessages();
            
        } catch (error) {
            console.error('Error starting chat:', error);
            // Use fallback character and continue
            this.currentCharacter = this.getFallbackCharacter(characterName);
            this.updateCharacterInfo();
            
            // Add a system message about the error
            await this.addMessage('assistant', 'Hi! I\'m having some technical difficulties, but I\'m here to chat with you!', false);
        }
    }
    
    showChatInterface() {
        // Hide main content sections only
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('titleSection').style.display = 'none';
        document.getElementById('characterLobby').style.display = 'none';
        const faqSection = document.querySelector('.faq-section');
        if (faqSection) faqSection.style.display = 'none';
        
        // Show chat interface
        document.getElementById('chatInterface').style.display = 'flex';
        
        // Update sidebar active state
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => item.classList.remove('active'));
        
        // Load and render chat list
        this.renderChatList();
    }
    
    updateCharacterInfo() {
        if (this.currentCharacter) {
            const avatar = this.currentCharacter.images ? this.currentCharacter.images[0] : 
                          `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${this.currentCharacter.name}/${this.currentCharacter.name}1.png`;
            
            // Update character info in header
            document.getElementById('chatCharacterAvatar').src = avatar;
            document.getElementById('chatCharacterName').textContent = this.currentCharacter.name;
            
            // Set character image as background
            document.getElementById('chatBackground').style.backgroundImage = `url(${avatar})`;
        }
    }
    
    getFallbackCharacter(characterName) {
        return {
            id: 'fallback',
            name: characterName,
            images: [`https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${characterName}/${characterName}1.png`],
            personality: 'Friendly and helpful',
            background: 'I\'m an AI companion here to chat with you.',
            situation: `<You are chatting with ${characterName}>`,
            greeting: `Hey there! I'm ${characterName}. How are you doing today?`
        };
    }
    
    async createChatSession(character) {
        if (!this.currentUser) {
            console.log('Cannot create chat session - no user logged in');
            return;
        }
        
        try {
            const userId = this.currentUser.id;
            const characterId = character.id || 'fallback';
            
            console.log('Creating chat session:', {
                character_id: characterId,
                character_name: character.name,
                user_id: userId
            });
            
            // First, check if there's an existing active session for this user and character
            const { data: existingSessions, error: searchError } = await this.supabase
                .from('chat_sessions')
                .select('id, created_at')
                .eq('user_id', userId)
                .eq('character_id', characterId)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (searchError) {
                console.warn('Error searching for existing sessions:', searchError);
            }
            
            // If there's a recent session (within the last hour), use it instead of creating a new one
            if (existingSessions && existingSessions.length > 0) {
                const existingSession = existingSessions[0];
                const sessionTime = new Date(existingSession.created_at);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                
                if (sessionTime > oneHourAgo) {
                    console.log('Using existing recent session:', existingSession.id);
                    this.currentSessionId = existingSession.id;
                    return;
                }
            }
            
            // Create a new session with upsert to handle potential conflicts
            const sessionData = {
                character_id: characterId,
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_message_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .upsert(sessionData, { 
                    onConflict: 'user_id,character_id',
                    ignoreDuplicates: false 
                })
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error creating session:', error);
                
                // If upsert fails, try a simple insert with a timestamp suffix
                const fallbackData = {
                    ...sessionData,
                    created_at: new Date().toISOString()
                };
                
                const { data: fallbackResult, error: fallbackError } = await this.supabase
                    .from('chat_sessions')
                    .insert(fallbackData)
                    .select()
                    .single();
                
                if (fallbackError) {
                    throw fallbackError;
                }
                
                this.currentSessionId = fallbackResult.id;
                console.log('Chat session created with fallback method:', this.currentSessionId);
            } else {
                this.currentSessionId = data.id;
                console.log('Chat session created successfully:', this.currentSessionId);
            }
            
        } catch (error) {
            console.error('Error creating chat session:', error);
            
            // Generate a temporary session ID for this session only
            this.currentSessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('Using temporary session ID - messages will not be persisted:', this.currentSessionId);
        }
    }
    
    async sendInitialMessages() {
        if (!this.currentCharacter.situation || !this.currentCharacter.greeting) return;
        
        // Check if this character has been chatted with before
        const chatHistoryKey = `gcrush_chat_history_${this.currentCharacter.name}`;
        const hasChattedBefore = localStorage.getItem(chatHistoryKey);
        
        if (!hasChattedBefore) {
            // First time chatting with this character
            // Send situation message
            await this.addMessage('assistant', this.currentCharacter.situation, false);
            
            // Send greeting message after a delay
            setTimeout(async () => {
                await this.addMessage('assistant', this.currentCharacter.greeting, false);
                
                // Mark that we've chatted with this character
                localStorage.setItem(chatHistoryKey, 'true');
            }, 1000);
        } else {
            // Already chatted before - just send a welcome back message
            const welcomeBackMessages = [
                `Welcome back! I've missed chatting with you.`,
                `Hey there! Good to see you again.`,
                `Oh, you're back! How have you been?`,
                `*smiles* I was hoping you'd come back to chat!`,
                `Great to see you again! What's on your mind today?`
            ];
            const randomWelcome = welcomeBackMessages[Math.floor(Math.random() * welcomeBackMessages.length)];
            await this.addMessage('assistant', `[${this.currentCharacter.name}] ${randomWelcome}`, false);
        }
    }
    
    async sendMessage() {
        console.log('[sendMessage] Called');
        const input = document.getElementById('messageInput');
        if (!input) {
            console.error('[sendMessage] Message input not found');
            return;
        }
        
        const message = input.value.trim();
        console.log('[sendMessage] Message:', message);
        
        if (!message) {
            console.log('[sendMessage] Empty message, returning');
            return;
        }
        
        if (this.isTyping) {
            console.log('[sendMessage] Already typing, returning');
            return;
        }
        
        // Check if user is authenticated
        if (!this.currentUser) {
            console.log('[sendMessage] No user, showing login modal');
            this.pendingMessage = message;
            input.value = '';
            this.showLoginModal();
            return;
        }
        
        console.log('[sendMessage] Processing message...');
        await this.processMessage(message);
    }
    
    async processMessage(message) {
        const input = document.getElementById('messageInput');
        
        try {
            // Add user message first
            await this.addMessage('user', message, true);
            
            // Clear input after adding message
            input.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Get AI response
            const response = await this.getAIResponse(message);
            
            this.hideTypingIndicator();
            await this.addMessage('assistant', response, true);
        } catch (error) {
            console.error('Error in processMessage:', error);
            this.hideTypingIndicator();
            await this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.', true);
        }
    }
    
    async addMessage(role, content, saveToDb = true) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Process content for orange text formatting
        const processedContent = content
            .replace(/<([^>]+)>/g, '<span class="orange-text">&lt;$1&gt;</span>')
            .replace(/\*([^*]+)\*/g, '<span class="orange-text">$1</span>');
        messageContent.innerHTML = processedContent;
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to database
        if (saveToDb) {
            await this.saveMessageToDatabase(role, content);
        }
    }
    
    async saveMessageToDatabase(role, content) {
        // Only save to database if user is logged in and has a session
        if (!this.currentUser || !this.currentSessionId) {
            console.log('Skipping database save - user not logged in or no session');
            return;
        }
        
        if (!this.supabase) {
            console.error('Supabase client not initialized');
            return;
        }
        
        try {
            const messageType = role === 'assistant' ? 'character' : role;
            const userId = this.currentUser.id;
            
            console.log('Saving message to database:', {
                session_id: this.currentSessionId,
                user_id: userId,
                character_id: this.currentCharacter?.id,
                message_type: messageType,
                content_length: content.length
            });
            
            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert({
                    session_id: this.currentSessionId,
                    user_id: userId,
                    character_id: this.currentCharacter?.id || 'fallback',
                    message_type: messageType,
                    content: content,
                    created_at: new Date().toISOString()
                })
                .select();
            
            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }
            
            console.log('Message saved successfully:', data);
            
            // Update session timestamp
            const { error: updateError } = await this.supabase
                .from('chat_sessions')
                .update({
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentSessionId);
                
            if (updateError) {
                console.error('Session update error:', updateError);
            }
            
        } catch (error) {
            console.error('Error saving message to database:', error);
            // Don't throw - let chat continue even if save fails
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            console.log('Calling chat API with message:', userMessage);
            
            // Call through Cloudflare Worker endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character: this.currentCharacter,
                    message: userMessage,
                    sessionId: this.currentSessionId || undefined  // Don't send null/invalid session IDs
                })
            });
            
            const data = await response.json();
            console.log('Chat API response:', data);
            
            if (!response.ok) {
                console.error('Chat API error:', data);
                
                // Check if it's a mock response due to missing env vars
                if (data.mock) {
                    console.warn('Using mock response - RunPod API not configured on server');
                    return data.response;
                }
                
                throw new Error(data.error || `API request failed: ${response.status}`);
            }
            
            // Check if we got a mock response
            if (data.mock) {
                console.warn('Received mock response - RunPod API not configured on server');
            }
            
            return data.response || 'Sorry, I could not generate a response.';
            
        } catch (error) {
            console.error('Error calling chat API:', error);
            
            // Fallback to test mode
            console.warn('Using local test mode for AI response');
            return this.getTestResponse(userMessage);
        }
    }
    
    // Removed direct API call - using Worker endpoint only
    
    getTestResponse(userMessage) {
        // Simulated responses for testing
        const responses = [
            `That's interesting! Tell me more about that.`,
            `I understand what you're saying. ${userMessage} is definitely something worth discussing.`,
            `*smiles* I love chatting with you about this!`,
            `Oh really? That sounds amazing! What else?`,
            `Hmm, let me think about that... I find your perspective fascinating!`,
            `*laughs* You always know how to make our conversations interesting!`,
            `I'm really enjoying our chat! Your thoughts on this are quite intriguing.`
        ];
        
        // Add character-specific flavor
        const characterName = this.currentCharacter?.name || 'Assistant';
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return `[${characterName}] ${randomResponse}`;
    }
    
    // Removed API key and prompt building - handled by Worker
    
    showTypingIndicator() {
        this.isTyping = true;
        document.getElementById('typingIndicator').style.display = 'flex';
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        document.getElementById('typingIndicator').style.display = 'none';
    }
    
    showLoginModal() {
        console.log('[showLoginModal] Called');
        
        // First try to click the login button which should trigger the proper auth modal
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            console.log('[showLoginModal] Clicking login button');
            loginBtn.click();
            return;
        }
        
        // Fallback: directly show auth modal if login button not found
        const authModal = document.getElementById('authModal');
        if (authModal) {
            // Make sure auth is set to sign in mode
            if (window.authView) {
                window.authView = 'sign_in';
            }
            if (window.showAuthModal && typeof window.showAuthModal === 'function') {
                console.log('[showLoginModal] Using showAuthModal function');
                window.showAuthModal('sign_in');
            } else {
                console.log('[showLoginModal] Directly showing auth modal');
                authModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        } else {
            console.error('[showLoginModal] Auth modal not found!');
        }
    }
    
    closeLoginModal() {
        // Close the main auth modal
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        // Also try old modal in case it exists
        const loginModal = document.getElementById('chatLoginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    }
    
    // Removed createLoginModal - using main auth modal instead
    
    // Removed auth handling functions - using main auth system

    async renderChatList() {
        try {
            // Get all chat sessions for current user or all sessions if no user
            let query = this.supabase
                .from('chat_sessions')
                .select(`
                    id,
                    character_id,
                    created_at,
                    updated_at,
                    last_message_at,
                    characters!inner(name, images),
                    chat_messages(content, created_at)
                `)
                .order('updated_at', { ascending: false });

            if (this.currentUser) {
                query = query.eq('user_id', this.currentUser.id);
            }

            const { data: sessions, error } = await query;

            if (error) {
                console.warn('Failed to load chat sessions:', error);
                this.renderFallbackChatList();
                return;
            }

            const chatListContainer = document.getElementById('chatList');
            
            if (!sessions || sessions.length === 0) {
                chatListContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: rgba(255, 255, 255, 0.5);">
                        <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>No chat history yet</p>
                        <p style="font-size: 12px;">Start chatting with characters to see them here</p>
                    </div>
                `;
                return;
            }

            // Group sessions by character and get the most recent message
            const characterChats = {};
            
            sessions.forEach(session => {
                const characterName = session.characters?.name;
                if (!characterName) return;
                
                if (!characterChats[characterName] || 
                    new Date(session.updated_at) > new Date(characterChats[characterName].updated_at)) {
                    
                    // Get most recent message
                    const recentMessage = session.chat_messages && session.chat_messages.length > 0 ?
                        session.chat_messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
                    
                    characterChats[characterName] = {
                        ...session,
                        character_name: characterName,
                        recent_message: recentMessage ? recentMessage.content : 'Start chatting...',
                        recent_time: recentMessage ? recentMessage.created_at : session.created_at
                    };
                }
            });

            // Render chat items
            const chatItems = Object.values(characterChats)
                .sort((a, b) => new Date(b.recent_time) - new Date(a.recent_time))
                .map(chat => this.createChatItem(chat))
                .join('');

            chatListContainer.innerHTML = chatItems;

        } catch (error) {
            console.error('Error rendering chat list:', error);
            this.renderFallbackChatList();
        }
    }

    renderFallbackChatList() {
        // Show available characters as potential chats
        const characters = this.characters || this.getFallbackCharacters();
        const chatListContainer = document.getElementById('chatList');
        
        const chatItems = characters.slice(0, 6).map(character => {
            return `
                <div class="chat-item" onclick="mainChatSystem.startChat('${character.name}')">
                    <img class="chat-item-avatar" 
                         src="${character.images ? character.images[0] : `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${character.name}/${character.name}1.png`}" 
                         alt="${character.name}">
                    <div class="chat-item-info">
                        <div class="chat-item-name">${character.name}</div>
                        <div class="chat-item-preview">Start a conversation...</div>
                    </div>
                    <div class="chat-item-time">New</div>
                </div>
            `;
        }).join('');
        
        chatListContainer.innerHTML = chatItems;
    }

    getFallbackCharacters() {
        return [
            { name: 'Ethan', images: null },
            { name: 'Marco', images: null },
            { name: 'Phoenix', images: null },
            { name: 'Stefan', images: null },
            { name: 'Caleb Crimson', images: null },
            { name: 'Orion', images: null }
        ];
    }

    createChatItem(chat) {
        const characterName = chat.character_name;
        const characterData = chat.characters || this.characters?.find(c => c.name === characterName);
        
        // Get avatar from character data
        let avatar;
        if (characterData?.images) {
            avatar = Array.isArray(characterData.images) ? characterData.images[0] : characterData.images;
        } else {
            avatar = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${characterName}/${characterName}1.png`;
        }
        
        // Format time
        const timeAgo = this.formatTimeAgo(chat.recent_time);
        
        // Truncate message preview
        let preview = chat.recent_message || 'Start chatting...';
        if (preview.length > 50) {
            preview = preview.substring(0, 50) + '...';
        }
        
        const isActive = this.currentCharacter?.name === characterName ? 'active' : '';
        
        return `
            <div class="chat-item ${isActive}" onclick="mainChatSystem.startChat('${characterName}')">
                <img class="chat-item-avatar" src="${avatar}" alt="${characterName}">
                <div class="chat-item-info">
                    <div class="chat-item-name">${characterName}</div>
                    <div class="chat-item-preview">${preview}</div>
                </div>
                <div class="chat-item-time">${timeAgo}</div>
            </div>
        `;
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Now';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;
        
        // For older messages, show date
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    clearMessages() {
        document.getElementById('chatMessages').innerHTML = '';
    }
    
    // Method to reset first-time chat status (useful for testing)
    resetCharacterFirstChat(characterName) {
        const chatHistoryKey = `gcrush_chat_history_${characterName || this.currentCharacter?.name}`;
        localStorage.removeItem(chatHistoryKey);
        console.log('Reset first chat status for:', characterName || this.currentCharacter?.name);
    }
}

// Global functions
function backToExplore() {
    // Clear URL parameters
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.delete('character');
    window.history.pushState({}, '', currentUrl);
    
    // Hide chat interface
    document.getElementById('chatInterface').style.display = 'none';
    
    // Show main content
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('titleSection').style.display = 'block';
    document.getElementById('characterLobby').style.display = 'block';
    document.querySelector('.faq-section').style.display = 'block';
    
    // Clear current chat
    if (window.mainChatSystem) {
        window.mainChatSystem.currentCharacter = null;
        window.mainChatSystem.currentSessionId = null;
        window.mainChatSystem.clearMessages();
    }
}

function sendMessage() {
    if (window.mainChatSystem) {
        window.mainChatSystem.sendMessage();
    } else {
        console.error('mainChatSystem not initialized');
    }
}

// Initialize chat system when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.mainChatSystem = new MainChatSystem();
    } catch (error) {
        console.error('Failed to initialize MainChatSystem:', error);
    }
}); 