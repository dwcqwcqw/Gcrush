// Generate Media Integration for Independent Page
console.log('🎨 Generate Media JS loaded for independent page');

class GenerateMediaIntegrated {
    constructor() {
        this.currentMediaType = 'image';
        // Separate states for image and video
        this.imageState = {
            selectedCharacter: null,
            selectedPose: null,
            selectedBackground: null,
            selectedOutfit: null,
            selectedImageCount: 2
        };
        this.videoState = {
            selectedCharacter: null,
            selectedPose: null,
            selectedBackground: null,
            selectedOutfit: null,
            selectedImageCount: 2
        };
        this.characters = [];
        this.poses = [];
        this.isGenerating = false;
    }

    init() {
        console.log('🎨 Initializing Generate Media for independent page...');
        this.setupEventListeners();
        this.loadCharacters();
        this.loadPoses();
        this.initializeAdvancedSettings();
    }

    // Get current state based on media type
    getCurrentState() {
        return this.currentMediaType === 'image' ? this.imageState : this.videoState;
    }

    // Set current state based on media type
    setCurrentState(key, value) {
        const state = this.getCurrentState();
        state[key] = value;
    }

    setupEventListeners() {
        // Show generate media section by default
        const generateMediaSection = document.getElementById('generateMediaSection');
        if (generateMediaSection) {
            generateMediaSection.style.display = 'block';
        }

        // Media type selector
        document.querySelectorAll('.media-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.media-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMediaType = e.target.dataset.type;
                console.log('📱 Media type changed to:', this.currentMediaType);
                
                // Update UI to reflect current state
                this.updateCharacterPreview();
                this.updatePosePreview();
                this.updateBackgroundSelection();
                this.updateOutfitSelection();
                this.updateImageCountSelection();
            });
        });

        // Character selection click
        const characterPreview = document.getElementById('character-preview-clickable');
        if (characterPreview) {
            characterPreview.addEventListener('click', () => {
                this.openCharacterModal();
            });
        }

        // Pose selection click
        const posePreview = document.getElementById('pose-preview-clickable');
        if (posePreview) {
            posePreview.addEventListener('click', () => {
                this.openPoseModal();
            });
        }

        // Tab switching functionality
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all tab buttons
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Hide all option buttons
                document.querySelectorAll('.option-buttons').forEach(options => options.classList.remove('active'));
                
                // Show selected option buttons
                const tabType = e.target.dataset.tab;
                const targetOptions = document.getElementById(`${tabType}-options`);
                if (targetOptions) {
                    targetOptions.classList.add('active');
                }
                
                console.log('🔄 Tab switched to:', tabType);
            });
        });

        // Background option buttons
        document.querySelectorAll('#background-options .option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all background buttons
                document.querySelectorAll('#background-options .option-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.setCurrentState('selectedBackground', e.target.dataset.value);
                console.log('🏔️ Background selected:', e.target.dataset.value);
            });
        });

        // Outfit option buttons
        document.querySelectorAll('#outfit-options .option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all outfit buttons
                document.querySelectorAll('#outfit-options .option-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.setCurrentState('selectedOutfit', e.target.dataset.value);
                console.log('👕 Outfit selected:', e.target.dataset.value);
            });
        });

        // Image count selector
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all count buttons
                document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.setCurrentState('selectedImageCount', parseInt(e.target.dataset.count));
                console.log('🖼️ Image count selected:', parseInt(e.target.dataset.count));
            });
        });

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
            { id: 'freeplay', name: 'Free Play', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Freeplay/Free_Play.jpeg' },
            { id: 'alex', name: 'Alex', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Alex/Alex1.png' },
            { id: 'bruno', name: 'Bruno', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Bruno/Bruno1.png' },
            { id: 'clayton', name: 'Clayton', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Clayton/Clayton1.png' },
            { id: 'cruz', name: 'Cruz', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Cruz/Cruz1.png' },
            { id: 'ethan', name: 'Ethan', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Ethan/Ethan1.png' },
            { id: 'gabriel', name: 'Gabriel', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Gabriel/Gabriel1.png' },
            { id: 'hunter', name: 'Hunter', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Hunter/Hunter1.png' },
            { id: 'james', name: 'James', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/James/James1.png' },
            { id: 'luca', name: 'Luca', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Luca/Luca1.png' },
            { id: 'mason', name: 'Mason', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Mason/Mason1.png' },
            { id: 'rohan', name: 'Rohan', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Rohan/Rohan1.png' },
            { id: 'terrell', name: 'Terrell', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Terrell/Terrell1.png' }
        ];
    }

    loadPoses() {
        this.poses = [
            { id: 'freeplay', name: 'Free Play', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/Free_Play.jpeg' },
            { id: 'standing', name: 'Standing', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/standing.png' },
            { id: 'sit', name: 'Sit', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/sit.png' },
            { id: 'kneel', name: 'Kneel', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/kneel.png' },
            { id: 'leash', name: 'Leash', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/leash.png' },
            { id: 'flaccid_penis', name: 'Flaccid Penis', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/flaccid%20penis.png' },
            { id: 'erect_penis', name: 'Erect Penis', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/erect%20penis.png' },
            { id: 'blowjob', name: 'Blowjob', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/blowjob.png' },
            { id: 'masturbation', name: 'Masturbation', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/masturbation.png' },
            { id: 'cum', name: 'Cum', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/cum.png' },
            { id: 'doggy_style', name: 'Doggy Style', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/doggy%20style.png' },
            { id: 'missionary', name: 'Missionary', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/generate_media/Missionary.png' }
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

    openCharacterModal() {
        const modal = document.getElementById('characterModal');
        const grid = document.getElementById('characterGrid');
        
        if (!modal || !grid) return;

        // Clear previous content
        grid.innerHTML = '';

        // Populate character grid
        this.characters.forEach(character => {
            const item = document.createElement('div');
            item.className = 'selection-item';
            item.dataset.characterId = character.id;
            
            if (this.getCurrentState().selectedCharacter === character.id) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <img src="${character.image_url}" alt="${character.name}">
                <div class="item-name">${character.name}</div>
                <div class="selected-indicator">
                    <i class="fas fa-check"></i>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectCharacter(character.id);
                this.closeCharacterModal();
            });

            grid.appendChild(item);
        });

        modal.style.display = 'flex';
    }

    closeCharacterModal() {
        const modal = document.getElementById('characterModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    selectCharacter(characterId) {
        this.setCurrentState('selectedCharacter', characterId);
        this.updateCharacterPreview();
        console.log('👤 Character selected:', characterId);
    }

    updateCharacterPreview() {
        const characterPreview = document.getElementById('character-preview-clickable');
        if (!characterPreview) return;

        const selectedCharacter = this.getCurrentState().selectedCharacter;
        if (selectedCharacter) {
            const character = this.characters.find(c => c.id === selectedCharacter);
            if (character && character.image_url) {
                characterPreview.innerHTML = `
                    <img src="${character.image_url}" alt="${character.name}">
                    <div class="character-name">${character.name}</div>
                `;
                characterPreview.classList.add('has-selection');
            } else {
                characterPreview.innerHTML = `
                    <div class="character-preview-content">
                        <i class="fas fa-user-plus"></i>
                        <span>Click to Select Character</span>
                    </div>
                `;
                characterPreview.classList.remove('has-selection');
            }
        } else {
            characterPreview.innerHTML = `
                <div class="character-preview-content">
                    <i class="fas fa-user-plus"></i>
                    <span>Click to Select Character</span>
                </div>
            `;
            characterPreview.classList.remove('has-selection');
        }
    }

    openPoseModal() {
        const modal = document.getElementById('poseModal');
        const grid = document.getElementById('poseGrid');
        
        if (!modal || !grid) return;

        // Clear previous content
        grid.innerHTML = '';

        // Populate pose grid
        this.poses.forEach(pose => {
            const item = document.createElement('div');
            item.className = 'selection-item';
            item.dataset.poseId = pose.id;
            
            if (this.getCurrentState().selectedPose === pose.id) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <img src="${pose.image_url}" alt="${pose.name}">
                <div class="item-name">${pose.name}</div>
                <div class="selected-indicator">
                    <i class="fas fa-check"></i>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectPose(pose.id);
                this.closePoseModal();
            });

            grid.appendChild(item);
        });

        modal.style.display = 'flex';
    }

    closePoseModal() {
        const modal = document.getElementById('poseModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    selectPose(poseId) {
        this.setCurrentState('selectedPose', poseId);
        this.updatePosePreview();
        console.log('📸 Pose selected:', poseId);
    }

    updatePosePreview() {
        const posePreview = document.getElementById('pose-preview-clickable');
        if (!posePreview) return;

        const selectedPose = this.getCurrentState().selectedPose;
        if (selectedPose) {
            const pose = this.poses.find(p => p.id === selectedPose);
            if (pose && pose.image_url) {
                posePreview.innerHTML = `
                    <img src="${pose.image_url}" alt="${pose.name}">
                    <div class="pose-name">${pose.name}</div>
                `;
                posePreview.classList.add('has-selection');
            } else {
                posePreview.innerHTML = `
                    <div class="pose-preview-content">
                        <i class="fas fa-camera"></i>
                        <span>Click to Select Pose</span>
                    </div>
                `;
                posePreview.classList.remove('has-selection');
            }
        } else {
            posePreview.innerHTML = `
                <div class="pose-preview-content">
                    <i class="fas fa-camera"></i>
                    <span>Click to Select Pose</span>
                </div>
            `;
            posePreview.classList.remove('has-selection');
        }
    }

    updateBackgroundSelection() {
        const currentState = this.getCurrentState();
        document.querySelectorAll('#background-options .option-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === currentState.selectedBackground) {
                btn.classList.add('active');
            }
        });
    }

    updateOutfitSelection() {
        const currentState = this.getCurrentState();
        document.querySelectorAll('#outfit-options .option-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === currentState.selectedOutfit) {
                btn.classList.add('active');
            }
        });
    }

    updateImageCountSelection() {
        const currentState = this.getCurrentState();
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.count) === currentState.selectedImageCount) {
                btn.classList.add('active');
            }
        });
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
        const currentState = this.getCurrentState();
        if (!currentState.selectedCharacter) {
            alert('Please select a character first!');
            return;
        }

        if (!currentState.selectedPose) {
            alert('Please select a pose!');
            return;
        }

        const customPrompt = document.getElementById('custom-prompt')?.value.trim();
        if (!customPrompt) {
            alert('Please enter a custom prompt!');
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
            const negativePrompt = document.getElementById('negative-prompt')?.value || '';

            // Build the prompt
            const prompt = this.buildPrompt({
                character: currentState.selectedCharacter,
                pose: currentState.selectedPose,
                background: currentState.selectedBackground,
                outfit: currentState.selectedOutfit,
                customPrompt,
                negativePrompt
            });

            console.log('📝 Generated prompt:', prompt);

            // Generate multiple images if requested
            for (let i = 0; i < currentState.selectedImageCount; i++) {
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

    buildPrompt({ character, pose, background, outfit, customPrompt, negativePrompt }) {
        const selectedChar = this.characters.find(c => c.id === character);
        const selectedPose = this.poses.find(p => p.id === pose);
        let prompt = '';
        
        if (selectedChar) {
            prompt += `${selectedChar.name}`;
        }
        
        if (selectedPose) {
            prompt += `, ${selectedPose.name}`;
        }
        
        if (background) prompt += `, in ${background} setting`;
        if (outfit) prompt += `, wearing ${outfit}`;
        if (customPrompt) prompt += `, ${customPrompt}`;
        
        return {
            prompt: prompt,
            negativePrompt: negativePrompt
        };
    }

    async simulateGeneration(promptData) {
        console.log('🎭 Simulating generation with prompt:', promptData.prompt);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Return mock result
        return {
            type: this.currentMediaType,
            url: this.currentMediaType === 'image' 
                ? 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/alex.png'
                : 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Asset/banner3.mp4',
            prompt: promptData.prompt,
            negativePrompt: promptData.negativePrompt,
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

// Initialize when main scripts are ready
function initGenerateMediaPage() {
    console.log('🎨 Initializing Generate Media page...');
    
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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for main scripts to load
    setTimeout(initGenerateMediaPage, 500);
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

// Global modal control functions
function closeCharacterModal() {
    if (window.generateMediaApp) {
        window.generateMediaApp.closeCharacterModal();
    }
}

function closePoseModal() {
    if (window.generateMediaApp) {
        window.generateMediaApp.closePoseModal();
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'characterModal') {
            closeCharacterModal();
        } else if (e.target.id === 'poseModal') {
            closePoseModal();
        }
    }
});

console.log('🎨 Generate Media JS setup complete for independent page'); 