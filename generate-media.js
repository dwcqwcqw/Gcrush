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
                    .select('id, name, description, prompt, images')
                    .order('number');

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
            return;
        }

        // 检查用户登录状态
        const user = await this.checkUserAuthentication();
        if (!user) {
            // 使用默认的登录框
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.click();
            }
            return;
        }

        this.isGenerating = true;
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
                user_id: user.id,
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

            // 显示结果到原有的gallery系统
            for (const imageData of result.images) {
                const galleryResult = {
                    type: 'image',
                    url: imageData.url,
                    prompt: finalPrompt,
                    negativePrompt: negativePrompt,
                    timestamp: imageData.created_at,
                    seed: imageData.seed
                };
                this.showGenerationResult(galleryResult);
            }
            
            this.hideGenerationProgress();
            this.showSuccessMessage();

        } catch (error) {
            console.error('❌ Error generating media:', error);
            this.hideGenerationProgress();
            alert(`Failed to generate media: ${error.message}`);
        } finally {
            this.isGenerating = false;
        }
    }

    // 检查用户认证状态
    async checkUserAuthentication() {
        try {
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                return user;
            }
            return null;
        } catch (error) {
            console.error('❌ Auth check error:', error);
            return null;
        }
    }



    // 处理角色选择
    handleCharacterSelection(character) {
        console.log('👤 Character selected:', character);
        
        // 从角色的prompt字段中获取内容并填充到custom prompt
        if (character && character.prompt) {
            const customPromptField = document.getElementById('custom-prompt');
            if (customPromptField) {
                customPromptField.value = character.prompt;
            }
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
            // 创建加载状态元素
            const loadingElement = document.createElement('div');
            loadingElement.id = 'generation-progress';
            loadingElement.className = 'generation-progress';
            loadingElement.innerHTML = `
                <div class="progress-spinner"></div>
                <div class="progress-text">
                    <h3>Generating Your Images...</h3>
                    <p>Please wait, this usually takes less than 1 minute.</p>
                </div>
            `;
            
            // 如果有"no images"消息，先移除
            const noImagesMsg = galleryContent.querySelector('.no-images');
            if (noImagesMsg) {
                noImagesMsg.remove();
            }
            
            // 添加到gallery content的开头
            galleryContent.insertBefore(loadingElement, galleryContent.firstChild);
        }
    }

    hideGenerationProgress() {
        const progressElement = document.getElementById('generation-progress');
        if (progressElement) {
            progressElement.remove();
        }
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