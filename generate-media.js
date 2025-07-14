// Generate Media JavaScript
class GenerateMediaApp {
    constructor() {
        this.currentUser = null;
        this.supabase = null;
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
        
        this.init();
    }

    async init() {
        console.log('🎨 Initializing Generate Media App...');
        
        // Initialize Supabase
        await this.initializeSupabase();
        
        // Check authentication
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Generate Media App initialized');
    }

    async initializeSupabase() {
        try {
            // Load environment configuration
            await this.loadEnvConfig();
            
            // Initialize Supabase client
            this.supabase = window.supabase.createClient(
                window.SUPABASE_URL,
                window.SUPABASE_ANON_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false // Don't interfere with main page auth
                    }
                }
            );
            
            console.log('✅ Supabase initialized for Generate Media');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
        }
    }

    async loadEnvConfig() {
        try {
            // Try to load from existing global config first
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                console.log('📋 Using existing environment config');
                return;
            }
            
            // Load from env-config.js
            const response = await fetch('/api/env-config');
            if (response.ok) {
                const config = await response.json();
                window.SUPABASE_URL = config.SUPABASE_URL;
                window.SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
                window.RUNPOD_TEXT_ENDPOINT_ID = config.RUNPOD_TEXT_ENDPOINT_ID;
                window.RUNPOD_IMAGE_ENDPOINT_ID = config.RUNPOD_IMAGE_ENDPOINT_ID;
                console.log('📋 Environment config loaded from API');
            } else {
                throw new Error('Failed to load environment config');
            }
        } catch (error) {
            console.error('❌ Failed to load environment config:', error);
            // Fallback to default values
            window.SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
            window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDI4NjQsImV4cCI6MjA1MDExODg2NH0.Gk8KHHl3-f7k-QBBmYGlBOXZyUBjBGMhGEGfYGOhxGM';
        }
    }

    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Auth check error:', error);
                this.redirectToLogin();
                return;
            }

            if (!session || !session.user) {
                console.log('❌ No active session, redirecting to login');
                this.redirectToLogin();
                return;
            }

            this.currentUser = session.user;
            console.log('✅ User authenticated:', this.currentUser.email);
            
            // Load user's gallery
            this.loadUserGallery();
            
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        alert('Please log in first to use Generate Media feature.');
        window.location.href = '/index.html#login';
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
        document.getElementById('character-select').addEventListener('change', (e) => {
            this.selectedOptions.character = e.target.value;
            console.log('👤 Character selected:', this.selectedOptions.character);
        });

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
        document.getElementById('custom-prompt').addEventListener('input', (e) => {
            this.selectedOptions.customPrompt = e.target.value;
        });

        // Advanced settings toggle
        document.getElementById('advanced-toggle').addEventListener('click', () => {
            const content = document.getElementById('advanced-content');
            const icon = document.querySelector('#advanced-toggle i');
            
            content.classList.toggle('open');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });

        // Style and quality selectors
        document.getElementById('style-select').addEventListener('change', (e) => {
            this.selectedOptions.style = e.target.value;
        });

        document.getElementById('quality-select').addEventListener('change', (e) => {
            this.selectedOptions.quality = e.target.value;
        });

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
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateMedia();
        });
    }

    async generateMedia() {
        console.log('🎨 Starting media generation...');
        
        // Validate required fields
        if (!this.selectedOptions.character) {
            alert('Please select a character first!');
            return;
        }

        if (!this.currentUser) {
            alert('Please log in to generate media!');
            this.redirectToLogin();
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

            // For now, simulate generation (replace with actual API call)
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
        
        // Save to user's gallery in database (mock)
        console.log('💾 Saving to user gallery...');
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

    async loadUserGallery() {
        console.log('🖼️ Loading user gallery...');
        
        // For now, show placeholder
        // In the future, load actual user-generated media from database
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = '<div class="gallery-item">No images generated yet</div>';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GenerateMediaApp();
});

// Add some utility functions
window.generateMediaApp = {
    goBack: () => {
        window.location.href = '/index.html';
    }
}; 