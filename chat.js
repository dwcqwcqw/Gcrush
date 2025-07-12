// Chat System JavaScript
class ChatSystem {
    constructor() {
        this.currentCharacter = null;
        this.currentSessionId = null;
        this.characters = [];
        this.chatSessions = [];
        this.isTyping = false;
        this.currentUser = null;
        this.pendingMessage = null; // Store message when user needs to login
        
        // Use configuration from config.js
        this.userAvatar = CONFIG.USER_AVATAR;
        
        // Initialize Supabase
        this.supabase = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        
        // RunPod API configuration
        this.runpodApiUrl = CONFIG.RUNPOD_API_URL;
        this.runpodApiKey = CONFIG.RUNPOD_API_KEY;
        this.modelName = CONFIG.MODEL_NAME;
        
        this.init();
    }
    
    async init() {
        // Setup authentication first
        await this.setupAuthentication();
        
        await this.loadCharacters();
        await this.loadChatSessions();
        this.setupEventListeners();
        this.renderChatList();
        
        // Check if a character is specified in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const characterName = urlParams.get('character');
        
        if (characterName) {
            // Direct chat with specified character
            await this.selectCharacter(characterName);
        } else {
            // Show character selection if no character specified
            this.renderCharacterSelection();
        }
    }
    
    async loadCharacters() {
        try {
            const { data, error } = await this.supabase
                .from('characters')
                .select('*')
                .order('number', { ascending: true });
            
            if (error) throw error;
            
            this.characters = data || [];
            console.log('Characters loaded:', this.characters.length);
        } catch (error) {
            console.error('Error loading characters:', error);
            // Fallback to default characters if database fails
            this.characters = characterLoader ? characterLoader.getDefaultCharacters() : [];
        }
    }
    
    async loadChatSessions() {
        try {
            const userId = this.currentUser ? this.currentUser.id : 'anonymous';
            
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .select(`
                    *,
                    characters (
                        name,
                        images
                    )
                `)
                .eq('user_id', userId)
                .order('last_message_at', { ascending: false, nullsLast: true });
            
            if (error) throw error;
            
            this.chatSessions = data || [];
            console.log('Chat sessions loaded:', this.chatSessions.length);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            this.chatSessions = [];
        }
    }
    
