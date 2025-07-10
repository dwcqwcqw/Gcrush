// =====================================================
// Gcrush 角色数据加载器
// Character Data Loader for Dynamic Character Cards
// =====================================================

// Supabase client configuration - use existing global variables if available
const CHARACTER_LOADER_SUPABASE_URL = window.SUPABASE_URL || 'https://kuflobojizyttadwcbhe.supabase.co';
const CHARACTER_LOADER_SUPABASE_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODkyMTgsImV4cCI6MjA2NzU2NTIxOH0._Y2UVfmu87WCKozIEgsvCoCRqB90aywNNYGjHl2aDDw';

// Initialize Supabase client - use existing global client if available
const characterLoaderSupabase = window.supabase ? window.supabase.createClient(CHARACTER_LOADER_SUPABASE_URL, CHARACTER_LOADER_SUPABASE_KEY) : null;

// Character data management class
class CharacterDataLoader {
    constructor() {
        this.characters = [];
        this.isLoading = false;
        this.hasError = false;
        this.errorMessage = '';
    }

    // Load character data from database
    async loadCharacters() {
        this.isLoading = true;
        this.hasError = false;
        
        try {
            console.log('Loading character data from database...');
            
            if (!characterLoaderSupabase) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await characterLoaderSupabase
                .from('characters')
                .select('*')
                .eq('is_active', true)
                .order('number', { ascending: true });

            if (error) {
                throw new Error(`Database query error: ${error.message}`);
            }

            if (!data || data.length === 0) {
                console.warn('No character data found in database, using default data');
                this.characters = this.getDefaultCharacters();
            } else {
                console.log(`Successfully loaded ${data.length} characters`);
                this.characters = data;
            }

            this.isLoading = false;
            return this.characters;
            
        } catch (error) {
            console.error('Failed to load character data:', error);
            this.hasError = true;
            this.errorMessage = error.message;
            this.isLoading = false;
            
            // Use default data when error occurs
            console.log('Using default character data as fallback');
            this.characters = this.getDefaultCharacters();
            return this.characters;
        }
    }

    // Get default character data (based on existing HTML information)
    getDefaultCharacters() {
        return [
            {
                number: 1,
                name: 'Alex',
                age: 25,
                description: 'College student exploring his identity, athletic swimmer with a curious mind and open heart. Alex is the perfect companion for deep conversations and shared adventures.',
                tag1: 'Athletic',
                tag2: 'Student',
                tag3: 'Curious',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Alex/Alex1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Alex/Alex1.mov']
            },
            {
                number: 2,
                name: 'Bruno',
                age: 19,
                description: 'Mature Latin bear, protective daddy with a commanding presence and warm heart. Bruno brings wisdom, passion, and unconditional support to every relationship.',
                tag1: 'Mature',
                tag2: 'Protective',
                tag3: 'Daddy',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Bruno/Bruno1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Bruno/Bruno1.mov']
            },
            {
                number: 3,
                name: 'Clayton',
                age: 38,
                description: 'Rugged construction worker with a heart of gold, strong and reliable...',
                tag1: 'Rugged',
                tag2: 'Strong',
                tag3: 'Reliable',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Clayton/Clayton1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Clayton/Clayton1.mov']
            },
            {
                number: 4,
                name: 'Cruz',
                age: 26,
                description: 'Passionate Latino artist with fiery personality and creative soul...',
                tag1: 'Passionate',
                tag2: 'Artist',
                tag3: 'Creative',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Cruz/Cruz1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Cruz/Cruz1.mov']
            },
            {
                number: 5,
                name: 'Ethan',
                age: 20,
                description: 'Tech geek with a submissive side, loves gaming and coding. Ethan is the perfect companion for anyone who appreciates intelligence, loyalty, and gentle devotion.',
                tag1: 'Tech',
                tag2: 'Gamer',
                tag3: 'Submissive',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Ethan/Ethan1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Ethan/Ethan1.mp4']
            },
            {
                number: 6,
                name: 'Gabriel',
                age: 29,
                description: 'Charming therapist with healing touch, empathetic and understanding...',
                tag1: 'Charming',
                tag2: 'Therapist',
                tag3: 'Empathetic',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Gabriel/Gabriel1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Gabriel/Gabriel1.mov']
            },
            {
                number: 7,
                name: 'Hunter',
                age: 35,
                description: 'Dominant military veteran, protective and commanding presence...',
                tag1: 'Dominant',
                tag2: 'Military',
                tag3: 'Commanding',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Hunter/Hunter1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Hunter/Hunter1.mov']
            },
            {
                number: 8,
                name: 'James',
                age: 40,
                description: 'Successful businessman, sophisticated daddy with refined tastes...',
                tag1: 'Successful',
                tag2: 'Sophisticated',
                tag3: 'Refined',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/James/James1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/James/James1.mov']
            },
            {
                number: 9,
                name: 'Luca',
                age: 19,
                description: 'Asian college basketball player, athletic and competitive spirit...',
                tag1: 'Athletic',
                tag2: 'Basketball',
                tag3: 'Competitive',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Luca/Luca1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Luca/Luca1.mov']
            },
            {
                number: 10,
                name: 'Mason',
                age: 28,
                description: 'Fitness influencer with perfect physique, motivational and energetic. Mason inspires others to reach their potential through dedication and positive energy.',
                tag1: 'Fitness',
                tag2: 'Motivational',
                tag3: 'Energetic',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Mason/Mason1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Mason/Mason1.mov']
            },
            {
                number: 11,
                name: 'Rohan',
                age: 24,
                description: 'Indian tech professional, spiritual and thoughtful with cultural depth. Rohan combines ancient wisdom with modern innovation, creating meaningful connections.',
                tag1: 'Spiritual',
                tag2: 'Thoughtful',
                tag3: 'Cultural',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Rohan/Rohan1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Rohan/Rohan1.mov']
            },
            {
                number: 12,
                name: 'Terrell',
                age: 30,
                description: 'Powerful black alpha, confident leader with magnetic personality. Terrell commands respect through strength, wisdom, and unwavering determination.',
                tag1: 'Powerful',
                tag2: 'Alpha',
                tag3: 'Leader',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Terrell/Terrell1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Terrell/Terrell1.mov']
            }
        ];
    }

