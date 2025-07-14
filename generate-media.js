// Generate Media Integration for Independent Page
console.log('🎨 Generate Media JS loaded for independent page');

class GenerateMediaIntegrated {
    constructor() {
        this.currentMediaType = 'image';
        this.selectedCharacter = null;
        this.characters = [];
        this.isGenerating = false;
    }

    init() {
        console.log('🎨 Initializing Generate Media for independent page...');
        this.setupEventListeners();
        this.loadCharacters();
        this.initializeAdvancedSettings();
    }

    setupEventListeners() {
        // Chat button - redirect to main page with chat intent
        const chatBtn = document.getElementById('sidebarChatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Store intent to show chat when returning to main page
                localStorage.setItem('showChatOnLoad', 'true');
                window.location.href = 'index.html';
            });
        }

        // Media type selector
        document.querySelectorAll('.media-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.media-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMediaType = e.target.dataset.type;
                console.log('📱 Media type changed to:', this.currentMediaType);
    });
});

        // Character selection
        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            characterSelect.addEventListener('change', (e) => {
                this.selectedCharacter = e.target.value;
                console.log('👤 Character selected:', this.selectedCharacter);
            });
        }

        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMedia();
            });
        }

        // Advanced settings toggle
        const advancedToggle = document.querySelector('.advanced-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                const settings = document.querySelector('.advanced-settings');
                const chevron = advancedToggle.querySelector('.fa-chevron-down');
                if (settings) {
                    settings.classList.toggle('active');
                    chevron.style.transform = settings.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }

        // Download button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('download-btn') || e.target.closest('.download-btn')) {
                this.downloadMedia();
            }
        });

        // Regenerate button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('regenerate-btn') || e.target.closest('.regenerate-btn')) {
                this.regenerateMedia();
            }
        });
    }

    async loadCharacters() {
        console.log('👥 Loading characters...');
        try {
            if (typeof window.supabase !== 'undefined' && window.supabase) {
                const { data: characters, error } = await window.supabase
                    .from('characters')
                    .select('id, name, description, image_url')
                    .order('name');

                if (error) {
                    console.error('❌ Error loading characters:', error);
                    this.loadFallbackCharacters();
                    return;
                }

                this.characters = characters || [];
                console.log('✅ Characters loaded:', this.characters.length);
        } else {
                console.warn('⚠️ Supabase not available, using fallback characters');
                this.loadFallbackCharacters();
            }
        } catch (error) {
            console.error('❌ Error in loadCharacters:', error);
            this.loadFallbackCharacters();
        }

        this.populateCharacterSelect();
    }

    loadFallbackCharacters() {
        this.characters = [
            { id: 'alex', name: 'Alex', description: 'Confident and charming', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/alex.png' },
            { id: 'ethan', name: 'Ethan', description: 'Athletic and adventurous', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/ethan.png' },
            { id: 'cruz', name: 'Cruz', description: 'Mysterious and alluring', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/cruz.png' }
        ];
    }

    populateCharacterSelect() {
        const characterSelect = document.getElementById('character-select');
        if (!characterSelect) return;

        // Clear existing options (keep the first placeholder option)
        characterSelect.innerHTML = '<option value="">Choose a character...</option>';

        this.characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.id;
            option.textContent = character.name;
            characterSelect.appendChild(option);
        });

        console.log('✅ Character select populated with', this.characters.length, 'characters');
    }

    initializeAdvancedSettings() {
        // Set default values for advanced settings
        const styleSelect = document.getElementById('style-select');
        const qualitySelect = document.getElementById('quality-select');
        const aspectRatio = document.getElementById('aspect-ratio');

        if (styleSelect) styleSelect.value = 'realistic';
        if (qualitySelect) qualitySelect.value = 'high';
        if (aspectRatio) aspectRatio.value = '16:9';
    }

    async generateMedia() {
        console.log('🎨 Starting media generation...');

        // Validation
        if (!this.selectedCharacter) {
            alert('Please select a character first!');
            return;
        }

        if (this.isGenerating) {
            console.log('⏳ Already generating, please wait...');
            return;
        }

        this.isGenerating = true;
        this.showLoadingOverlay();

        try {
            // Get form values
            const pose = document.getElementById('pose-input')?.value || '';
            const background = document.getElementById('background-input')?.value || '';
            const outfit = document.getElementById('outfit-input')?.value || '';
            const customPrompt = document.getElementById('custom-prompt')?.value || '';
            const negativePrompt = document.getElementById('negative-prompt')?.value || '';
            const style = document.getElementById('style-select')?.value || 'realistic';
            const quality = document.getElementById('quality-select')?.value || 'high';
            const imageCount = parseInt(document.getElementById('image-count')?.value || '1');

            // Build the prompt
            const prompt = this.buildPrompt({
                character: this.selectedCharacter,
                pose,
                background,
                outfit,
                customPrompt,
                negativePrompt,
                style,
                quality
            });

            console.log('📝 Generated prompt:', prompt);

            // Generate multiple images if requested
            for (let i = 0; i < imageCount; i++) {
                const result = await this.simulateGeneration(prompt);
                this.showGenerationResult(result);
            }
            
            this.hideLoadingOverlay();
            this.showSuccessMessage();

        } catch (error) {
            console.error('❌ Error generating media:', error);
            this.hideLoadingOverlay();
            alert('Failed to generate media. Please try again.');
        } finally {
            this.isGenerating = false;
        }
    }

    buildPrompt({ character, pose, background, outfit, customPrompt, negativePrompt, style, quality }) {
        const selectedChar = this.characters.find(c => c.id === character);
        let prompt = `${style} style, ${quality} quality`;
        
        if (selectedChar) {
            prompt += `, ${selectedChar.name} (${selectedChar.description})`;
        }
        
        if (pose) prompt += `, ${pose}`;
        if (background) prompt += `, background: ${background}`;
        if (outfit) prompt += `, wearing: ${outfit}`;
        if (customPrompt) prompt += `, ${customPrompt}`;
        if (negativePrompt) prompt += `, negative: ${negativePrompt}`;
        
        return prompt;
    }

    async simulateGeneration(prompt) {
        console.log('🎭 Simulating generation with prompt:', prompt);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Return mock result
        return {
            type: this.currentMediaType,
            url: this.currentMediaType === 'image' 
                ? 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/alex.png'
                : 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/banner3.mp4',
            prompt: prompt,
        timestamp: new Date().toISOString()
    };
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showGenerationResult(result) {
        console.log('🎨 Showing generation result:', result);
        this.addToGallery(result);
        this.showSuccessMessage();
    }

    addToGallery(result) {
        const galleryContent = document.getElementById('gallery-content');
        if (!galleryContent) return;

        // Remove "no images" message if it exists
        const noImagesMsg = galleryContent.querySelector('.no-images');
        if (noImagesMsg) {
            noImagesMsg.remove();
        }

        // Create gallery grid if it doesn't exist
        let galleryGrid = galleryContent.querySelector('.gallery-grid');
        if (!galleryGrid) {
            galleryGrid = document.createElement('div');
            galleryGrid.className = 'gallery-grid';
            galleryContent.appendChild(galleryGrid);
        }

        // Add new item to gallery
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const media = document.createElement(result.type === 'video' ? 'video' : 'img');
        media.src = result.url;
        media.alt = 'Generated Media';
        if (result.type === 'video') {
            media.controls = true;
        }
        
        const itemInfo = document.createElement('div');
        itemInfo.className = 'gallery-item-info';
        
        const title = document.createElement('h4');
        title.textContent = result.character || 'Generated Media';
        
        const timestamp = document.createElement('p');
        timestamp.textContent = new Date().toLocaleString();
        
        itemInfo.appendChild(title);
        itemInfo.appendChild(timestamp);
        
        galleryItem.appendChild(media);
        galleryItem.appendChild(itemInfo);
        
        // Add to beginning of gallery
        galleryGrid.insertBefore(galleryItem, galleryGrid.firstChild);
        
        // Scroll to gallery
        galleryContent.scrollIntoView({ behavior: 'smooth' });
    }

    showSuccessMessage() {
        console.log('✅ Media generated successfully!');
        // Could add toast notification here
    }

    downloadMedia() {
        console.log('📥 Downloading media...');
        // Implement download functionality
        alert('Download functionality will be implemented soon!');
    }

    regenerateMedia() {
        console.log('🔄 Regenerating media...');
        this.generateMedia();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 DOM loaded, initializing Generate Media...');
    
    // Initialize auth system first
    if (typeof enhancedInitialization === 'function') {
        enhancedInitialization();
    }
    
    // Wait for auth to be ready
    const initGenerateMedia = () => {
        if (typeof window.supabase !== 'undefined') {
            window.generateMediaApp = new GenerateMediaIntegrated();
            window.generateMediaApp.init();
        } else {
            console.log('⏳ Waiting for Supabase to load...');
            setTimeout(initGenerateMedia, 100);
        }
    };
    
    initGenerateMedia();
});

// Navigation functions for compatibility
function backToExplore() {
    console.log('🏠 Navigating back to explore...');
    window.location.href = 'index.html';
}

// Legacy function for any remaining references
function showGenerateMedia() {
    console.log('🎨 Generate Media is already shown - this is the dedicated page');
}

console.log('🎨 Generate Media JS setup complete for independent page'); 