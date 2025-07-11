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
    }
    
    async setupAuthentication() {
        // Setup auth state listener
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                console.log('User signed in:', this.currentUser.email);
                
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
        try {
            // Load character data
            const { data: character, error } = await this.supabase
                .from('characters')
                .select('*')
                .eq('name', characterName)
                .single();
            
            if (error) throw error;
            
            this.currentCharacter = character;
            
            // Show chat interface
            this.showChatInterface();
            
            // Create or load chat session
            await this.createChatSession(character);
            
            // Send initial messages
            await this.sendInitialMessages();
            
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('无法开始聊天，请稍后重试。');
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
        
        // Update character info
        document.getElementById('chatCharacterAvatar').src = this.currentCharacter.images[0];
        document.getElementById('chatCharacterName').textContent = this.currentCharacter.name;
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
            
        } catch (error) {
            console.error('Error creating chat session:', error);
            this.currentSessionId = 'temp_' + Date.now();
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
        const processedContent = content.replace(/<([^>]+)>/g, '<span class="orange-text">$1</span>');
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
                        <h2>登录以继续聊天</h2>
                        <button class="auth-modal-close" onclick="mainChatSystem.closeLoginModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-modal-body">
                        <p>请登录以保存您的聊天记录并继续对话。</p>
                        
                        <div class="auth-tabs">
                            <button class="auth-tab active" onclick="mainChatSystem.switchAuthTab('signin')">登录</button>
                            <button class="auth-tab" onclick="mainChatSystem.switchAuthTab('signup')">注册</button>
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
                            <button class="social-btn google-btn" onclick="mainChatSystem.handleSocialAuth('google')">
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
                    alert('注册成功！请检查您的邮箱并点击确认链接。');
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

// Global functions
function backToExplore() {
    // Hide chat interface
    document.getElementById('chatInterface').style.display = 'none';
    
    // Show main content
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('titleSection').style.display = 'block';
    document.getElementById('characterLobby').style.display = 'block';
    document.querySelector('.faq-section').style.display = 'block';
    
    // Clear chat messages
    document.getElementById('chatMessages').innerHTML = '';
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