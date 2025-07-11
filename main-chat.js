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
    }
    
    updateCharacterInfo() {
        if (this.currentCharacter) {
            const avatar = this.currentCharacter.images ? this.currentCharacter.images[0] : 
                          `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${this.currentCharacter.name}/${this.currentCharacter.name}1.png`;
            
            document.getElementById('chatCharacterAvatar').src = avatar;
            document.getElementById('chatCharacterName').textContent = this.currentCharacter.name;
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