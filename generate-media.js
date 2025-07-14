// Generate Media JavaScript - Integrated with Main Page
class GenerateMediaIntegrated {
    constructor() {
        this.selectedOptions = {
            mediaType: 'image',
            character: '',
            pose: '',
            background: '',
            outfit: '',
            customPrompt: '',
            style: 'realistic',
            quality: 'standard',
            numberOfImages: 1
        };
    }

    init() {
        console.log('🎨 Initializing Generate Media Integration...');
        this.setupEventListeners();
        console.log('✅ Generate Media Integration initialized');
    }

    setupEventListeners() {
        // Media type selector
        document.querySelectorAll('.media-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.media-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedOptions.mediaType = e.target.dataset.type;
                console.log('📱 Media type selected:', this.selectedOptions.mediaType);
            });
        });

        // Character selection
        const characterSelect = document.getElementById('character-select');
        if (characterSelect) {
            characterSelect.addEventListener('change', (e) => {
                this.selectedOptions.character = e.target.value;
                console.log('👤 Character selected:', this.selectedOptions.character);
            });
        }

        // Option cards
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const option = e.currentTarget.dataset.option;
                card.classList.toggle('selected');
                
                if (card.classList.contains('selected')) {
                    this.selectedOptions[option] = option;
                } else {
                    this.selectedOptions[option] = '';
                }
                
                console.log(`🎯 ${option} option:`, this.selectedOptions[option]);
            });
        });

        // Custom prompt
        const customPrompt = document.getElementById('custom-prompt');
        if (customPrompt) {
            customPrompt.addEventListener('input', (e) => {
                this.selectedOptions.customPrompt = e.target.value;
            });
        }

        // Advanced settings toggle
        const advancedToggle = document.getElementById('advanced-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                const content = document.getElementById('advanced-content');
                const icon = document.querySelector('#advanced-toggle i');
                
                if (content && icon) {
                    content.classList.toggle('open');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        }

        // Style and quality selectors
        const styleSelect = document.getElementById('style-select');
        const qualitySelect = document.getElementById('quality-select');
        
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                this.selectedOptions.style = e.target.value;
            });
        }
        
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                this.selectedOptions.quality = e.target.value;
            });
        }

        // Number of images
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedOptions.numberOfImages = parseInt(e.target.dataset.number);
                console.log('🔢 Number of images:', this.selectedOptions.numberOfImages);
            });
        });

        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMedia();
            });
        }
    }

    async generateMedia() {
        console.log('🎨 Starting media generation...');
        
        // Check if user is logged in using main page auth
        if (!window.supabase) {
            alert('Please wait for the page to load completely!');
            return;
        }

        try {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error || !session || !session.user) {
                alert('Please log in first to use Generate Media feature!');
                // Close generate media and show login
                this.hideGenerateMedia();
                document.querySelector('.login-btn')?.click();
                return;
            }

            console.log('✅ User authenticated:', session.user.email);
        } catch (error) {
            console.error('❌ Auth check failed:', error);
            alert('Please log in first to use Generate Media feature!');
            return;
        }
        
        // Validate required fields
        if (!this.selectedOptions.character) {
            alert('Please select a character first!');
            return;
        }

        // Disable generate button and show loading
        const generateBtn = document.getElementById('generate-btn');
        const originalContent = generateBtn.innerHTML;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<div class="loading-spinner"></div> Generating...';

        try {
            // Build prompt
            const prompt = this.buildPrompt();
            console.log('📝 Generated prompt:', prompt);

            // Simulate generation
            await this.simulateGeneration(prompt);
            
            // Show success message
            this.showSuccessMessage();
            
        } catch (error) {
            console.error('❌ Generation failed:', error);
            alert('Failed to generate media. Please try again.');
        } finally {
            // Re-enable generate button
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalContent;
        }
    }

    buildPrompt() {
        let prompt = `${this.selectedOptions.character}`;
        
        if (this.selectedOptions.pose) {
            prompt += `, ${this.selectedOptions.pose} pose`;
        }
        
        if (this.selectedOptions.background) {
            prompt += `, ${this.selectedOptions.background} background`;
        }
        
        if (this.selectedOptions.outfit) {
            prompt += `, wearing ${this.selectedOptions.outfit}`;
        }
        
        if (this.selectedOptions.customPrompt) {
            prompt += `, ${this.selectedOptions.customPrompt}`;
        }
        
        prompt += `, ${this.selectedOptions.style} style, ${this.selectedOptions.quality} quality`;
        
        return prompt;
    }

    async simulateGeneration(prompt) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create mock generated images
        const galleryGrid = document.getElementById('gallery-grid');
        
        if (!galleryGrid) return;
        
        // Clear "no images" message
        if (galleryGrid.children[0]?.textContent === 'No images generated yet') {
            galleryGrid.innerHTML = '';
        }
        
        // Add mock generated images
        for (let i = 0; i < this.selectedOptions.numberOfImages; i++) {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(45deg, #a855f7, #ec4899, #f59e0b);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    border-radius: 10px;
                ">
                    Generated Image ${Date.now() + i}
                </div>
            `;
            galleryGrid.appendChild(galleryItem);
        }
        
        console.log('💾 Mock generation completed');
    }

    showSuccessMessage() {
        // Create temporary success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        `;
        successMsg.innerHTML = '✅ Media generated successfully!';
        document.body.appendChild(successMsg);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }

    hideGenerateMedia() {
        const generateSection = document.getElementById('generateMediaSection');
        const heroSection = document.getElementById('heroSection');
        const titleSection = document.getElementById('titleSection');
        const characterLobby = document.getElementById('characterLobby');
        
        if (generateSection) generateSection.style.display = 'none';
        if (heroSection) heroSection.style.display = 'block';
        if (titleSection) titleSection.style.display = 'block';
        if (characterLobby) characterLobby.style.display = 'block';
    }
}

// Global functions for navigation
function showGenerateMedia() {
    console.log('🎨 Showing Generate Media section...');
    
    // Hide other sections
    const heroSection = document.getElementById('heroSection');
    const titleSection = document.getElementById('titleSection');
    const characterLobby = document.getElementById('characterLobby');
    const chatInterface = document.getElementById('chatInterface');
    
    if (heroSection) heroSection.style.display = 'none';
    if (titleSection) titleSection.style.display = 'none';
    if (characterLobby) characterLobby.style.display = 'none';
    if (chatInterface) chatInterface.style.display = 'none';
    
    // Show generate media section
    const generateSection = document.getElementById('generateMediaSection');
    if (generateSection) {
        generateSection.style.display = 'block';
        
        // Initialize generate media if not already done
        if (!window.generateMediaApp) {
            window.generateMediaApp = new GenerateMediaIntegrated();
            window.generateMediaApp.init();
        }
    }
}

function backToExplore() {
    console.log('🏠 Returning to main page...');
    
    // Hide generate media section
    const generateSection = document.getElementById('generateMediaSection');
    const chatInterface = document.getElementById('chatInterface');
    
    if (generateSection) generateSection.style.display = 'none';
    if (chatInterface) chatInterface.style.display = 'none';
    
    // Show main sections
    const heroSection = document.getElementById('heroSection');
    const titleSection = document.getElementById('titleSection');
    const characterLobby = document.getElementById('characterLobby');
    
    if (heroSection) heroSection.style.display = 'block';
    if (titleSection) titleSection.style.display = 'block';
    if (characterLobby) characterLobby.style.display = 'block';
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Generate media will be initialized when first accessed
    console.log('📱 Generate Media integration ready');
}); 