    // Generate character card HTML
    generateCharacterCard(character) {
        // Handle different data structures - database vs default
        const imageUrl = this.getImageUrl(character);
        const videoUrl = this.getVideoUrl(character);
        
        // Truncate description text to max two lines
        const description = character.description || character.system_prompt || '';
        const truncatedDescription = this.truncateDescription(description, 100);
        
        // Generate tags HTML - handle different tag formats
        const tagsHtml = this.generateTagsHtml(character.tag1, character.tag2, character.tag3);
        
        return `
            <div class="character-card glass-card" data-character="${character.name}">
                <div class="character-image">
                    <img src="${imageUrl}" alt="${character.name}">
                    ${videoUrl ? `
                        <video class="character-video" loop muted>
                            <source src="${videoUrl}" type="video/mp4">
                        </video>
                    ` : ''}
                </div>
                <div class="character-info">
                    <h3 class="character-name">${character.name} <span class="character-age">${character.age}</span></h3>
                    ${tagsHtml}
                    <p class="character-bio">${truncatedDescription}</p>
                </div>
            </div>
        `;
    }

    // Get image URL from character data
    getImageUrl(character) {
        // Handle array format
        if (character.images && Array.isArray(character.images) && character.images.length > 0) {
            return character.images[0];
        }
        // Handle single string format
        if (character.image) {
            return character.image;
        }
        // Default fallback based on character name
        return `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${character.name}/${character.name}1.png`;
    }

    // Get video URL from character data
    getVideoUrl(character) {
        // Handle array format
        if (character.videos && Array.isArray(character.videos) && character.videos.length > 0) {
            return character.videos[0];
        }
        // Handle single string format
        if (character.video) {
            return character.video;
        }
        // Default fallback based on character name
        const videoExt = character.name === 'Ethan' ? 'mp4' : 'mov';
        return `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/${character.name}/${character.name}1.${videoExt}`;
    }

    // Generate tags HTML
    generateTagsHtml(tag1, tag2, tag3) {
        const tags = [tag1, tag2, tag3].filter(tag => tag && tag.trim() !== '');
        
        if (tags.length === 0) return '';
        
        return `
            <div class="character-tags">
                ${tags.map(tag => `<span class="character-tag">${tag}</span>`).join('')}
            </div>
        `;
    }

    // Truncate description text
    truncateDescription(description, maxLength) {
        if (!description || description.length <= maxLength) {
            return description || '';
        }
        
        const truncated = description.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        
        if (lastSpaceIndex > 0) {
            return truncated.substring(0, lastSpaceIndex) + '...';
        }
        
        return truncated + '...';
    }

    // Render all character cards
    async renderCharacterCards() {
        const characterGrid = document.querySelector('.character-grid');
        
        if (!characterGrid) {
            console.error('Character grid container (.character-grid) not found');
            return;
        }

        // Show loading state
        characterGrid.innerHTML = '<div class="loading-message">Loading character data...</div>';

        try {
            // Load character data
            await this.loadCharacters();

            // Generate character cards HTML
            const characterCardsHtml = this.characters.map(character => 
                this.generateCharacterCard(character)
            ).join('');

            // Insert into page
            characterGrid.innerHTML = characterCardsHtml;

            // Re-initialize video hover effects
            if (typeof initCharacterVideoHover === 'function') {
                initCharacterVideoHover();
            }

            console.log('Character cards rendered successfully');
            
        } catch (error) {
            console.error('Failed to render character cards:', error);
            characterGrid.innerHTML = `
                <div class="error-message">
                    <p>Failed to load character data</p>
                    <p>${this.errorMessage}</p>
                    <button onclick="characterLoader.renderCharacterCards()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }

    // Find character by name
    findCharacterByName(name) {
        return this.characters.find(character => 
            character.name.toLowerCase() === name.toLowerCase()
        );
    }

    // Get all characters
    getAllCharacters() {
        return this.characters;
    }
}

// Create global instance
const characterLoader = new CharacterDataLoader();

// Auto-render character cards after page load
document.addEventListener('DOMContentLoaded', () => {
    characterLoader.renderCharacterCards();
});

// Export for other modules
window.CharacterDataLoader = CharacterDataLoader;
window.characterLoader = characterLoader; 