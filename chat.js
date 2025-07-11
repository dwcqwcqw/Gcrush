// Chat System JavaScript
class ChatSystem {
    constructor() {
        this.currentCharacter = null;
        this.currentSessionId = null;
        this.characters = [];
        this.chatSessions = [];
        this.isTyping = false;
        
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
        await this.loadCharacters();
        await this.loadChatSessions();
        this.setupEventListeners();
        this.renderCharacterSelection();
        this.renderChatList();
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
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .select(`
                    *,
                    characters (
                        name,
                        images
                    )
                `)
                .order('updated_at', { ascending: false });
            
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
            
            const lastMessage = session.last_message || 'Start chatting...';
            const truncatedMessage = this.truncateText(lastMessage, 35);
            const timeAgo = this.formatTimeAgo(session.updated_at);
            
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
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .insert({
                    character_id: character.id,
                    user_id: 'anonymous', // Replace with actual user ID when auth is implemented
                    last_message: '',
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
                .select('*')
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
            const { error } = await this.supabase
                .from('chat_messages')
                .insert({
                    session_id: this.currentSessionId,
                    role: role,
                    content: content,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            // Update session's last message and timestamp
            await this.supabase
                .from('chat_sessions')
                .update({
                    last_message: content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentSessionId);
            
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            // Build conversation history
            const messages = await this.buildConversationHistory(userMessage);
            
            // Call RunPod API
            const response = await fetch(this.runpodApiUrl + 'runsync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.runpodApiKey}`
                },
                body: JSON.stringify({
                    input: {
                        model: this.modelName,
                        messages: messages,
                        max_tokens: CONFIG.MAX_TOKENS,
                        temperature: CONFIG.TEMPERATURE,
                        top_p: CONFIG.TOP_P,
                        stop: CONFIG.STOP_SEQUENCES
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`RunPod API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'COMPLETED' && data.output) {
                return data.output.choices[0].message.content;
            } else {
                throw new Error('Invalid response from RunPod API');
            }
            
        } catch (error) {
            console.error('RunPod API error:', error);
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
                .select('role, content')
                .eq('session_id', this.currentSessionId)
                .order('created_at', { ascending: false })
                .limit(15);
            
            if (!error && data) {
                // Reverse to get chronological order
                const recentMessages = data.reverse();
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
            const messageElement = this.createMessageElement(message.role, message.content);
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
}

// Global functions for HTML onclick handlers
function showCharacterSelection() {
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