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
        console.log('🔍 Checking DOM elements...');
        console.log('- Generate button exists:', !!document.getElementById('generate-btn'));
        console.log('- Custom prompt exists:', !!document.getElementById('custom-prompt'));
        console.log('- Negative prompt exists:', !!document.getElementById('negative-prompt'));
        
        this.setupEventListeners();
        this.loadCharacters();
        this.loadPoses();
        this.initializeAdvancedSettings();
        
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
                
                // 安全检查：如果按钮没有被禁用但isGenerating为true，强制重置
                if (!generateBtn.disabled && this.isGenerating) {
                    console.log('⚠️ Inconsistent state detected - forcing reset');
                    this.isGenerating = false;
                }
                
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
        
        // 禁用Generate按钮防止重复点击
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.6';
            generateBtn.style.cursor = 'not-allowed';
            console.log('🔒 Generate button disabled during generation');
        }
        
        this.showGenerationProgress();

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

            // 准备API请求数据
            const requestData = {
                user_id: authResult.user.id,
                prompt: finalPrompt,
                negative_prompt: negativePrompt,
                batch_size: currentState.selectedImageCount || 2,
                character_name: currentState.selectedCharacter.name
            };

            console.log('📤 Sending generation request:', requestData);

            // 调用生成API
            console.log('🔗 Making request to:', '/api/generate-image');
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

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
            
            if (result.images && result.images.length > 0) {
                console.log('🖼️ Processing images:', result.images.length);
                for (let i = 0; i < result.images.length; i++) {
                    const imageData = result.images[i];
                    console.log(`📸 Image ${i + 1}:`, imageData);
                    console.log(`🔗 Image ${i + 1} URL:`, imageData.url);
                    
                    // 测试图片URL是否可访问
                    console.log(`🌐 Testing image URL accessibility:`, imageData.url);
                    
                    const galleryResult = {
                        type: 'image',
                        url: imageData.url,
                        prompt: finalPrompt,
                        negativePrompt: negativePrompt,
                        timestamp: imageData.created_at,
                        seed: imageData.seed
                    };
                    console.log(`📋 Gallery result ${i + 1}:`, galleryResult);
                    
                    // 添加到画廊（新图片显示在第一个位置）
                    this.showGenerationResult(galleryResult, true);
                    
                    // 预加载图片以测试可访问性
                    this.preloadImage(imageData.url, i + 1);
                }
            } else {
                console.error('❌ No images found in result:', result);
                alert('Generation completed but no images were returned. Please try again.');
            }
            
            this.hideGenerationProgress();
            this.showSuccessMessage();

        } catch (error) {
            console.error('❌ Error generating media:', error);
            console.error('❌ Error stack:', error.stack);
            console.log('🔄 Setting isGenerating to false due to error');
            this.hideGenerationProgress();
            
            // 显示更详细的错误信息
            let errorMessage = error.message;
            let shouldRetry = false;
            
            if (errorMessage.includes('500')) {
                errorMessage = 'Server error occurred. This might be a temporary issue with the RunPod endpoint.';
                shouldRetry = true;
            } else if (errorMessage.includes('405')) {
                errorMessage = 'API endpoint error. Please refresh the page and try again.';
            } else if (errorMessage.includes('No images generated')) {
                errorMessage = 'Image generation completed but no images were returned. This may be due to RunPod endpoint configuration issues.';
                shouldRetry = true;
            } else if (errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
                shouldRetry = true;
            }
            
            // 显示错误信息，如果可以重试则提供重试选项
            if (shouldRetry) {
                const retry = confirm(`${errorMessage}\n\nWould you like to try again?`);
                if (retry) {
                    // 短暂延迟后重试
                    setTimeout(() => {
                        this.generateMedia();
                    }, 2000);
                    return; // 不重置生成状态，让重试继续
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
            const imageCount = currentState.selectedImageCount || 2;

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

    showGenerationResult(result, insertAtTop = false) {
        console.log('🎨 Showing generation result:', result);
        this.addToGallery(result, insertAtTop);
        this.showSuccessMessage();
    }

    addToGallery(result, insertAtTop = false) {
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
        
        // 添加加载状态
        if (insertAtTop) {
            galleryItem.classList.add('loading');
            galleryItem.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>生成中...</p>
                </div>
            `;
        }
        
        const media = document.createElement(result.type === 'video' ? 'video' : 'img');
        media.src = result.url;
        media.alt = 'Generated Media';
        if (result.type === 'video') {
            media.controls = true;
        }
        
        // 图片加载完成后移除加载状态
        media.onload = () => {
            if (insertAtTop) {
                galleryItem.classList.remove('loading');
                galleryItem.innerHTML = '';
                galleryItem.appendChild(media);
                galleryItem.appendChild(itemInfo);
            }
        };
        
        const itemInfo = document.createElement('div');
        itemInfo.className = 'gallery-item-info';
        
        const title = document.createElement('h4');
        title.textContent = result.character || 'Generated Media';
        
        const timestamp = document.createElement('p');
        timestamp.textContent = new Date().toLocaleString();
        
        itemInfo.appendChild(title);
        itemInfo.appendChild(timestamp);
        
        if (!insertAtTop) {
            galleryItem.appendChild(media);
            galleryItem.appendChild(itemInfo);
        }
        
        // 根据insertAtTop参数决定插入位置
        if (insertAtTop) {
            galleryGrid.insertBefore(galleryItem, galleryGrid.firstChild);
        } else {
            galleryGrid.appendChild(galleryItem);
        }
        
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

    // 改进的画廊结果显示方法
    showGenerationResult(result) {
        console.log('🖼️ Adding result to gallery:', result);
        
        const galleryContent = document.getElementById('gallery-content');
        if (!galleryContent) {
            console.error('❌ Gallery content not found');
            return;
        }

        // 创建或获取gallery grid
        let galleryGrid = galleryContent.querySelector('.gallery-grid');
        if (!galleryGrid) {
            galleryGrid = document.createElement('div');
            galleryGrid.className = 'gallery-grid';
            galleryContent.appendChild(galleryGrid);
        }

        // 移除"no images"消息
        const noImagesMsg = galleryContent.querySelector('.no-images');
        if (noImagesMsg) {
            noImagesMsg.remove();
        }

        // 创建新的gallery item
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        // 创建图片元素
        const img = document.createElement('img');
        img.src = result.url;
        img.alt = 'Generated Image';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '10px';
        img.style.cursor = 'pointer';
        
        // 添加加载状态处理
        img.onload = () => {
            console.log('✅ Gallery image loaded:', result.url);
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            console.error('❌ Gallery image failed to load:', result.url);
            img.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.textContent = '❌ Image failed to load';
            errorMsg.style.color = '#ff4444';
            errorMsg.style.padding = '20px';
            errorMsg.style.textAlign = 'center';
            galleryItem.appendChild(errorMsg);
        };
        
        img.style.opacity = '0.5'; // 初始加载状态
        
        // 点击图片放大查看
        img.onclick = () => {
            window.open(result.url, '_blank');
        };
        
        // 创建信息区域
        const itemInfo = document.createElement('div');
        itemInfo.className = 'gallery-item-info';
        itemInfo.style.padding = '10px';
        itemInfo.style.background = 'rgba(0,0,0,0.5)';
        itemInfo.style.borderRadius = '0 0 10px 10px';
        
        const title = document.createElement('h4');
        title.textContent = 'Generated Image';
        title.style.margin = '0 0 5px 0';
        title.style.color = '#fff';
        title.style.fontSize = '0.9rem';
        
        const timestamp = document.createElement('p');
        timestamp.textContent = new Date().toLocaleString();
        timestamp.style.margin = '0';
        timestamp.style.color = '#ccc';
        timestamp.style.fontSize = '0.8rem';
        
        itemInfo.appendChild(title);
        itemInfo.appendChild(timestamp);
        
        galleryItem.appendChild(img);
        galleryItem.appendChild(itemInfo);
        
        // 添加到gallery grid的开头（最新的在前面）
        galleryGrid.insertBefore(galleryItem, galleryGrid.firstChild);
        
        console.log('✅ Gallery item added successfully');
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