    setupEventListeners() {
        // Handle Enter key in message input
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.scrollToBottom();
        });
        
        // Handle drawer toggle
        document.getElementById('drawerToggle').addEventListener('click', () => {
            this.toggleDrawer();
        });
        
        // Handle drawer overlay click
        document.getElementById('drawerOverlay').addEventListener('click', () => {
            this.closeDrawer();
        });
        
        // Handle escape key to close drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDrawer();
            }
        });
    }
    
    renderCharacterSelection() {
        const grid = document.getElementById('characterGridChat');
        if (!grid) return;
        
        const charactersHtml = this.characters.map(character => {
            const imageUrl = this.getCharacterImage(character);
            const truncatedDesc = this.truncateText(character.description || character.system_prompt || '', 80);
            
            return `
                <div class="character-card-chat" onclick="chatSystem.selectCharacter('${character.name}')">
                    <img src="${imageUrl}" alt="${character.name}">
                    <h3>${character.name}</h3>
                    <p>${truncatedDesc}</p>
                </div>
            `;
        }).join('');
        
        grid.innerHTML = charactersHtml;
    }
    
    renderChatList() {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;
        
        if (this.chatSessions.length === 0) {
            chatList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.5);">
                    <i class="fas fa-comments" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>No chats yet</p>
                    <p style="font-size: 12px;">Start a conversation!</p>
                </div>
            `;
            return;
        }
        
        const sessionsHtml = this.chatSessions.map(session => {
            const character = session.characters;
            const imageUrl = character && character.images ? 
                (Array.isArray(character.images) ? character.images[0] : character.images) :
                this.getCharacterImage(character);
            
            const lastMessage = session.session_name || `Chat with ${character?.name || 'Unknown'}`;
            const truncatedMessage = this.truncateText(lastMessage, 35);
            const timeAgo = this.formatTimeAgo(session.last_message_at || session.updated_at);
            
            return `
                <div class="chat-item ${session.id === this.currentSessionId ? 'active' : ''}" 
                     onclick="chatSystem.loadChatSession('${session.id}')">
                    <img class="chat-item-avatar" src="${imageUrl}" alt="${character?.name || 'Character'}">
                    <div class="chat-item-info">
                        <div class="chat-item-name">${character?.name || 'Unknown'}</div>
                        <div class="chat-item-preview">${truncatedMessage}</div>
                    </div>
                    <div class="chat-item-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        chatList.innerHTML = sessionsHtml;
    }
    
    async selectCharacter(characterName) {
        const character = this.characters.find(c => c.name === characterName);
        if (!character) return;
        
        this.currentCharacter = character;
        
        // Create new chat session
        await this.createChatSession(character);
        
        // Show chat interface directly (skip character selection)
        this.showChatInterface();
        
        // Send initial messages
        await this.sendInitialMessages();
    }
    
    async createChatSession(character) {
        try {
            const userId = this.currentUser ? this.currentUser.id : 'anonymous';
            
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .insert({
                    character_id: character.id,
                    user_id: userId,
                    session_name: `Chat with ${character.name}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.currentSessionId = data.id;
            console.log('Chat session created:', this.currentSessionId);
            
            // Reload chat sessions to update the list
            await this.loadChatSessions();
            this.renderChatList();
            
        } catch (error) {
            console.error('Error creating chat session:', error);
            // Generate a temporary session ID for offline use
            this.currentSessionId = 'temp_' + Date.now();
        }
    }
    
    async loadChatSession(sessionId) {
        try {
            // Load session details
            const { data: sessionData, error: sessionError } = await this.supabase
                .from('chat_sessions')
                .select(`
                    *,
                    characters (*)
                `)
                .eq('id', sessionId)
                .single();
            
            if (sessionError) throw sessionError;
            
            this.currentSessionId = sessionId;
            this.currentCharacter = sessionData.characters;
            
            // Load messages
            const { data: messages, error: messagesError } = await this.supabase
                .from('chat_messages')
                .select('message_type, content, created_at')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });
            
            if (messagesError) throw messagesError;
            
            // Show chat interface and render messages
            this.showChatInterface();
            this.renderMessages(messages || []);
            this.renderChatList(); // Update active state
            
        } catch (error) {
            console.error('Error loading chat session:', error);
        }
    }
    
    showChatInterface() {
        document.getElementById('characterSelection').style.display = 'none';
        document.getElementById('chatInterface').style.display = 'flex';
        
        // Update character info in header
        const avatar = document.getElementById('characterAvatar');
        const name = document.getElementById('characterName');
        
        if (this.currentCharacter) {
            avatar.src = this.getCharacterImage(this.currentCharacter);
            avatar.alt = this.currentCharacter.name;
            name.textContent = this.currentCharacter.name;
            
            // Set character background
            const chatInterface = document.getElementById('chatInterface');
            const imageUrl = this.getCharacterImage(this.currentCharacter);
            chatInterface.style.setProperty('--character-bg', `url(${imageUrl})`);
        }
        
        // Focus on message input
        document.getElementById('messageInput').focus();
    }
    
    showCharacterSelection() {
        document.getElementById('chatInterface').style.display = 'none';
        document.getElementById('characterSelection').style.display = 'block';
        
        this.currentCharacter = null;
        this.currentSessionId = null;
        
        // Update chat list to remove active state
        this.renderChatList();
    }
    
    async sendInitialMessages() {
        if (!this.currentCharacter) return;
        
        const messages = [];
        
        // Add situation message if available (marked as situation text)
        if (this.currentCharacter.situation) {
            messages.push({
                role: 'assistant',
                content: `<${this.currentCharacter.situation}>`
            });
        }
        
        // Add greeting message
        if (this.currentCharacter.greeting) {
            messages.push({
                role: 'assistant',
                content: this.currentCharacter.greeting
            });
        }
        
        // Send messages with delay
        for (let i = 0; i < messages.length; i++) {
            await this.delay(i * 1000); // 1 second delay between messages
            await this.addMessage(messages[i].role, messages[i].content, false);
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;
        
        // Check if user is authenticated
        if (!this.currentUser) {
            // Store the pending message
            this.pendingMessage = message;
            // Clear input
            input.value = '';
            // Show login modal
            this.showLoginModal();
            return;
        }
        
        // Clear input
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
        const messageElement = this.createMessageElement(role, content);
        
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        if (saveToDb && this.currentSessionId) {
            await this.saveMessageToDatabase(role, content);
        }
    }
    
    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        return messageDiv;
    }
    
    async saveMessageToDatabase(role, content) {
        try {
            const messageType = role === 'assistant' ? 'character' : role;
            const userId = this.currentUser ? this.currentUser.id : 'anonymous';
            
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
            
            // Update session's timestamp
            await this.supabase
                .from('chat_sessions')
                .update({
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentSessionId);
            
        } catch (error) {
            console.error('Error saving message:', error);
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
            
            return data.response || this.getFallbackResponse();
            
        } catch (error) {
            console.error('Chat API error:', error);
            // Fallback response
            return this.getFallbackResponse();
        }
    }
    
    async buildConversationHistory(userMessage) {
        const messages = [];
        
        // Add comprehensive system prompt with all character information
        if (this.currentCharacter) {
            let systemPrompt = '';
            
            // Add main system prompt
            if (this.currentCharacter.system_prompt) {
                systemPrompt += this.currentCharacter.system_prompt + '\n\n';
            }
            
            // Add character details
            systemPrompt += `Character Details:\n`;
            systemPrompt += `Name: ${this.currentCharacter.name}\n`;
            systemPrompt += `Age: ${this.currentCharacter.age}\n`;
            systemPrompt += `Style: ${this.currentCharacter.style || 'N/A'}\n`;
            
            if (this.currentCharacter.description) {
                systemPrompt += `Description: ${this.currentCharacter.description}\n`;
            }
            
            // Add situation context
            if (this.currentCharacter.situation) {
                systemPrompt += `\nCurrent Situation: ${this.currentCharacter.situation}\n`;
            }
            
            // Add greeting context
            if (this.currentCharacter.greeting) {
                systemPrompt += `Default Greeting: ${this.currentCharacter.greeting}\n`;
            }
            
            // Add personality tags
            const tags = [this.currentCharacter.tag1, this.currentCharacter.tag2, this.currentCharacter.tag3]
                .filter(tag => tag && tag.trim() !== '');
            if (tags.length > 0) {
                systemPrompt += `Personality Tags: ${tags.join(', ')}\n`;
            }
            
            systemPrompt += '\nPlease respond in character, maintaining consistency with these traits and the established conversation context.';
            
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Add recent conversation history
        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select('message_type, content')
                .eq('session_id', this.currentSessionId)
                .order('created_at', { ascending: false })
                .limit(15);
            
            if (!error && data) {
                // Reverse to get chronological order and convert message_type to role
                const recentMessages = data.reverse().map(msg => ({
                    role: msg.message_type === 'character' ? 'assistant' : msg.message_type,
                    content: msg.content
                }));
                messages.push(...recentMessages);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
        
        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        return messages;
    }
    
    getFallbackResponse() {
        const responses = [
            "I'm here to chat with you! Tell me more about yourself.",
            "That's interesting! I'd love to hear your thoughts on that.",
            "I'm enjoying our conversation. What would you like to talk about?",
            "Thanks for sharing that with me. How are you feeling today?",
            "I'm always here to listen. What's on your mind?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('chatMessages');
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="typing-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async clearChat() {
        if (!this.currentSessionId) return;
        
        if (confirm('Are you sure you want to clear this chat?')) {
            try {
                // Delete messages
                await this.supabase
                    .from('chat_messages')
                    .delete()
                    .eq('session_id', this.currentSessionId);
                
                // Delete session
                await this.supabase
                    .from('chat_sessions')
                    .delete()
                    .eq('id', this.currentSessionId);
                
                // Reload and show character selection
                await this.loadChatSessions();
                this.renderChatList();
                this.showCharacterSelection();
                
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
        }
    }
    
    renderMessages(messages) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            const role = message.message_type === 'character' ? 'assistant' : message.message_type;
            const messageElement = this.createMessageElement(role, message.content);
            messagesContainer.appendChild(messageElement);
        });
        
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Utility functions
    getCharacterImage(character) {
        if (!character) return 'https://via.placeholder.com/50x50/ff6b9d/ffffff?text=C';
        
        if (character.images && Array.isArray(character.images) && character.images.length > 0) {
            return character.images[0];
        }
        
        if (character.image) {
            return character.image;
        }
        
        return `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${character.name}/${character.name}1.png`;
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    formatMessage(content) {
        // Basic message formatting
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/<([^>]+)>/g, '<span class="action-text">$1</span>')
            .replace(/(^.*situation.*$)/gim, '<span class="situation-text">$1</span>');
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        
        return time.toLocaleDateString();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    toggleDrawer() {
        const drawer = document.getElementById('chatDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const main = document.querySelector('.chat-main');
        
        if (drawer.classList.contains('open')) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }
    
    openDrawer() {
        const drawer = document.getElementById('chatDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const main = document.querySelector('.chat-main');
        
        drawer.classList.add('open');
        overlay.classList.add('active');
        
        // On desktop, adjust main content margin
        if (window.innerWidth > 768) {
            main.classList.add('drawer-open');
        }
    }
    
    closeDrawer() {
        const drawer = document.getElementById('chatDrawer');
        const overlay = document.getElementById('drawerOverlay');
        const main = document.querySelector('.chat-main');
        
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        main.classList.remove('drawer-open');
    }
    
    async setupAuthentication() {
        // Setup auth state listener
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                console.log('User signed in:', this.currentUser.email);
                
                // Reload chat sessions for this user
                await this.loadChatSessions();
                this.renderChatList();
                
                // If there's a pending message, send it now
                if (this.pendingMessage) {
                    const message = this.pendingMessage;
                    this.pendingMessage = null;
                    
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
                
                // Close login modal if open
                this.closeLoginModal();
                
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                console.log('User signed out');
                
                // Clear chat sessions
                this.chatSessions = [];
                this.renderChatList();
            }
        });
        
        // Check for existing session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            console.log('Existing session found:', this.currentUser.email);
        }
    }
    
    showLoginModal() {
        // Create login modal if it doesn't exist
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
                        <h2>登录以继续聊天</h2>
                        <button class="auth-modal-close" onclick="chatSystem.closeLoginModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-modal-body">
                        <p>请登录以保存您的聊天记录并继续对话。</p>
                        
                        <div class="auth-tabs">
                            <button class="auth-tab active" onclick="chatSystem.switchAuthTab('signin')">登录</button>
                            <button class="auth-tab" onclick="chatSystem.switchAuthTab('signup')">注册</button>
                        </div>
                        
                        <form id="chatAuthForm" class="auth-form">
                            <div class="form-group">
                                <label for="chatEmail">邮箱</label>
                                <input type="email" id="chatEmail" required placeholder="请输入您的邮箱">
                            </div>
                            
                            <div class="form-group">
                                <label for="chatPassword">密码</label>
                                <input type="password" id="chatPassword" required placeholder="请输入密码">
                            </div>
                            
                            <button type="submit" class="auth-submit-btn">
                                <span class="btn-text">登录</span>
                            </button>
                        </form>
                        
                        <div class="auth-divider">
                            <span>或</span>
                        </div>
                        
                        <div class="social-auth">
                            <button class="social-btn google-btn" onclick="chatSystem.handleSocialAuth('google')">
                                <i class="fab fa-google"></i>
                                使用 Google 登录
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
            submitBtn.textContent = '登录';
            passwordInput.placeholder = '请输入密码';
        } else {
            tabs[1].classList.add('active');
            submitBtn.textContent = '注册';
            passwordInput.placeholder = '请设置密码（至少6位）';
        }
    }
    
    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('chatEmail').value;
        const password = document.getElementById('chatPassword').value;
        const isSignUp = document.querySelector('.auth-tab.active').textContent === '注册';
        const submitBtn = document.querySelector('.auth-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        
        const originalText = btnText.textContent;
        btnText.textContent = isSignUp ? '注册中...' : '登录中...';
        submitBtn.disabled = true;
        
        try {
            if (isSignUp) {
                const { data, error } = await this.supabase.auth.signUp({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                if (data.user && !data.session) {
                    // Need email confirmation
                    alert('注册成功！请检查您的邮箱并点击确认链接。');
                } else {
                    // Auto signed in
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
            let errorMessage = '认证失败';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = '邮箱或密码错误';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = '请先确认您的邮箱';
            } else if (error.message.includes('User already registered')) {
                errorMessage = '该邮箱已注册，请直接登录';
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
                    redirectTo: window.location.href
                }
            });
            
            if (error) throw error;
            
            console.log(`${provider} auth initiated`);
        } catch (error) {
            console.error(`${provider} auth error:`, error);
            alert(`${provider} 登录失败: ${error.message}`);
        }
    }
}

// Global functions for HTML onclick handlers
function showCharacterSelection() {
    // Only show character selection if no character is currently selected via URL
    const urlParams = new URLSearchParams(window.location.search);
    const characterName = urlParams.get('character');
    
    if (!characterName) {
        chatSystem.showCharacterSelection();
    }
}

function startNewChat() {
    // Clear URL parameters and show character selection
    window.history.replaceState({}, document.title, window.location.pathname);
    chatSystem.showCharacterSelection();
}

function clearChat() {
    chatSystem.clearChat();
}

function sendMessage() {
    chatSystem.sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        chatSystem.sendMessage();
    }
}

// Initialize chat system when page loads
let chatSystem;
document.addEventListener('DOMContentLoaded', () => {
    chatSystem = new ChatSystem();
});

// Handle URL parameters for direct character selection
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const characterName = urlParams.get('character');
    
    if (characterName && chatSystem) {
        // Wait for initialization to complete
        setTimeout(() => {
            chatSystem.selectCharacter(characterName);
        }, 1000);
    }
}); 