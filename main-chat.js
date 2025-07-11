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
        this.supabase = window.supabase.createClient(
            'https://kuflobojizyttadwcbhe.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw'
        );
        
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
        // Hide main content
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('titleSection').style.display = 'none';
        document.getElementById('characterLobby').style.display = 'none';
        document.querySelector('.faq-section').style.display = 'none';
        
        // Show chat interface
        document.getElementById('chatInterface').style.display = 'flex';
        
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
        try {
            const userId = this.currentUser.id;
            
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .insert({
                    character_name: character.name,
                    user_id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.currentSessionId = data.id;
            console.log('Chat session created:', this.currentSessionId);
            
        } catch (error) {
            console.error('Error creating chat session:', error);
            // Don't create temp session - wait for user to login
        }
    }
    
    async sendInitialMessages() {
        if (!this.currentCharacter.situation || !this.currentCharacter.greeting) return;
        
        // Send situation message
        await this.addMessage('assistant', this.currentCharacter.situation, false);
        
        // Send greeting message after a delay
        setTimeout(async () => {
            await this.addMessage('assistant', this.currentCharacter.greeting, false);
        }, 1000);
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Check if user is authenticated
        if (!this.currentUser) {
            this.pendingMessage = message;
            input.value = '';
            this.showLoginModal();
            return;
        }
        
        await this.processMessage(message);
    }
    
    async processMessage(message) {
        const input = document.getElementById('messageInput');
        input.value = '';
        
        // Add user message
        await this.addMessage('user', message, true);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            await this.addMessage('assistant', response, true);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            await this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.', true);
        }
    }
    
    async addMessage(role, content, saveToDb = true) {
        const messagesContainer = document.getElementById('chatMessages');
        
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
        
        try {
            const messageType = role === 'assistant' ? 'character' : role;
            const userId = this.currentUser.id;
            
            const { error } = await this.supabase
                .from('chat_messages')
                .insert({
                    session_id: this.currentSessionId,
                    user_id: userId,
                    character_id: this.currentCharacter?.id,
                    message_type: messageType,
                    content: content,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
        } catch (error) {
            console.error('Error saving message to database:', error);
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            const apiKey = await this.getRunPodApiKey();
            const response = await fetch(`https://api.runpod.ai/v2/4cx6jtjdx6hdhr/runsync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    input: {
                        prompt: this.buildPrompt(userMessage),
                        max_tokens: 300,
                        temperature: 0.8,
                        top_p: 0.9
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.output?.generated_text || 'Sorry, I could not generate a response.';
            
        } catch (error) {
            console.error('Error calling RunPod API:', error);
            return 'I apologize, but I am having trouble responding right now. Please try again in a moment.';
        }
    }
    
    async getRunPodApiKey() {
        // Try to get from environment variables first
        if (window.ENV_CONFIG && window.ENV_CONFIG.RUNPOD_API_KEY) {
            return window.ENV_CONFIG.RUNPOD_API_KEY;
        }
        
        // No fallback - require environment variable
        throw new Error('RunPod API key not configured. Please set RUNPOD_API_KEY environment variable.');
    }
    
    buildPrompt(userMessage) {
        const character = this.currentCharacter;
        let prompt = `You are ${character.name}. `;
        
        if (character.personality) {
            prompt += `Your personality: ${character.personality}. `;
        }
        
        if (character.background) {
            prompt += `Your background: ${character.background}. `;
        }
        
        prompt += `User says: "${userMessage}"\n\nRespond as ${character.name}:`;
        
        return prompt;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        document.getElementById('typingIndicator').style.display = 'flex';
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        document.getElementById('typingIndicator').style.display = 'none';
    }
    
    showLoginModal() {
        let loginModal = document.getElementById('chatLoginModal');
        if (!loginModal) {
            this.createLoginModal();
            loginModal = document.getElementById('chatLoginModal');
        }
        
        loginModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    closeLoginModal() {
        const loginModal = document.getElementById('chatLoginModal');
        if (loginModal) {
            loginModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    createLoginModal() {
        const modalHTML = `
            <div id="chatLoginModal" class="auth-modal-overlay" style="display: none;">
                <div class="auth-modal-content">
                    <div class="auth-modal-header">
                        <h2>Login to Continue Chat</h2>
                        <button class="auth-modal-close" onclick="mainChatSystem.closeLoginModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-modal-body">
                        <p>Please login to save your chat history and continue the conversation.</p>
                        
                        <div class="auth-tabs">
                            <button class="auth-tab active" onclick="mainChatSystem.switchAuthTab('signin')">Sign In</button>
                            <button class="auth-tab" onclick="mainChatSystem.switchAuthTab('signup')">Sign Up</button>
                        </div>
                        
                        <form id="chatAuthForm" class="auth-form">
                            <div class="form-group">
                                <label for="chatEmail">Email</label>
                                <input type="email" id="chatEmail" required placeholder="Enter your email">
                            </div>
                            
                            <div class="form-group">
                                <label for="chatPassword">Password</label>
                                <input type="password" id="chatPassword" required placeholder="Enter your password">
                            </div>
                            
                            <button type="submit" class="auth-submit-btn">
                                <span class="btn-text">Sign In</span>
                            </button>
                        </form>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <div class="social-auth">
                            <button class="social-btn google-btn" onclick="mainChatSystem.handleSocialAuth('google')">
                                <i class="fab fa-google"></i>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup form submission
        document.getElementById('chatAuthForm').addEventListener('submit', (e) => {
            this.handleAuthSubmit(e);
        });
    }
    
    switchAuthTab(type) {
        const tabs = document.querySelectorAll('.auth-tab');
        const submitBtn = document.querySelector('.auth-submit-btn .btn-text');
        const passwordInput = document.getElementById('chatPassword');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        
        if (type === 'signin') {
            tabs[0].classList.add('active');
            submitBtn.textContent = 'Sign In';
            passwordInput.placeholder = 'Enter your password';
        } else {
            tabs[1].classList.add('active');
            submitBtn.textContent = 'Sign Up';
            passwordInput.placeholder = 'Create password (min 6 characters)';
        }
    }
    
    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('chatEmail').value;
        const password = document.getElementById('chatPassword').value;
        const isSignUp = document.querySelector('.auth-tab.active').textContent === 'Sign Up';
        const submitBtn = document.querySelector('.auth-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        
        const originalText = btnText.textContent;
        btnText.textContent = isSignUp ? 'Signing up...' : 'Signing in...';
        submitBtn.disabled = true;
        
        try {
            if (isSignUp) {
                const { data, error } = await this.supabase.auth.signUp({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                if (data.user && !data.session) {
                    alert('Registration successful! Please check your email and click the confirmation link.');
                } else {
                    console.log('Sign up and auto sign in successful');
                }
            } else {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                console.log('Sign in successful');
            }
        } catch (error) {
            console.error('Auth error:', error);
            let errorMessage = 'Authentication failed';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please confirm your email first';
            } else if (error.message.includes('User already registered')) {
                errorMessage = 'This email is already registered, please sign in';
            } else {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            btnText.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleSocialAuth(provider) {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/'
                }
            });
            
            if (error) throw error;
            
            console.log(`${provider} auth initiated`);
        } catch (error) {
            console.error(`${provider} auth error:`, error);
            alert(`${provider} login failed: ${error.message}`);
        }
    }

    async renderChatList() {
        try {
            // Get all chat sessions for current user or all sessions if no user
            let query = this.supabase
                .from('chat_sessions')
                .select(`
                    id,
                    character_name,
                    created_at,
                    updated_at,
                    chat_messages!inner(content, created_at)
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
                const characterName = session.character_name;
                if (!characterChats[characterName] || 
                    new Date(session.updated_at) > new Date(characterChats[characterName].updated_at)) {
                    
                    // Get most recent message
                    const recentMessage = session.chat_messages
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                    
                    characterChats[characterName] = {
                        ...session,
                        recent_message: recentMessage ? recentMessage.content : 'No messages yet',
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
        const character = this.characters?.find(c => c.name === characterName);
        const avatar = character?.images?.[0] || 
                      `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${characterName}/${characterName}1.png`;
        
        // Format time
        const timeAgo = this.formatTimeAgo(chat.recent_time);
        
        // Truncate message preview
        let preview = chat.recent_message || 'No messages yet';
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
    }
}

// Initialize chat system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mainChatSystem = new MainChatSystem();
}); 