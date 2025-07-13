// Voice Features - Speech to Text and Text to Speech
class VoiceFeatures {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentUser = null;
        this.currentCharacter = null;
        
        console.log('🎤 Voice Features initialized');
    }

    // Initialize voice features
    init(user, character) {
        this.currentUser = user;
        this.currentCharacter = character;
        this.setupVoiceButtons();
    }

    // Setup voice input button in chat input area
    setupVoiceButtons() {
        const chatInputArea = document.querySelector('.chat-input-area');
        if (!chatInputArea) {
            console.warn('Chat input area not found');
            return;
        }

        // Check if voice button already exists
        let voiceButton = document.getElementById('voiceInputButton');
        if (!voiceButton) {
            // Create voice input button
            voiceButton = document.createElement('button');
            voiceButton.id = 'voiceInputButton';
            voiceButton.className = 'voice-input-btn';
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceButton.title = 'Voice input';
            
            // Insert before send button
            const sendButton = chatInputArea.querySelector('button');
            chatInputArea.insertBefore(voiceButton, sendButton);
        }

        // Add event listener
        voiceButton.addEventListener('click', () => this.handleVoiceInput());

        console.log('✅ Voice input button setup complete');
    }

    // Add play button to AI messages
    addPlayButtonToMessage(messageElement, text) {
        // Always add play button, check login on click
        // Check if play button already exists
        if (messageElement.querySelector('.play-voice-btn')) return;

        const playButton = document.createElement('button');
        playButton.className = 'play-voice-btn';
        playButton.innerHTML = '<i class="fas fa-play"></i>';
        playButton.title = 'Play voice';
        
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleTextToSpeech(text, playButton);
        });

        // Add to message content
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
            messageContent.appendChild(playButton);
        }
    }

    // Handle voice input (speech to text)
    async handleVoiceInput() {
        // Check if user is logged in
        if (!this.currentUser) {
            console.log('User not logged in, showing login modal');
            this.showLoginModal();
            return;
        }

        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    // Start recording
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateVoiceButton(true);
            console.log('🎤 Recording started');

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Unable to access microphone. Please check permissions.');
        }
    }

    // Stop recording
    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateVoiceButton(false);
            
            // Stop all tracks
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            console.log('🛑 Recording stopped');
        }
    }

    // Process recorded audio
    async processRecording() {
        if (this.audioChunks.length === 0) return;

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('📝 Processing audio, size:', audioBlob.size);

        // Show loading state
        this.showVoiceProcessing(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('userId', this.currentUser.id);

            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success && result.text) {
                // Insert transcribed text into input
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.value = result.text;
                    messageInput.focus();
                }
                console.log('✅ Speech-to-text successful:', result.text);
            } else {
                console.error('Speech-to-text failed:', result.error);
                alert('Speech recognition failed. Please try again.');
            }

        } catch (error) {
            console.error('Error processing speech:', error);
            alert('Error processing speech. Please try again.');
        } finally {
            this.showVoiceProcessing(false);
        }
    }

    // Handle text to speech
    async handleTextToSpeech(text, button) {
        // Check if user is logged in
        if (!this.currentUser) {
            console.log('User not logged in, showing login modal');
            this.showLoginModal();
            return;
        }

        if (!this.currentCharacter || !this.currentCharacter.id) {
            console.error('No current character for TTS');
            alert('Character information not available for voice generation.');
            return;
        }

        // Show loading state
        this.updatePlayButton(button, 'loading');

        try {
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    characterId: this.currentCharacter.id,
                    userId: this.currentUser.id
                })
            });

            const result = await response.json();

            if (result.success) {
                let audioUrl = result.audioUrl;
                
                // If hex audio data is provided, create blob URL
                if (result.hexAudio) {
                    console.log('Creating blob URL from hex audio data...');
                    
                    // Convert hex string to bytes
                    function hexToBytes(hexString) {
                        const bytes = new Uint8Array(hexString.length / 2);
                        for (let i = 0; i < hexString.length; i += 2) {
                            bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
                        }
                        return bytes;
                    }
                    
                    const audioBytes = hexToBytes(result.hexAudio);
                    const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
                    audioUrl = URL.createObjectURL(audioBlob);
                    
                    console.log('Created blob URL:', audioUrl);
                }
                
                // Play the audio
                await this.playAudio(audioUrl, button);
                console.log('✅ Text-to-speech successful');
            } else {
                console.error('Text-to-speech failed:', result.error);
                alert('Voice generation failed. Please try again.');
                this.updatePlayButton(button, 'error');
            }

        } catch (error) {
            console.error('Error generating speech:', error);
            alert('Error generating voice. Please try again.');
            this.updatePlayButton(button, 'error');
        }
    }

    // Play audio
    async playAudio(audioUrl, button) {
        try {
            const audio = new Audio(audioUrl);
            
            audio.onloadstart = () => {
                this.updatePlayButton(button, 'loading');
            };
            
            audio.oncanplay = () => {
                this.updatePlayButton(button, 'playing');
            };
            
            audio.onplay = () => {
                this.updatePlayButton(button, 'playing');
            };
            
            audio.onended = () => {
                this.updatePlayButton(button, 'ready');
            };
            
            audio.onerror = () => {
                console.error('Audio playback error');
                this.updatePlayButton(button, 'error');
            };

            await audio.play();

        } catch (error) {
            console.error('Error playing audio:', error);
            this.updatePlayButton(button, 'error');
        }
    }

    // Update voice input button state
    updateVoiceButton(isRecording) {
        const button = document.getElementById('voiceInputButton');
        if (button) {
            if (isRecording) {
                button.innerHTML = '<i class="fas fa-stop"></i>';
                button.classList.add('recording');
                button.title = 'Stop recording';
            } else {
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.classList.remove('recording');
                button.title = 'Voice input';
            }
        }
    }

    // Update play button state
    updatePlayButton(button, state) {
        if (!button) return;

        button.classList.remove('loading', 'playing', 'error');
        
        switch (state) {
            case 'loading':
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.classList.add('loading');
                button.disabled = true;
                break;
            case 'playing':
                button.innerHTML = '<i class="fas fa-pause"></i>';
                button.classList.add('playing');
                button.disabled = false;
                break;
            case 'error':
                button.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                button.classList.add('error');
                button.disabled = false;
                setTimeout(() => {
                    this.updatePlayButton(button, 'ready');
                }, 2000);
                break;
            case 'ready':
            default:
                button.innerHTML = '<i class="fas fa-play"></i>';
                button.disabled = false;
                break;
        }
    }

    // Show voice processing state
    showVoiceProcessing(show) {
        const button = document.getElementById('voiceInputButton');
        if (button) {
            if (show) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
            } else {
                button.innerHTML = '<i class="fas fa-microphone"></i>';
                button.disabled = false;
            }
        }
    }

    // Show login modal
    showLoginModal() {
        // Use existing login modal functionality
        if (window.mainChatSystem && typeof window.mainChatSystem.showLoginModal === 'function') {
            window.mainChatSystem.showLoginModal();
        } else {
            // Fallback to direct modal show
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        }
    }

    // Update user and character context
    updateContext(user, character) {
        this.currentUser = user;
        this.currentCharacter = character;
    }
}

// Create global instance
window.voiceFeatures = new VoiceFeatures();

console.log('🎤 Voice Features module loaded');