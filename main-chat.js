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
        this.setupSidebarHover();
    }
    
    async init() {
        await this.setupAuthentication();
        this.setupEventListeners();
        this.checkUrlParameters();
        this.initializeVoiceFeatures();
    }

    initializeVoiceFeatures() {
        // Wait for voice features to be loaded, then initialize
        if (window.voiceFeatures) {
            console.log('🎤 Voice features available, initializing...');
        } else {
            console.log('🎤 Waiting for voice features to load...');
            // Wait and try again
            setTimeout(() => this.initializeVoiceFeatures(), 100);
        }
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
                
                // Update voice features with new user context
                if (window.voiceFeatures && this.currentCharacter) {
                    window.voiceFeatures.updateContext(this.currentUser, this.currentCharacter);
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
    
    setupSidebarHover() {
        const mainSidebar = document.querySelector('.sidebar');
        if (mainSidebar) {
            // Listen for hover events on main sidebar when it's collapsed
            mainSidebar.addEventListener('mouseenter', () => {
                if (mainSidebar.classList.contains('collapsed')) {
                    const chatSidebar = document.querySelector('.chat-sidebar');
                    if (chatSidebar) {
                        chatSidebar.style.marginLeft = '240px'; // Expanded width
                    }
                }
            });
            
            mainSidebar.addEventListener('mouseleave', () => {
                if (mainSidebar.classList.contains('collapsed')) {
                    const chatSidebar = document.querySelector('.chat-sidebar');
                    if (chatSidebar) {
                        chatSidebar.style.marginLeft = '60px'; // Collapsed width
                    }
                }
            });
            
            // Also listen for manual toggle via menu button
            const menuToggle = document.querySelector('.menu-toggle');
            if (menuToggle) {
                // Add a mutation observer to watch for changes to sidebar class
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const chatSidebar = document.querySelector('.chat-sidebar');
                            if (chatSidebar) {
                                const isCollapsed = mainSidebar.classList.contains('collapsed');
                                chatSidebar.style.marginLeft = isCollapsed ? '60px' : '240px';
                            }
                        }
                    });
                });
                
                observer.observe(mainSidebar, { attributes: true, attributeFilter: ['class'] });
            }
        }
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
            
            // Initialize voice features for this character
            this.initializeVoiceFeaturesForChat();
            
            let hasExistingMessages = false;
            
            // Create or load chat session (only if user is logged in)
            if (this.currentUser) {
                await this.createChatSession(this.currentCharacter);
                // Historical messages are loaded in createChatSession if available
                const messagesContainer = document.getElementById('chatMessages');
                hasExistingMessages = messagesContainer && messagesContainer.children.length > 0;
            } else {
                // For non-logged in users, load messages from localStorage
                console.log('Loading chat history from localStorage for non-logged in user');
                const localMessages = this.loadMessagesFromLocalStorage();
                
                if (localMessages.length > 0) {
                    // Clear existing messages first
                    this.clearMessages();
                    
                    // Add each historical message to the UI
                    for (const message of localMessages) {
                        await this.addMessage(message.role, message.content, false); // Don't save to storage again
                    }
                    
                    console.log(`Restored ${localMessages.length} messages from localStorage`);
                    hasExistingMessages = true;
                }
            }
            
            // Send initial messages only if no chat history was loaded
            if (!hasExistingMessages) {
                await this.sendInitialMessages();
            }
            
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
        
        // Collapse main navigation sidebar when entering chat (hover to expand)
        const mainSidebar = document.querySelector('.sidebar');
        if (mainSidebar) {
            mainSidebar.classList.add('collapsed');
            
            // Manually adjust chat sidebar position based on main sidebar state
            setTimeout(() => {
                const chatSidebar = document.querySelector('.chat-sidebar');
                if (chatSidebar) {
                    chatSidebar.style.marginLeft = mainSidebar.classList.contains('collapsed') ? '60px' : '240px';
                }
            }, 50);
        }
        
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
    
    initializeVoiceFeaturesForChat() {
        if (window.voiceFeatures && this.currentCharacter) {
            console.log('🎤 Initializing voice features for chat with', this.currentCharacter.name);
            window.voiceFeatures.init(this.currentUser, this.currentCharacter);
        } else {
            console.log('🎤 Voice features not available or no character selected');
        }
    }
    
    getFallbackCharacter(characterName) {
        // Generate a temporary UUID for fallback character
        const fallbackId = this.generateTempUUID();
        
        return {
            id: fallbackId,
            name: characterName,
            description: `I'm ${characterName}, a friendly and engaging AI companion who loves connecting with people. I'm here to have meaningful conversations and share experiences with you.`,
            images: [`https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${characterName}/${characterName}1.png`],
            personality: 'Friendly and helpful',
            background: 'I\'m an AI companion here to chat with you.',
            situation: `Welcome to our private chat space! This is where you and ${characterName} can have open, honest conversations about anything that interests you.`,
            greeting: `Hey there! I'm ${characterName}. I'm really excited to meet you and get to know you better. How are you doing today?`,
            system_prompt: `You are ${characterName}, a friendly and helpful AI companion. You are warm, engaging, and genuinely interested in conversation. Respond naturally and keep your answers concise (1-3 sentences). Use first person and stay in character.`
        };
    }
    
    async createChatSession(character) {
        if (!this.currentUser) {
            console.log('Cannot create chat session - no user logged in');
            return;
        }
        
        try {
            const userId = this.currentUser.id;
            const characterId = character.id;
            
            // Validate that we have a valid character ID (UUID)
            if (!characterId || typeof characterId !== 'string') {
                console.error('Invalid character ID:', characterId);
                throw new Error('Character must have a valid UUID');
            }
            
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
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (searchError) {
                console.warn('Error searching for existing sessions:', searchError);
            }
            
            // If there's an existing active session, use it and load messages
            if (existingSessions && existingSessions.length > 0) {
                const existingSession = existingSessions[0];
                console.log('Using existing active session:', existingSession.id);
                this.currentSessionId = existingSession.id;
                this.sessionCreatedSuccessfully = true;
                
                // Load historical messages for this session
                await this.loadHistoricalMessages(this.currentSessionId);
                return;
            }
            
            // Create a new session
            const sessionData = {
                character_id: characterId,
                user_id: userId,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_message_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .insert(sessionData)
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error creating session:', error);
                throw error;
            }
            
            this.currentSessionId = data.id;
            this.sessionCreatedSuccessfully = true;
            console.log('New chat session created successfully:', this.currentSessionId);
            
        } catch (error) {
            console.error('Error creating chat session:', error);
            
            // Generate a valid UUID format for temporary session ID
            this.currentSessionId = this.generateTempUUID();
            this.sessionCreatedSuccessfully = false;
            console.log('Using temporary session ID - messages will not be persisted:', this.currentSessionId);
        }
    }
    
    async loadHistoricalMessages(sessionId) {
        if (!sessionId || !this.supabase) {
            console.log('Cannot load historical messages - missing sessionId or supabase');
            return;
        }
        
        try {
            console.log('Loading historical messages for session:', sessionId);
            
            const { data: messages, error } = await this.supabase
                .from('chat_messages')
                .select('message_type, content, created_at')
                .eq('session_id', sessionId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('Error loading historical messages:', error);
                return;
            }
            
            if (messages && messages.length > 0) {
                console.log(`Loaded ${messages.length} historical messages`);
                
                // Clear existing messages first
                this.clearMessages();
                
                // Add each historical message to the UI
                for (const message of messages) {
                    // Convert 'character' message type to 'assistant' for UI
                    const role = message.message_type === 'character' ? 'assistant' : message.message_type;
                    await this.addMessage(role, message.content, false); // Don't save to DB again
                }
                
                console.log('Historical messages loaded successfully');
            } else {
                console.log('No historical messages found for this session');
            }
            
        } catch (error) {
            console.error('Error loading historical messages:', error);
        }
    }
    
    // Generate a valid UUID format for temporary sessions
    generateTempUUID() {
        // Generate a UUID v4-like format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    async sendInitialMessages() {
        // Check if there are already messages in the chat (indicating we have chat history)
        const messagesContainer = document.getElementById('chatMessages');
        const hasExistingMessages = messagesContainer && messagesContainer.children.length > 0;
        
        if (!hasExistingMessages) {
            // First time chatting with this character - send initial messages in order
            console.log('Sending initial messages for first-time chat with', this.currentCharacter.name);
            
            let delay = 0;
            
            // 1. Send description (character introduction) first
            if (this.currentCharacter.description) {
                setTimeout(async () => {
                    await this.addMessage('assistant', this.currentCharacter.description, true);
                }, delay);
                delay += 800;
            }
            
            // 2. Send situation (context/setting) second  
            if (this.currentCharacter.situation) {
                setTimeout(async () => {
                    await this.addMessage('assistant', this.currentCharacter.situation, true);
                }, delay);
                delay += 800;
            }
            
            // 3. Send greeting (personal hello) third
            if (this.currentCharacter.greeting) {
                setTimeout(async () => {
                    await this.addMessage('assistant', this.currentCharacter.greeting, true);
                }, delay);
                delay += 800;
            }
            
            // 4. Send character video last (visual introduction)
            setTimeout(async () => {
                await this.addVideoMessage(this.currentCharacter.name, true);
            }, delay);
        }
        // If there are existing messages, we don't send initial messages again
        // as they should already be loaded from history
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
        
        // Check if this is a video message that should be rendered as video
        if (content.startsWith('[VIDEO]') && role === 'assistant') {
            // Extract character name from video message
            const match = content.match(/\[VIDEO\] Welcome video from (.+)/);
            if (match && match[1]) {
                const characterName = match[1];
                console.log('Recreating video message for:', characterName);
                await this.addVideoMessage(characterName, false); // Don't save again since it's from history
                return;
            }
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
        
        // Add voice play button for assistant messages
        if (role === 'assistant' && window.voiceFeatures) {
            window.voiceFeatures.addPlayButtonToMessage(messageDiv, content);
        }
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to database
        if (saveToDb) {
            await this.saveMessageToDatabase(role, content);
        }
    }
    
    async addVideoMessage(characterName, saveToDb = false) {
        const messagesContainer = document.getElementById('chatMessages');
        
        if (!messagesContainer) {
            console.error('Messages container not found');
            return;
        }
        
        // Create message element for video
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant video-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content video-content';
        
        // Create video element with enhanced error handling
        const videoUrl = `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/${characterName}/NSFW/${characterName}2.mov`;
        
        // Create video wrapper
        const videoWrapper = document.createElement('div');
        videoWrapper.className = 'video-wrapper loading';
        
        // Create video element
        const video = document.createElement('video');
        video.className = 'character-video';
        video.controls = true;
        video.preload = 'metadata';
        video.style.display = 'block';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        
        // Create video info
        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        videoInfo.innerHTML = `
            <span class="video-character-name">${characterName}</span>
            <span class="video-description">Welcome message</span>
        `;
        
        // Assemble the video message
        videoWrapper.appendChild(video);
        videoWrapper.appendChild(videoInfo);
        messageContent.appendChild(videoWrapper);
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        // Setup video event handlers after DOM insertion
        setTimeout(() => {
            if (video && videoWrapper) {
                console.log(`Setting up video for ${characterName} with URL: ${videoUrl}`);
                
                // Handle successful load
                video.addEventListener('loadeddata', () => {
                    console.log(`Video loaded successfully for ${characterName}`);
                    videoWrapper.classList.remove('loading');
                    console.log('Video element dimensions:', video.offsetWidth, 'x', video.offsetHeight);
                    console.log('Video element visibility:', getComputedStyle(video).visibility);
                    console.log('Video element display:', getComputedStyle(video).display);
                });
                
                // Handle when metadata is loaded
                video.addEventListener('loadedmetadata', () => {
                    console.log(`Video metadata loaded for ${characterName}`);
                    console.log('Video duration:', video.duration);
                    console.log('Video video width/height:', video.videoWidth, 'x', video.videoHeight);
                });
                
                // Handle errors
                video.addEventListener('error', (e) => {
                    console.error(`Video failed to load for ${characterName}:`, e);
                    console.error('Error code:', video.error?.code, 'Message:', video.error?.message);
                    videoWrapper.classList.remove('loading');
                    videoWrapper.classList.add('error');
                });
                
                // Handle user click to play
                video.addEventListener('click', () => {
                    console.log('Video clicked, attempting to play...');
                    if (video.paused) {
                        video.muted = false;
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('Video playing successfully');
                            }).catch((error) => {
                                console.error('Play failed:', error);
                            });
                        }
                    }
                });
                
                // Set video source and load
                console.log('Setting video source:', videoUrl);
                video.src = videoUrl;
                video.load();
                
                // Video visibility is now handled by CSS
            }
        }, 100);
        
        console.log(`Added video message for ${characterName}: ${videoUrl}`);
        
        // Save video message to database/localStorage if requested
        if (saveToDb) {
            const videoMessageContent = `[VIDEO] Welcome video from ${characterName}`;
            await this.saveMessageToDatabase('assistant', videoMessageContent);
        }
    }
    
    async saveMessageToDatabase(role, content) {
        // Save to localStorage for non-logged in users
        if (!this.currentUser) {
            console.log('User not logged in - saving to localStorage');
            this.saveMessageToLocalStorage(role, content);
            return;
        }
        
        // Only save to database if user is logged in and has a session
        if (!this.currentSessionId) {
            console.log('Skipping database save - no session');
            return;
        }
        
        // Don't save to database if using a temporary session ID, fallback character, or if session creation failed
        if (this.currentSessionId.startsWith('temp_') || 
            !this.sessionCreatedSuccessfully || 
            !this.currentCharacter?.id || 
            this.currentCharacter.id.includes('temp_') ||
            this.currentCharacter.id === 'fallback') {
            console.log('Skipping database save - using temporary session, fallback character, or session creation failed');
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
            const response = await fetch('/api/chat-enhanced', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character: this.currentCharacter,
                    message: userMessage,
                    sessionId: this.currentSessionId || undefined,
                    userId: this.currentUser?.id || undefined
                })
            });
            
            const data = await response.json();
            console.log('=== Frontend Chat API Response ===');
            console.log('Response status:', response.status, response.statusText);
            console.log('Response ok:', response.ok);
            console.log('Response data:', data);
            console.log('Has response field:', !!data.response);
            console.log('Response content:', data.response);
            console.log('Is mock:', !!data.mock);
            console.log('=== End Frontend Response ===');
            
            if (!response.ok) {
                console.error('Chat API error - response not ok:', data);
                
                // Check if it's a mock response due to missing env vars
                if (data.mock && data.response) {
                    console.warn('Using mock response - RunPod API not configured on server');
                    return data.response;
                }
                
                throw new Error(data.error || `API request failed: ${response.status}`);
            }
            
            // Check if we got a mock response
            if (data.mock) {
                console.warn('Received mock response - RunPod API not configured on server');
            }
            
            // Ensure we return a valid response
            if (data.response && typeof data.response === 'string' && data.response.trim()) {
                return data.response.trim();
            } else {
                console.error('Invalid or empty response from API:', data);
                return 'I\'m having trouble generating a response right now. Could you try again?';
            }
            
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
                    <div class="chat-item-content">
                        <div class="chat-item-header">
                            <div class="chat-item-name">${character.name}</div>
                            <div class="chat-item-time">New</div>
                        </div>
                        <div class="chat-item-preview">Start a conversation...</div>
                    </div>
                    <button class="chat-item-delete" onclick="event.stopPropagation(); mainChatSystem.deleteChatHistory('${character.name}')" title="Delete chat history">
                        <i class="fas fa-trash"></i>
                    </button>
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
                <div class="chat-item-content">
                    <div class="chat-item-header">
                        <div class="chat-item-name">${characterName}</div>
                        <div class="chat-item-time">${timeAgo}</div>
                    </div>
                    <div class="chat-item-preview">${preview}</div>
                </div>
                <button class="chat-item-delete" onclick="event.stopPropagation(); mainChatSystem.deleteChatHistory('${characterName}')" title="Delete chat history">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'New';
        
        const date = new Date(dateString);
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${month}/${day}/${hours}:${minutes}`;
    }

    clearMessages() {
        document.getElementById('chatMessages').innerHTML = '';
    }

    // Delete all chat history for a specific character
    async deleteChatHistory(characterName) {
        // Show confirmation dialog
        const confirmMessage = `Are you sure you want to delete all chat history with ${characterName}?\n\nThis action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            if (this.currentUser && this.supabase) {
                // Delete from database for logged-in users
                console.log(`🗑️ Deleting chat history for ${characterName} from database...`);
                
                // First, find the character ID
                const { data: character, error: charError } = await this.supabase
                    .from('characters')
                    .select('id')
                    .eq('name', characterName)
                    .single();

                if (charError || !character) {
                    console.error('Error finding character:', charError);
                    console.log(`No character found with name: ${characterName}`);
                    return;
                }

                // Then find all sessions for this user and character
                const { data: sessions, error: sessionError } = await this.supabase
                    .from('chat_sessions')
                    .select('id')
                    .eq('user_id', this.currentUser.id)
                    .eq('character_id', character.id);

                if (sessionError) {
                    console.error('Error finding sessions:', sessionError);
                    alert('Error accessing chat sessions. Please try again.');
                    return;
                } else if (sessions && sessions.length > 0) {
                    const sessionIds = sessions.map(s => s.id);
                    const success = await this.deleteSessionsAndMessages(sessionIds, characterName);
                    if (!success) return;
                } else {
                    console.log(`No sessions found for ${characterName}`);
                }
            }

            // Delete from localStorage
            const storageKey = `gcrush_chat_messages_${characterName}`;
            localStorage.removeItem(storageKey);
            console.log(`✅ Deleted chat history for ${characterName} from localStorage`);

            // Handle navigation after deletion
            await this.handlePostDeletionNavigation(characterName);

            // Show success message
            this.showTemporaryMessage(`Chat history with ${characterName} has been deleted.`, 'success');

        } catch (error) {
            console.error('Error deleting chat history:', error);
            alert('Error deleting chat history. Please try again.');
        }
    }

    // Show temporary message to user
    showTemporaryMessage(message, type = 'info') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = `chat-notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 193, 7, 0.9)'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-size: 14px;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Handle navigation after deleting chat history
    async handlePostDeletionNavigation(deletedCharacterName) {
        const wasCurrentCharacter = this.currentCharacter?.name === deletedCharacterName;
        
        // Refresh the chat sidebar first to get updated list
        await this.refreshChatSidebar();
        console.log('🔄 Refreshed recent chats list');

        if (wasCurrentCharacter) {
            console.log(`🧹 Deleted character ${deletedCharacterName} was current character`);
            
            // Clear current chat interface
            this.clearMessages();
            this.currentCharacter = null;
            this.currentSessionId = null;

            // Check if there are other characters with chat history
            const remainingChats = await this.getRemainingChatHistory();
            
            if (remainingChats.length > 0) {
                // Navigate to the first available character
                const firstChar = remainingChats[0];
                console.log(`🔀 Switching to ${firstChar.name}`);
                
                // Small delay to ensure UI updates
                setTimeout(() => {
                    this.startChat(firstChar.name);
                }, 500);
            } else {
                // No more chat history, go to home page
                console.log('🏠 No more chat history, returning to home page');
                setTimeout(() => {
                    this.closeChatInterface();
                }, 500);
            }
        }
    }

    // Get remaining characters with chat history
    async getRemainingChatHistory() {
        try {
            if (this.currentUser && this.supabase) {
                // Get from database
                const { data: sessions, error } = await this.supabase
                    .from('chat_sessions')
                    .select(`
                        id,
                        character_id,
                        characters!inner(name, images)
                    `)
                    .eq('user_id', this.currentUser.id)
                    .order('updated_at', { ascending: false });

                if (!error && sessions) {
                    // Group by character and get unique characters
                    const uniqueChars = {};
                    sessions.forEach(session => {
                        const charName = session.characters?.name;
                        if (charName && !uniqueChars[charName]) {
                            uniqueChars[charName] = {
                                name: charName,
                                images: session.characters.images
                            };
                        }
                    });
                    return Object.values(uniqueChars);
                }
            }
            
            // Fallback: check localStorage
            const localChars = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gcrush_chat_messages_')) {
                    const charName = key.replace('gcrush_chat_messages_', '');
                    const messages = localStorage.getItem(key);
                    if (messages && JSON.parse(messages).length > 0) {
                        localChars.push({ name: charName });
                    }
                }
            }
            return localChars;
            
        } catch (error) {
            console.error('Error getting remaining chats:', error);
            return [];
        }
    }

    // Close chat interface and return to home
    closeChatInterface() {
        const chatInterface = document.querySelector('.chat-interface');
        if (chatInterface) {
            chatInterface.style.display = 'none';
        }
        
        // Clear URL parameters
        const url = new URL(window.location);
        url.searchParams.delete('character');
        window.history.replaceState({}, '', url);
        
        // Reset state
        this.currentCharacter = null;
        this.currentSessionId = null;
        
        console.log('🏠 Returned to home page');
    }

    // Helper method to delete sessions and their messages
    async deleteSessionsAndMessages(sessionIds, characterName) {
        console.log(`Found ${sessionIds.length} sessions to delete for ${characterName}`);
        
        // Delete messages first
        const { error: messagesError } = await this.supabase
            .from('chat_messages')
            .delete()
            .in('session_id', sessionIds);

        if (messagesError) {
            console.error('Error deleting messages:', messagesError);
            alert('Error deleting chat messages. Please try again.');
            return false;
        }

        // Delete sessions
        const { error: sessionsError } = await this.supabase
            .from('chat_sessions')
            .delete()
            .in('id', sessionIds);

        if (sessionsError) {
            console.error('Error deleting sessions:', sessionsError);
            alert('Error deleting chat sessions. Please try again.');
            return false;
        }

        console.log(`✅ Successfully deleted ${sessionIds.length} sessions and their messages for ${characterName}`);
        return true;
    }

    // Refresh the chat sidebar after changes
    async refreshChatSidebar() {
        try {
            if (this.currentUser && this.supabase) {
                // Load recent chats from database
                await this.loadChatHistory();
            } else {
                // Show fallback characters list
                this.renderFallbackChatList();
            }
        } catch (error) {
            console.error('Error refreshing chat sidebar:', error);
            // Fallback to character list
            this.renderFallbackChatList();
        }
    }
    
    // Save message to localStorage for non-logged in users
    saveMessageToLocalStorage(role, content) {
        if (!this.currentCharacter) {
            console.log('No current character for localStorage save');
            return;
        }
        
        const storageKey = `gcrush_chat_messages_${this.currentCharacter.name}`;
        let messages = [];
        
        try {
            const existing = localStorage.getItem(storageKey);
            if (existing) {
                messages = JSON.parse(existing);
            }
        } catch (error) {
            console.error('Error parsing localStorage messages:', error);
            messages = [];
        }
        
        // Add new message
        const messageData = {
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            characterName: this.currentCharacter.name
        };
        
        messages.push(messageData);
        
        // Keep only last 100 messages per character to avoid storage limits
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages));
            console.log('Message saved to localStorage for', this.currentCharacter.name);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            // If storage is full, try to clear old messages and retry
            this.cleanupOldLocalStorageMessages();
            try {
                localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50))); // Keep only last 50
            } catch (retryError) {
                console.error('Failed to save even after cleanup:', retryError);
            }
        }
    }
    
    // Load messages from localStorage for non-logged in users
    loadMessagesFromLocalStorage() {
        if (!this.currentCharacter) {
            console.log('No current character for localStorage load');
            return [];
        }
        
        const storageKey = `gcrush_chat_messages_${this.currentCharacter.name}`;
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const messages = JSON.parse(stored);
                console.log(`Loaded ${messages.length} messages from localStorage for ${this.currentCharacter.name}`);
                return messages;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        
        return [];
    }
    
    // Clean up old localStorage messages to free space
    cleanupOldLocalStorageMessages() {
        console.log('Cleaning up old localStorage messages...');
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gcrush_chat_messages_')) {
                keysToRemove.push(key);
            }
        }
        
        // Remove oldest messages from each character (keep only 25 per character)
        keysToRemove.forEach(key => {
            try {
                const messages = JSON.parse(localStorage.getItem(key) || '[]');
                if (messages.length > 25) {
                    const trimmed = messages.slice(-25);
                    localStorage.setItem(key, JSON.stringify(trimmed));
                }
            } catch (error) {
                console.error('Error cleaning up messages for key:', key, error);
                localStorage.removeItem(key); // Remove corrupted data
            }
        });
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
    
    // Restore main navigation sidebar when returning to main page
    const mainSidebar = document.querySelector('.sidebar');
    if (mainSidebar) {
        mainSidebar.classList.remove('collapsed');
        
        // Also reset chat sidebar position
        const chatSidebar = document.querySelector('.chat-sidebar');
        if (chatSidebar) {
            chatSidebar.style.marginLeft = '240px';
        }
    }
    
    // Show main content
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('titleSection').style.display = 'block';
    document.getElementById('characterLobby').style.display = 'block';
    const faqSection = document.querySelector('.faq-section');
    if (faqSection) faqSection.style.display = 'block';
    
    // Force refresh of banner centering by triggering a reflow
    const heroBanner = document.querySelector('.hero-banner');
    if (heroBanner) {
        heroBanner.style.display = 'none';
        heroBanner.offsetHeight; // Force reflow
        heroBanner.style.display = '';
    }
    
    // Update sidebar active state to show Explore as active
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        // Set Explore as active
        if (item.querySelector('span') && item.querySelector('span').textContent.trim() === 'Explore') {
            item.classList.add('active');
        }
    });
    
    // Clear current chat
    if (window.mainChatSystem) {
        window.mainChatSystem.currentCharacter = null;
        window.mainChatSystem.currentSessionId = null;
        window.mainChatSystem.clearMessages();
    }
}

// Sidebar now uses hover-based expansion, no manual toggle needed

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