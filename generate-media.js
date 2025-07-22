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
            selectedImageCount: 1
        };
        this.videoState = {
            selectedCharacter: null,
            selectedPose: null,
            selectedBackground: null,
            selectedOutfit: null,
            selectedImageCount: 1
        };
        this.characters = [];
        this.poses = [];
        this.isGenerating = false;
        this.supabase = null;
        this.userGallery = [];
        // Don't call initSupabase here, it will be called in init()
    }

    // Initialize Supabase client
    async initSupabase() {
        try {
            console.log('🔍 Initializing Supabase for Gallery...');
            
            // Wait for Supabase to be available
            let attempts = 0;
            while (!window.supabase && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            console.log('🔍 Supabase availability check:');
            console.log('• window.supabase:', !!window.supabase);
            console.log('• window.supabase.from:', !!(window.supabase && window.supabase.from));
            console.log('• window.supabase.auth:', !!(window.supabase && window.supabase.auth));
            
            // Use the Supabase client from supabase-manager.js
            if (window.supabase && window.supabase.from) {
                console.log('✅ Using existing Supabase client from supabase-manager');
                this.supabase = window.supabase;
            } else {
                console.warn('⚠️ Supabase client not available or incomplete, Gallery features disabled');
                return;
            }
            
            console.log('✅ Supabase client initialized for Gallery');
            
        } catch (error) {
            console.error('❌ Supabase client creation failed:', error);
        }
    }

    async init() {
        console.log('🎨 Initializing Generate Media for independent page...');
        console.log('🔍 Checking DOM elements...');
        console.log('- Generate button exists:', !!document.getElementById('generate-btn'));
        console.log('- Custom prompt exists:', !!document.getElementById('custom-prompt'));
        console.log('- Negative prompt exists:', !!document.getElementById('negative-prompt'));
        
        this.setupEventListeners();
        this.loadCharacters();
        this.loadPoses();
        this.initializeAdvancedSettings();
        
        // Initialize Supabase and load gallery
        await this.initSupabase();
        console.log('🔍 After initSupabase, this.supabase:', !!this.supabase);
        if (this.supabase) {
            console.log('✅ Supabase available, loading user gallery...');
            await this.loadUserGallery();
            
            // Start checking for loading state updates
            this.startLoadingStateChecker();
        } else {
            console.error('❌ Supabase not available, cannot load gallery');
        }
        
        console.log('✅ Generate Media setup complete');
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
            characterPreview.addEventListener('click', async () => {
                await this.openCharacterModal();
            });
        }

        // 监听角色选择变化
        document.addEventListener('characterSelected', (event) => {
            this.handleCharacterSelection(event.detail);
        });

        // Pose selection click
        const posePreview = document.getElementById('pose-preview-clickable');
        if (posePreview) {
            posePreview.addEventListener('click', () => {
                this.openPoseModal();
            });
        }

        // 监听pose选择变化
        document.addEventListener('poseSelected', (event) => {
            const poseValue = event.detail;
            this.appendToCustomPrompt(this.getPoseDescription(poseValue));
        });

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
                
                // 追加背景描述到Custom Prompt
                this.appendToCustomPrompt(this.getBackgroundDescription(e.target.dataset.value));
                
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
                
                // 追加服装描述到Custom Prompt
                this.appendToCustomPrompt(this.getOutfitDescription(e.target.dataset.value));
                
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
            console.log('✅ Generate button found, binding click event');
            generateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎯 Generate button clicked!');
                console.log('🎯 Button click timestamp:', new Date().toISOString());
                console.log('🎯 isGenerating state on click:', this.isGenerating);
                console.log('🎯 Button disabled state:', generateBtn.disabled);
                console.log('🎯 Button style opacity:', generateBtn.style.opacity);
                console.log('🎯 Button computed disabled:', generateBtn.getAttribute('disabled'));
                
                // 详细状态检查
                if (this.isGenerating) {
                    console.log('⚠️ Generation already in progress - blocked');
                    console.log('🔍 Detailed state check:');
                    console.log('  - this.isGenerating:', this.isGenerating);
                    console.log('  - button.disabled:', generateBtn.disabled);
                    console.log('  - button.style.cursor:', generateBtn.style.cursor);
                    return;
                }
                
                // 安全检查：如果按钮没有被禁用但isGenerating为true，强制重置
                if (!generateBtn.disabled && this.isGenerating) {
                    console.log('⚠️ Inconsistent state detected - forcing reset');
                    this.isGenerating = false;
                }
                
                console.log('✅ Proceeding with generation...');
                this.generateMedia();
            });
        } else {
            console.error('❌ Generate button not found!');
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
                    .select('id, name, description, prompt, images')
                    .order('number');

                if (error) {
                    console.error('❌ Error loading characters:', error);
                    this.loadFallbackCharacters();
                    return;
                }

                this.characters = characters || [];
                console.log('✅ Characters loaded:', this.characters.length);
                console.log('📋 First character data:', this.characters[0]);
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
            { id: 'freeplay', name: 'Free Play', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Freeplay/Free_Play.jpeg', prompt: 'A handsome young man' },
            { id: 'alex', name: 'Alex', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Alex/Alex1.png', prompt: 'Alex, a 21-year-old college student, athletic swimmer with a curious mind' },
            { id: 'bruno', name: 'Bruno', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Bruno/Bruno1.png', prompt: 'Bruno, a 45-year-old mature Latin man with a protective, daddy-like personality' },
            { id: 'clayton', name: 'Clayton', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Clayton/Clayton1.png', prompt: 'Clayton, a confident and charismatic man' },
            { id: 'cruz', name: 'Cruz', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Cruz/Cruz1.png', prompt: 'Cruz, a passionate and energetic young man' },
            { id: 'ethan', name: 'Ethan', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Ethan/Ethan1.png', prompt: 'Ethan, a sophisticated and intelligent gentleman' },
            { id: 'gabriel', name: 'Gabriel', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Gabriel/Gabriel1.png', prompt: 'Gabriel, a mysterious and alluring man' },
            { id: 'hunter', name: 'Hunter', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Hunter/Hunter1.png', prompt: 'Hunter, a rugged and adventurous outdoorsman' },
            { id: 'james', name: 'James', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/James/James1.png', prompt: 'James, a professional and well-dressed businessman' },
            { id: 'luca', name: 'Luca', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Luca/Luca1.png', prompt: 'Luca, a charming and artistic young man' },
            { id: 'mason', name: 'Mason', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Mason/Mason1.png', prompt: 'Mason, a strong and dependable man' },
            { id: 'rohan', name: 'Rohan', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Rohan/Rohan1.png', prompt: 'Rohan, an exotic and captivating man' },
            { id: 'terrell', name: 'Terrell', image_url: 'https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Terrell/Terrell1.png', prompt: 'Terrell, a confident and athletic young man' }
        ];
        console.log('📋 Fallback characters loaded with prompt fields');
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

    async openCharacterModal() {
        const modal = document.getElementById('characterModal');
        const grid = document.getElementById('characterGrid');
        
        if (!modal || !grid) return;

        // Clear previous content
        grid.innerHTML = '<div class="loading-indicator">Loading characters...</div>';

        // Ensure characters are loaded
        if (!this.characters || this.characters.length === 0) {
            console.log('🔄 Characters not loaded yet, loading now...');
            await this.loadCharacters();
        }

        // Clear loading indicator
        grid.innerHTML = '';

        // Populate character grid
        this.characters.forEach(character => {
            const item = document.createElement('div');
            item.className = 'selection-item';
            item.dataset.characterId = character.id;
            
            if (this.getCurrentState().selectedCharacter === character.id) {
                item.classList.add('selected');
            }

            // Get image URL - handle both database format (images array) and fallback format (image_url)
            const imageUrl = this.getCharacterImageUrl(character);

            item.innerHTML = `
                <img src="${imageUrl}" alt="${character.name}">
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

    // 获取角色图片URL
    getCharacterImageUrl(character) {
        // 处理数据库格式（images数组）
        if (character.images && Array.isArray(character.images) && character.images.length > 0) {
            return character.images[0];
        }
        // 处理fallback格式（image_url字段）
        if (character.image_url) {
            return character.image_url;
        }
        // 默认路径
        return `https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/${character.name}/${character.name}1.png`;
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
        
        // 找到选中的角色
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            // 自动填充角色描述到Custom Prompt
            this.handleCharacterSelection(character);
        }
        
        console.log('👤 Character selected:', characterId);
    }

    updateCharacterPreview() {
        const characterPreview = document.getElementById('character-preview-clickable');
        if (!characterPreview) return;

        const selectedCharacter = this.getCurrentState().selectedCharacter;
        if (selectedCharacter) {
            const character = this.characters.find(c => c.id === selectedCharacter);
            if (character) {
                const imageUrl = this.getCharacterImageUrl(character);
                characterPreview.innerHTML = `
                    <img src="${imageUrl}" alt="${character.name}">
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
        
        // 触发pose选择事件
        document.dispatchEvent(new CustomEvent('poseSelected', { detail: poseId }));
        
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
        console.log('🎯 generateMedia() called at:', new Date().toISOString());
        console.log('🔄 Current isGenerating state at start:', this.isGenerating);

        // Validation
        const currentState = this.getCurrentState();
        if (!currentState.selectedCharacter) {
            alert('Please select a character first!');
            return;
        }

        const customPrompt = document.getElementById('custom-prompt')?.value.trim();
        if (!customPrompt) {
            alert('Please enter a custom prompt!');
            return;
        }

        if (this.isGenerating) {
            console.log('⏳ Already generating, please wait...');
            console.log('🔍 Current isGenerating state:', this.isGenerating);
            alert('请等待当前生成完成后再试！');
            return;
        }
        
        console.log('✅ Not currently generating, proceeding...');
        console.log('🔍 isGenerating state before starting:', this.isGenerating);
        console.log('🔍 Current state:', currentState);
        console.log('🔍 Custom prompt:', customPrompt);

        // 检查用户登录状态
        console.log('🔐 Checking user authentication...');
        const authResult = await this.checkUserAuthentication();
        console.log('🔐 User authentication result:', authResult);
        
        if (!authResult.authenticated) {
            console.log('❌ User not authenticated, showing login modal');
            
            // 重置生成状态
            this.isGenerating = false;
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                generateBtn.style.cursor = 'pointer';
            }
            
            // 打开登录弹窗
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'flex';
                console.log('✅ Login modal opened');
            } else {
                // Fallback: 点击登录按钮
                const loginBtn = document.querySelector('.login-btn');
                if (loginBtn) {
                    loginBtn.click();
                    console.log('✅ Login button clicked');
                } else {
                    console.error('❌ No login method found');
                    alert('Please login to generate images');
                }
            }
            return;
        }
        
        console.log('✅ User authenticated, proceeding with generation');

        this.isGenerating = true;
        
        // 立即在画廊第一位显示加载状态
        this.showLoadingPlaceholder();
        
        // 禁用Generate按钮防止重复点击
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.6';
            generateBtn.style.cursor = 'not-allowed';
            console.log('🔒 Generate button disabled during generation');
        }

        try {
            // Get form values
            const negativePrompt = document.getElementById('negative-prompt')?.value || '';

            // Build the complete prompt
            const finalPrompt = this.buildCompletePrompt({
                character: currentState.selectedCharacter,
                pose: currentState.selectedPose,
                background: currentState.selectedBackground,
                outfit: currentState.selectedOutfit,
                customPrompt
            });

            console.log('📝 Final prompt:', finalPrompt);

            // 保存加载状态到数据库
            const loadingId = await this.saveLoadingState(
                finalPrompt, 
                currentState.selectedCharacter.name, 
                authResult.user.id
            );

            // 准备API请求数据
            const requestData = {
                user_id: authResult.user.id,
                prompt: finalPrompt,
                negative_prompt: negativePrompt,
                batch_size: currentState.selectedImageCount || 1,
                character_name: currentState.selectedCharacter.name,
                loading_id: loadingId // 传递加载ID用于后续更新
            };

            console.log('📤 Sending generation request:', requestData);

            // 调用生成API - 设置4分钟超时（比后端稍长）
            console.log('🔗 Making request to:', '/api/generate-image');
            console.log('⏱️ Setting 4-minute timeout for frontend request...');
            
            // 创建AbortController用于前端超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 240000); // 4分钟 = 240秒
            
            let response;
            try {
                response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData),
                    signal: controller.signal
                });
                
                // 清除超时器
                clearTimeout(timeoutId);
                
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    console.error('❌ Frontend request timeout after 4 minutes');
                    throw new Error('Request timeout: Image generation is taking longer than expected. Please try again.');
                } else {
                    console.error('❌ Frontend fetch error:', fetchError);
                    throw new Error(`Network error: ${fetchError.message}`);
                }
            }

            console.log('📡 API Response status:', response.status);
            console.log('📡 API Response statusText:', response.statusText);
            console.log('📡 API Response url:', response.url);
            
            // 检查响应头
            console.log('📋 Response headers:');
            for (let [key, value] of response.headers) {
                console.log(`  ${key}: ${value}`);
            }

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // 如果响应不是JSON，使用状态文本
                    console.error('❌ Response is not JSON:', e);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ Generation successful:', result);
            console.log('📋 Result structure check:');
            console.log('- result.success:', result.success);
            console.log('- result.images exists:', !!result.images);
            console.log('- result.images type:', typeof result.images);
            console.log('- result.images length:', result.images ? result.images.length : 'N/A');
            
            // 首先移除加载占位符
            this.removeLoadingPlaceholder();
            
            if (result.images && result.images.length > 0) {
                console.log('🖼️ Processing images:', result.images.length);
                
                // Save each image to database instead of immediately showing
                for (let i = 0; i < result.images.length; i++) {
                    const imageData = result.images[i];
                    console.log(`📸 Image ${i + 1}:`, imageData);
                    console.log(`🔗 Image ${i + 1} URL:`, imageData.url);
                    
                    // Save to database
                    await this.saveImageToDatabase({
                        image_url: imageData.url,
                        filename: imageData.filename || `generated_${Date.now()}_${i + 1}.png`,
                        prompt: finalPrompt,
                        character_name: this.getSelectedCharacterName(),
                        user_id: authResult.user.id,
                        seed: imageData.seed,
                        generation_params: {
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                            batch_index: i
                        }
                    });
                    
                    // Test image accessibility
                    this.testImageAccessibility(imageData.url, i + 1);
                }
                
                // Reload gallery from database to show all images including new ones
                console.log('🔄 Reloading gallery from database...');
                await this.loadUserGallery();
                
            } else {
                console.error('❌ No images found in result:', result);
                alert('Generation completed but no images were returned. Please try again.');
            }
            
            this.showSuccessMessage();

        } catch (error) {
            console.error('❌ Error generating media:', error);
            console.error('❌ Error stack:', error);
            console.log('🔄 Setting isGenerating to false due to error');
            
            // 移除加载占位符
            this.removeLoadingPlaceholder();
            
            // 显示更详细的错误信息
            let errorMessage = error.message;
            let shouldRetry = false;
            
            if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
                errorMessage = 'Image generation is taking longer than expected. This is normal during peak hours. Please try again or wait a few minutes.';
                shouldRetry = true;
            } else if (errorMessage.includes('408')) {
                errorMessage = 'The image generation timed out after 3 minutes. The server may be busy. Please try again.';
                shouldRetry = true;
            } else if (errorMessage.includes('500')) {
                errorMessage = 'Server error occurred. This might be a temporary issue with the RunPod endpoint.';
                shouldRetry = true;
            } else if (errorMessage.includes('405')) {
                errorMessage = 'API endpoint error. Please refresh the page and try again.';
            } else if (errorMessage.includes('No images generated')) {
                errorMessage = 'Image generation completed but no images were returned. This may be due to RunPod endpoint configuration issues.';
                shouldRetry = true;
            } else if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
                shouldRetry = true;
            }
            
            // 显示错误信息，如果可以重试则提供重试选项
            if (shouldRetry) {
                const retry = confirm(`${errorMessage}\n\nWould you like to try again?`);
                if (retry) {
                    // 先重置状态
                    this.isGenerating = false;
                    const generateBtn = document.getElementById('generate-btn');
                    if (generateBtn) {
                        generateBtn.disabled = false;
                        generateBtn.style.opacity = '1';
                        generateBtn.style.cursor = 'pointer';
                    }
                    
                    // 短暂延迟后重试
                    setTimeout(() => {
                        this.generateMedia();
                    }, 2000);
                    return; // 状态已重置，可以安全返回
                }
            } else {
                alert(`Failed to generate media: ${errorMessage}`);
            }
        } finally {
            // 确保生成状态被重置
            this.isGenerating = false;
            console.log('🔄 Generation state reset, ready for next request');
            console.log('🔍 Current isGenerating state:', this.isGenerating);
            
            // 确保Generate按钮可以再次点击
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                generateBtn.style.cursor = 'pointer';
                console.log('✅ Generate button re-enabled');
            }
        }
    }

    // 检查用户认证状态 - 快速检查本地存储优先
    async checkUserAuthentication() {
        console.log('🔐 Starting fast authentication check...');
        
        // 首先快速检查localStorage中的session token
        try {
            console.log('🔐 Quick check: localStorage session...');
            const sessionData = localStorage.getItem('sb-kuflobojizyttadwcbhe-auth-token');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session && session.user && session.expires_at) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    const now = new Date();
                    
                    // 检查token是否还有效（还有5分钟以上）
                    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
                        console.log('✅ Valid session found in localStorage:', session.user.email);
                        return {
                            authenticated: true,
                            user: session.user,
                            source: 'localStorage'
                        };
                    } else {
                        console.log('⚠️ Session expired, checking with Supabase...');
                    }
                }
            } else {
                console.log('🔐 No session data in localStorage');
            }
        } catch (localStorageError) {
            console.log('⚠️ localStorage check failed, trying Supabase...');
        }
        
        // 如果localStorage检查失败，再尝试Supabase
        try {
            console.log('🔐 Checking Supabase availability:', !!window.supabase);
            console.log('🔐 Checking global Supabase availability:', !!window.globalSupabase);
            
            // 优先使用 globalSupabase，fallback 到 window.supabase
            const supabaseClient = window.globalSupabase || window.supabase;
            
            if (supabaseClient) {
                console.log('🔐 Getting user from Supabase...');
                
                // 添加超时处理，缩短到1.5秒
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Supabase getUser timeout')), 1500);
                });
                
                const getUserPromise = supabaseClient.auth.getUser();
                
                const result = await Promise.race([getUserPromise, timeoutPromise]);
                console.log('🔐 Supabase getUser result:', result);
                
                if (result.error) {
                    console.error('❌ Supabase auth error:', result.error);
                    // 如果是session missing错误，明确返回未认证
                    if (result.error.message && result.error.message.includes('Auth session missing')) {
                        console.log('🔐 Session missing - user needs to login');
                    }
                    return { authenticated: false };
                }
                
                if (!result.data?.user) {
                    return { authenticated: false };
                }
                
                return {
                    authenticated: true,
                    user: result.data.user,
                    source: 'supabase'
                };
            } else {
                console.error('❌ Supabase not available');
                return { authenticated: false };
            }
        } catch (error) {
            console.error('❌ Supabase auth check error:', error);
            return { authenticated: false };
        }
    }

    // Fallback用户获取方法
    getFallbackUser() {
        try {
            console.log('🔐 Attempting to get user from localStorage...');
            const token = localStorage.getItem('sb-kuflobojizyttadwcbhe-auth-token');
            if (token) {
                const authData = JSON.parse(token);
                if (authData?.user) {
                    console.log('🔐 Using cached user from localStorage:', authData.user.email);
                    return authData.user;
                }
            }
            
            // 如果localStorage也没有，创建一个临时用户
            console.log('🔐 No cached user found, creating temporary user');
            return {
                id: 'temp-user-' + Date.now(),
                email: 'temp@gcrush.org',
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('🔐 Fallback user creation failed:', error);
            return {
                id: 'fallback-user',
                email: 'fallback@gcrush.org',
                created_at: new Date().toISOString()
            };
        }
    }



    // 处理角色选择
    handleCharacterSelection(character) {
        console.log('👤 Character selected:', character);
        console.log('📝 Character prompt field:', character.prompt);
        console.log('📝 Character system_prompt field:', character.system_prompt);
        
        // 从角色的prompt字段中获取内容并填充到custom prompt
        if (character && character.prompt) {
            const customPromptField = document.getElementById('custom-prompt');
            if (customPromptField) {
                customPromptField.value = character.prompt;
                console.log('✅ Set custom prompt to:', character.prompt);
            }
        } else {
            console.warn('❌ No prompt field found in character data');
        }
    }

    // 追加内容到Custom Prompt
    appendToCustomPrompt(description) {
        if (!description) return;
        
        const customPromptField = document.getElementById('custom-prompt');
        if (customPromptField) {
            const currentValue = customPromptField.value.trim();
            if (currentValue) {
                // 如果已有内容，用逗号和空格连接
                customPromptField.value = currentValue + ', ' + description;
            } else {
                // 如果没有内容，直接设置
                customPromptField.value = description;
            }
        }
    }

    // 从system_prompt中提取角色描述
    extractCharacterDescription(systemPrompt) {
        // 移除"You are"开头的指令性语言，保留描述性内容
        let description = systemPrompt.replace(/^You are\s+/i, '');
        
        // 提取年龄、外貌、性格等描述性信息
        const sentences = description.split(/[.!?]+/);
        const descriptiveSentences = sentences.filter(sentence => {
            const trimmed = sentence.trim();
            return trimmed.length > 0 && 
                   !trimmed.toLowerCase().includes('you are') &&
                   !trimmed.toLowerCase().includes('you love') &&
                   !trimmed.toLowerCase().includes('you enjoy') &&
                   !trimmed.toLowerCase().includes('you spend');
        });
        
        // 取前两句作为角色描述
        return descriptiveSentences.slice(0, 2).join('. ').trim();
    }

    // 构建完整的提示词
    buildCompletePrompt({ character, pose, background, outfit, customPrompt }) {
        let promptParts = [];
        
        // 添加基础角色描述
        if (customPrompt) {
            promptParts.push(customPrompt);
        }
        
        // 添加姿势描述
        if (pose) {
            const poseDescription = this.getPoseDescription(pose);
            if (poseDescription) {
                promptParts.push(poseDescription);
            }
        }
        
        // 添加服装描述
        if (outfit) {
            const outfitDescription = this.getOutfitDescription(outfit);
            if (outfitDescription) {
                promptParts.push(outfitDescription);
            }
        }
        
        // 添加背景描述
        if (background) {
            const backgroundDescription = this.getBackgroundDescription(background);
            if (backgroundDescription) {
                promptParts.push(backgroundDescription);
            }
        }
        
        return promptParts.join(', ');
    }

    // 获取姿势描述
    getPoseDescription(pose) {
        const poseDescriptions = {
            'sit': 'sitting comfortably in a relaxed position',
            'stand': 'standing confidently with good posture',
            'lie': 'lying down in a comfortable position',
            'lean': 'leaning casually against something',
            'kneel': 'kneeling gracefully',
            'squat': 'squatting in a dynamic pose'
        };
        return poseDescriptions[pose] || `in ${pose} pose`;
    }

    // 获取服装描述
    getOutfitDescription(outfit) {
        const outfitDescriptions = {
            'naked': 'completely nude',
            'police uniform': 'wearing a police uniform',
            'leather jacket': 'wearing a leather jacket',
            'business suit': 'wearing a business suit',
            'military uniform': 'wearing a military uniform',
            'tank top': 'wearing a tank top',
            'jockstrap': 'wearing a jockstrap',
            'cowboy outfit': 'wearing a cowboy outfit',
            'doctor coat': 'wearing a doctor coat',
            'firefighter gear': 'wearing firefighter gear',
            'sailor uniform': 'wearing a sailor uniform',
            'construction vest': 'wearing a construction vest',
            'harness': 'wearing a harness',
            'thong': 'wearing a thong',
            'boxer': 'wearing boxer shorts'
        };
        return outfitDescriptions[outfit] || `wearing ${outfit}`;
    }

    // 获取背景描述
    getBackgroundDescription(background) {
        const backgroundDescriptions = {
            'bedroom': 'in a modern bedroom',
            'bathroom': 'in a luxurious bathroom',
            'gym': 'in a modern gym, surrounded by equipment',
            'locker room': 'in a locker room',
            'office': 'in a professional office',
            'hotel room': 'in a hotel room',
            'beach': 'on a beautiful beach',
            'pool': 'by a swimming pool',
            'sauna': 'in a sauna',
            'bar': 'in a stylish bar',
            'nightclub': 'in a nightclub',
            'rooftop': 'on a rooftop',
            'kitchen': 'in a modern kitchen',
            'garage': 'in a garage',
            'balcony': 'on a balcony'
        };
        return backgroundDescriptions[background] || `in ${background}`;
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

    showGenerationProgress() {
        const galleryContent = document.getElementById('gallery-content');
        if (galleryContent) {
            // 如果有"no images"消息，先移除
            const noImagesMsg = galleryContent.querySelector('.no-images');
            if (noImagesMsg) {
                noImagesMsg.remove();
            }

            // 创建gallery grid如果不存在
            let galleryGrid = galleryContent.querySelector('.gallery-grid');
            if (!galleryGrid) {
                galleryGrid = document.createElement('div');
                galleryGrid.className = 'gallery-grid';
                galleryContent.appendChild(galleryGrid);
            }

            // 获取当前选择的图片数量
            const currentState = this.getCurrentState();
            const imageCount = currentState.selectedImageCount || 1;

            // 为每张图片创建加载状态
            for (let i = 0; i < imageCount; i++) {
                const loadingItem = document.createElement('div');
                loadingItem.className = 'gallery-item generating';
                loadingItem.id = `generating-${i}`;
                loadingItem.innerHTML = `
                    <div class="generating-placeholder">
                        <div class="generating-spinner"></div>
                        <div class="generating-text">
                            <h4>Generating image...</h4>
                            <p>This will take less than 40 seconds</p>
                        </div>
                    </div>
                `;
                galleryGrid.appendChild(loadingItem);
            }
        }
    }

    hideGenerationProgress() {
        // 移除所有生成中的占位符
        const generatingItems = document.querySelectorAll('.gallery-item.generating');
        generatingItems.forEach(item => item.remove());
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

    showLoadingPlaceholder() {
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

        // Remove any existing loading placeholders
        const existingPlaceholders = galleryGrid.querySelectorAll('.loading-placeholder-item');
        existingPlaceholders.forEach(placeholder => placeholder.remove());

        // Get the number of images to generate
        const currentState = this.getCurrentState();
        const imageCount = currentState.selectedImageCount || 1;
        
        console.log('🔍 Current state:', currentState);
        console.log('🔍 Media type:', this.currentMediaType);
        console.log('🔍 Selected image count:', currentState.selectedImageCount);
        console.log(`📊 Creating ${imageCount} loading placeholder(s)`);

        // Create loading placeholders based on selected count
        for (let i = 0; i < imageCount; i++) {
            const loadingItem = document.createElement('div');
            loadingItem.className = 'gallery-item loading-placeholder-item';
            loadingItem.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>Generating image...</p>
                    <p class="loading-time">This will take less than 40 seconds</p>
                </div>
            `;

            // Insert at the beginning of gallery (newest first)
            galleryGrid.insertBefore(loadingItem, galleryGrid.firstChild);
        }
        
        // Scroll to gallery
        galleryContent.scrollIntoView({ behavior: 'smooth' });
        
        console.log(`✅ ${imageCount} loading placeholder(s) added at top of gallery`);
    }

    removeLoadingPlaceholder() {
        const galleryContent = document.getElementById('gallery-content');
        if (!galleryContent) return;
        
        const galleryGrid = galleryContent.querySelector('.gallery-grid');
        if (galleryGrid) {
            // Remove all loading placeholder items
            const loadingPlaceholders = galleryGrid.querySelectorAll('.loading-placeholder-item');
            loadingPlaceholders.forEach(placeholder => placeholder.remove());
            console.log(`✅ ${loadingPlaceholders.length} loading placeholder(s) removed`);
        }
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

    // 预加载图片并测试可访问性
    preloadImage(url, index) {
        console.log(`🔍 Preloading image ${index}:`, url);
        
        const img = new Image();
        img.onload = () => {
            console.log(`✅ Image ${index} loaded successfully:`, url);
        };
        img.onerror = () => {
            console.error(`❌ Image ${index} failed to load:`, url);
            // 可以在这里添加重试逻辑或显示错误状态
        };
        img.src = url;
        }

    // Load user gallery from Supabase
    async loadUserGallery() {
        if (!this.supabase) {
            console.log('❌ Supabase client not available');
            return;
        }
        
        try {
            // Try to get user ID from authentication
            let userId = null;
            const authResult = await this.checkUserAuthentication();
            if (authResult.authenticated) {
                userId = authResult.user.id;
                console.log('✅ User authenticated, loading gallery for:', userId);
            } else {
                // Fallback: use a default user ID for testing
                userId = '99f24c0c-6e5c-4859-ae86-8e8bade07b98';
                console.log('👤 User not authenticated, using default user ID for gallery load');
            }
            
            console.log('📚 Loading user gallery from Supabase...');
            const { data, error } = await this.supabase
                .from('user_gallery')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error loading gallery:', error);
                console.error('❌ Error details:', error);
                return;
            }
            
            this.userGallery = data || [];
            console.log(`✅ Loaded ${this.userGallery.length} gallery items`);
            
            // Display gallery items
            this.displayGalleryItems();
            
        } catch (error) {
            console.error('❌ Exception loading gallery:', error);
            console.error('❌ Exception details:', error);
        }
    }

    // Display gallery items in UI
    displayGalleryItems() {
        console.log('🎨 Displaying gallery items...');
        
        const galleryContent = document.getElementById('gallery-content');
        if (!galleryContent) {
            console.error('❌ Gallery content not found');
            return;
        }
        
        // Remove any existing "no images" message
        const noImagesMsg = galleryContent.querySelector('.no-images');
        if (noImagesMsg) {
            noImagesMsg.remove();
        }
        
        // Check if we have any gallery items
        if (!this.userGallery || this.userGallery.length === 0) {
            console.log('📭 No gallery items, showing empty message');
            galleryContent.innerHTML = '<p class="no-images">No images generated yet</p>';
            return;
        }
        
        // Create gallery grid if it doesn't exist
        let galleryGrid = galleryContent.querySelector('.gallery-grid');
        if (!galleryGrid) {
            console.log('📋 Creating gallery grid...');
            galleryGrid = document.createElement('div');
            galleryGrid.className = 'gallery-grid';
            galleryGrid.id = 'gallery-grid';
            galleryContent.appendChild(galleryGrid);
        }
        
        // Clear all existing items (we'll reload everything including loading states)
        galleryGrid.innerHTML = '';
        console.log(`🗑️ Cleared all existing items`);
        
        // Add gallery items (already sorted by created_at desc from Supabase)
        console.log(`📸 Adding ${this.userGallery.length} gallery items`);
        this.userGallery.forEach((item, index) => {
            console.log(`📸 Adding item ${index + 1}:`, item.filename || 'loading');
            this.addGalleryItemFromData(item);
        });
        
        console.log('✅ Gallery display complete');
    }

    // Add gallery item from Supabase data
    addGalleryItemFromData(galleryData) {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) return;
        
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        // Check the status of this gallery item
        const status = galleryData.generation_params?.status;
        const hasImage = galleryData.image_url && galleryData.image_url.trim() !== '';
        
        if (!hasImage && status === 'generating') {
            // Display loading placeholder for generating images
            galleryItem.className += ' loading-placeholder-item';
            galleryItem.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>Generating...</p>
                    <p class="loading-time">Started: ${new Date(galleryData.created_at).toLocaleTimeString()}</p>
                </div>
            `;
        } else if (!hasImage && status === 'timeout') {
            // Display timeout error
            galleryItem.className += ' error-placeholder-item';
            galleryItem.innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <p>Generation Failed</p>
                    <p class="error-time">Timed out after 3 minutes</p>
                </div>
            `;
        } else {
            // Display only the image, no text overlay
            galleryItem.innerHTML = `
                <img src="${galleryData.image_url}" alt="Generated Image" loading="lazy">
                <div class="click-indicator">
                    <i class="fas fa-expand"></i> View
                </div>
            `;
            
            // Add click event to open image viewer
            galleryItem.addEventListener('click', () => {
                this.openImageViewer(galleryData.image_url, galleryData.id);
            });
        }
        
        // Add to gallery grid at the end (data is already sorted newest first from Supabase)
        galleryGrid.appendChild(galleryItem);
    }

    // Open full-screen image viewer
    openImageViewer(imageUrl, imageId) {
        console.log('🖼️ Opening image viewer for:', imageId);
        
        // Get all images from gallery (only those with valid URLs)
        const allImages = this.userGallery.filter(item => 
            item.image_url && item.image_url.trim() !== ''
        );
        
        if (allImages.length === 0) return;
        
        // Find current image index
        const currentIndex = allImages.findIndex(item => item.id === imageId);
        if (currentIndex === -1) return;
        
        // Create viewer overlay
        const viewerOverlay = document.createElement('div');
        viewerOverlay.className = 'image-viewer-overlay';
        viewerOverlay.innerHTML = `
            <div class="image-viewer-container">
                <button class="image-viewer-close" aria-label="Close viewer">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="image-viewer-content">
                    <div class="image-viewer-main">
                        <img src="${imageUrl}" alt="Gallery Image" class="viewer-image">
                        <div class="image-viewer-info">
                            <span class="image-counter">${currentIndex + 1} / ${allImages.length}</span>
                            <div class="navigation-hint">
                                <span class="desktop-hint"><i class="fas fa-mouse"></i> Scroll or use ↑↓ keys</span>
                                <span class="mobile-hint"><i class="fas fa-hand-paper"></i> Swipe up/down to navigate</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="image-viewer-nav">
                        <button class="nav-btn prev-btn" ${currentIndex === 0 ? 'disabled' : ''} aria-label="Previous image">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="nav-btn next-btn" ${currentIndex === allImages.length - 1 ? 'disabled' : ''} aria-label="Next image">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(viewerOverlay);
        document.body.style.overflow = 'hidden';
        
        // Initialize viewer
        this.initializeImageViewer(viewerOverlay, allImages, currentIndex);
    }

    // Initialize image viewer functionality
    initializeImageViewer(viewerOverlay, allImages, startIndex) {
        let currentIndex = startIndex;
        
        const viewerImage = viewerOverlay.querySelector('.viewer-image');
        const imageCounter = viewerOverlay.querySelector('.image-counter');
        const prevBtn = viewerOverlay.querySelector('.prev-btn');
        const nextBtn = viewerOverlay.querySelector('.next-btn');
        const closeBtn = viewerOverlay.querySelector('.image-viewer-close');
        
        // Update image and UI
        const updateImage = (index) => {
            if (index < 0 || index >= allImages.length) return;
            
            currentIndex = index;
            const currentImage = allImages[index];
            
            // Fade out current image
            viewerImage.style.opacity = '0';
            
            setTimeout(() => {
                viewerImage.src = currentImage.image_url;
                imageCounter.textContent = `${index + 1} / ${allImages.length}`;
                
                // Update navigation buttons
                prevBtn.disabled = index === 0;
                nextBtn.disabled = index === allImages.length - 1;
                
                // Fade in new image
                viewerImage.style.opacity = '1';
            }, 150);
        };
        
        // Navigation event handlers
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                updateImage(currentIndex - 1);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentIndex < allImages.length - 1) {
                updateImage(currentIndex + 1);
            }
        });
        
        // Close viewer
        const closeViewer = () => {
            document.body.style.overflow = '';
            viewerOverlay.remove();
        };
        
        closeBtn.addEventListener('click', closeViewer);
        
        // Close on overlay click (but not on image or nav buttons)
        viewerOverlay.addEventListener('click', (e) => {
            if (e.target === viewerOverlay) {
                closeViewer();
            }
        });
        
        // Keyboard navigation
        const handleKeydown = (e) => {
            switch (e.key) {
                case 'Escape':
                    closeViewer();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) updateImage(currentIndex - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < allImages.length - 1) updateImage(currentIndex + 1);
                    break;
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
        
        // Mouse wheel navigation
        const handleWheel = (e) => {
            e.preventDefault();
            
            // Debounce wheel events to prevent rapid scrolling
            if (this.wheelTimeout) {
                clearTimeout(this.wheelTimeout);
            }
            
            this.wheelTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    // Scroll down - next image
                    if (currentIndex < allImages.length - 1) {
                        updateImage(currentIndex + 1);
                    }
                } else if (e.deltaY < 0) {
                    // Scroll up - previous image
                    if (currentIndex > 0) {
                        updateImage(currentIndex - 1);
                    }
                }
            }, 100);
        };
        
        viewerOverlay.addEventListener('wheel', handleWheel, { passive: false });
        
        // Touch/swipe support for mobile
        let touchStartY = 0;
        let touchEndY = 0;
        
        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };
        
        const handleTouchMove = (e) => {
            e.preventDefault(); // Prevent scrolling
        };
        
        const handleTouchEnd = (e) => {
            touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    // Swipe up - next image
                    if (currentIndex < allImages.length - 1) {
                        updateImage(currentIndex + 1);
                    }
                } else {
                    // Swipe down - previous image
                    if (currentIndex > 0) {
                        updateImage(currentIndex - 1);
                    }
                }
            }
        };
        
        const imageContainer = viewerOverlay.querySelector('.image-viewer-main');
        imageContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        imageContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        imageContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Clean up event listeners when viewer closes
        const originalRemove = viewerOverlay.remove;
        viewerOverlay.remove = function() {
            document.removeEventListener('keydown', handleKeydown);
            viewerOverlay.removeEventListener('wheel', handleWheel);
            if (this.wheelTimeout) {
                clearTimeout(this.wheelTimeout);
            }
            originalRemove.call(this);
        };
        
        // Add entrance animation
        setTimeout(() => {
            viewerOverlay.classList.add('active');
        }, 10);
    }

    // Save loading state to Supabase
    async saveLoadingState(prompt, characterName, userId) {
        if (!this.supabase || !userId) return null;
        
        try {
            console.log('💾 Saving loading state to gallery...');
            
            const loadingData = {
                user_id: userId,
                image_url: '', // Empty for loading state
                filename: `loading_${Date.now()}.png`,
                prompt: prompt,
                character_name: characterName,
                generation_params: {
                    status: 'generating',
                    started_at: new Date().toISOString()
                }
            };
            
            const { data, error } = await this.supabase
                .from('user_gallery')
                .insert([loadingData])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error saving loading state:', error);
                return null;
            }
            
            console.log('✅ Loading state saved with ID:', data.id);
            return data.id;
            
        } catch (error) {
            console.error('❌ Exception saving loading state:', error);
            return null;
        }
    }

    // Update loading state with generated image
    async updateLoadingStateWithImage(loadingId, imageUrl, filename, seed) {
        if (!this.supabase || !loadingId) return;
        
        try {
            console.log('🔄 Updating loading state with generated image...');
            
            const { error } = await this.supabase
                .from('user_gallery')
                .update({
                    image_url: imageUrl,
                    filename: filename,
                    seed: seed,
                    generation_params: {
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    }
                })
                .eq('id', loadingId);
            
            if (error) {
                console.error('❌ Error updating loading state:', error);
                return;
            }
            
            console.log('✅ Loading state updated successfully');
            
            // Reload gallery to show updated item
            this.loadUserGallery();
            
        } catch (error) {
            console.error('❌ Exception updating loading state:', error);
        }
    }

    // Start checking for loading state updates
    startLoadingStateChecker() {
        if (this.loadingStateChecker) {
            clearInterval(this.loadingStateChecker);
        }
        
        console.log('🔄 Starting loading state checker...');
        this.loadingStateChecker = setInterval(async () => {
            await this.checkLoadingStates();
        }, 10000); // Check every 10 seconds
        
        // Also start timeout checker for loading states
        this.startLoadingTimeoutChecker();
    }

    // Check for loading states that have timed out
    startLoadingTimeoutChecker() {
        if (this.loadingTimeoutChecker) {
            clearInterval(this.loadingTimeoutChecker);
        }
        
        console.log('⏰ Starting loading timeout checker...');
        this.loadingTimeoutChecker = setInterval(async () => {
            await this.checkLoadingTimeouts();
        }, 30000); // Check every 30 seconds
    }

    // Check for loading states that have exceeded 3 minutes
    async checkLoadingTimeouts() {
        if (!this.supabase) return;
        
        try {
            // Get current user ID
            let userId = null;
            const authResult = await this.checkUserAuthentication();
            if (authResult.authenticated) {
                userId = authResult.user.id;
            } else {
                userId = '99f24c0c-6e5c-4859-ae86-8e8bade07b98';
            }
            
            // Find loading states older than 3 minutes
            const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
            
            const { data, error } = await this.supabase
                .from('user_gallery')
                .select('*')
                .eq('user_id', userId)
                .eq('image_url', '')
                .contains('generation_params', { status: 'generating' })
                .lt('created_at', threeMinutesAgo);
            
            if (error) {
                console.error('❌ Error checking loading timeouts:', error);
                return;
            }
            
            if (data && data.length > 0) {
                console.log(`⏰ Found ${data.length} timed out loading states`);
                
                // Update timed out loading states to error status
                for (const item of data) {
                    await this.supabase
                        .from('user_gallery')
                        .update({
                            generation_params: {
                                status: 'timeout',
                                error: 'Generation timed out after 3 minutes',
                                timeout_at: new Date().toISOString()
                            }
                        })
                        .eq('id', item.id);
                }
                
                // Reload gallery to show updated states
                await this.loadUserGallery();
            }
            
        } catch (error) {
            console.error('❌ Exception checking loading timeouts:', error);
        }
    }

    // Check for loading states that might have been completed
    async checkLoadingStates() {
        if (!this.supabase) return;
        
        try {
            // Get current user ID
            let userId = null;
            const authResult = await this.checkUserAuthentication();
            if (authResult.authenticated) {
                userId = authResult.user.id;
            } else {
                userId = '99f24c0c-6e5c-4859-ae86-8e8bade07b98';
            }
            
            // Check for any loading states that might have been updated
            const { data, error } = await this.supabase
                .from('user_gallery')
                .select('*')
                .eq('user_id', userId)
                .contains('generation_params', { status: 'completed' })
                .neq('image_url', '')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('❌ Error checking loading states:', error);
                return;
            }
            
            // Check if we have any new completed images
            if (data && data.length > 0) {
                const currentGalleryUrls = this.userGallery.map(item => item.image_url);
                const newCompletedImages = data.filter(item => 
                    item.image_url && 
                    !currentGalleryUrls.includes(item.image_url)
                );
                
                if (newCompletedImages.length > 0) {
                    console.log(`🎉 Found ${newCompletedImages.length} newly completed images!`);
                    await this.loadUserGallery(); // Reload gallery to show new images
                }
            }
            
        } catch (error) {
            console.error('❌ Exception checking loading states:', error);
        }
    }

    // Handle image loading errors
    handleImageLoadError(imageUrl) {
        console.log('🔧 Handling image load error for:', imageUrl);
        
        // Find gallery items with this image URL
        const galleryItems = document.querySelectorAll('.gallery-item img');
        galleryItems.forEach(img => {
            if (img.src === imageUrl) {
                const galleryItem = img.closest('.gallery-item');
                if (galleryItem) {
                    // Replace with error state
                    galleryItem.innerHTML = `
                        <div class="error-placeholder">
                            <div class="error-icon">❌</div>
                            <p>Image Load Failed</p>
                            <p class="error-time">Network connection error</p>
                            <button class="retry-load-btn" onclick="window.generateMediaApp.retryImageLoad('${imageUrl}', this)">
                                Retry
                            </button>
                        </div>
                    `;
                    galleryItem.classList.add('error-placeholder-item');
                }
            }
        });
    }

    // Retry loading a specific image
    retryImageLoad(imageUrl, buttonElement) {
        console.log('🔄 Retrying image load for:', imageUrl);
        
        const galleryItem = buttonElement.closest('.gallery-item');
        if (!galleryItem) return;
        
        // Show loading state
        galleryItem.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner"></div>
                <p>Retrying...</p>
            </div>
        `;
        
        // Try to load the image again
        const img = new Image();
        img.onload = () => {
            console.log('✅ Image loaded successfully on retry');
            // Restore normal image display
            galleryItem.innerHTML = `
                <img src="${imageUrl}" alt="Generated Image" loading="lazy">
                <div class="click-indicator">
                    <i class="fas fa-expand"></i> View
                </div>
            `;
            galleryItem.classList.remove('error-placeholder-item');
            
            // Re-add click event for image viewer
            galleryItem.addEventListener('click', () => {
                // Find the image data in userGallery
                const imageData = this.userGallery.find(item => item.image_url === imageUrl);
                if (imageData) {
                    this.openImageViewer(imageUrl, imageData.id);
                }
            });
        };
        img.onerror = () => {
            console.error('❌ Image still failed to load on retry');
            // Show permanent error state
            galleryItem.innerHTML = `
                <div class="error-placeholder">
                    <div class="error-icon">❌</div>
                    <p>Image Unavailable</p>
                    <p class="error-time">Server connection issue</p>
                </div>
            `;
        };
        
        // Add cache-busting parameter to force reload
        img.src = imageUrl + '?retry=' + Date.now();
    }

    // Save generated image to database
    async saveImageToDatabase(imageData) {
        if (!this.supabase) {
            console.error('❌ Supabase client not available for saving image');
            return;
        }
        
        try {
            console.log('💾 Saving generated image to database:', imageData.filename);
            
            const { data, error } = await this.supabase
                .from('user_gallery')
                .insert([imageData])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error saving image to database:', error);
                return;
            }
            
            console.log('✅ Image saved to database with ID:', data.id);
            return data.id;
            
        } catch (error) {
            console.error('❌ Exception saving image to database:', error);
        }
    }

    // Test image accessibility
    testImageAccessibility(imageUrl, index) {
        console.log(`🌐 Testing image ${index} accessibility:`, imageUrl);
        
        const img = new Image();
        img.onload = () => {
            console.log(`✅ Image ${index} is accessible:`, imageUrl);
        };
        img.onerror = (error) => {
            console.error(`❌ Image ${index} is not accessible:`, imageUrl);
            // The image will show error state when displayed in gallery
        };
        img.src = imageUrl;
    }

    // Get selected character name
    getSelectedCharacterName() {
        const currentState = this.getCurrentState();
        if (currentState.selectedCharacter) {
            const character = this.characters.find(c => c.id === currentState.selectedCharacter);
            return character ? character.name : 'Unknown Character';
        }
        return 'No Character Selected';
    }
}

// Initialize when main scripts are ready
function initGenerateMediaPage() {
    console.log('🎨 Initializing Generate Media page...');
    
    // Wait for auth to be ready
    const initGenerateMedia = async () => {
        if (typeof window.supabase !== 'undefined') {
            window.generateMediaApp = new GenerateMediaIntegrated();
            await window.generateMediaApp.init();
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