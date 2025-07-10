// =====================================================
// Gcrush 角色数据加载器
// Character Data Loader for Dynamic Character Cards
// =====================================================

// Supabase客户端配置
const SUPABASE_URL = 'https://kuflobojizyttadwcbhe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZmxvYm9qaXp5dHRhZHdjYmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MjczMjMsImV4cCI6MjA1MDMwMzMyM30.8fSNvHZQnuOYxLzBZq9fSgJJ4Hl5KrJJgJhkpGMmKYs';

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 角色数据管理类
class CharacterDataLoader {
    constructor() {
        this.characters = [];
        this.isLoading = false;
        this.hasError = false;
        this.errorMessage = '';
    }

    // 从数据库加载角色数据
    async loadCharacters() {
        this.isLoading = true;
        this.hasError = false;
        
        try {
            console.log('正在从数据库加载角色数据...');
            
            const { data, error } = await supabase
                .from('characters')
                .select('*')
                .eq('is_active', true)
                .order('number', { ascending: true });

            if (error) {
                throw new Error(`数据库查询错误: ${error.message}`);
            }

            if (!data || data.length === 0) {
                console.warn('数据库中没有找到角色数据，使用默认数据');
                this.characters = this.getDefaultCharacters();
            } else {
                console.log(`成功加载${data.length}个角色数据`);
                this.characters = data;
            }

            this.isLoading = false;
            return this.characters;
            
        } catch (error) {
            console.error('加载角色数据失败:', error);
            this.hasError = true;
            this.errorMessage = error.message;
            this.isLoading = false;
            
            // 发生错误时使用默认数据
            console.log('使用默认角色数据作为后备方案');
            this.characters = this.getDefaultCharacters();
            return this.characters;
        }
    }

    // 获取默认角色数据（基于现有HTML中的信息）
    getDefaultCharacters() {
        return [
            {
                number: 1,
                name: 'Alex',
                age: 21,
                description: 'College student exploring his identity, athletic swimmer with a curious mind...',
                tag1: 'Athletic',
                tag2: 'Student',
                tag3: 'Curious',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Alex/Alex1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Alex/Alex1.mov']
            },
            {
                number: 2,
                name: 'Bruno',
                age: 45,
                description: 'Mature Latin bear, protective daddy with a commanding presence...',
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
                age: 24,
                description: 'Tech geek with a submissive side, loves gaming and coding...',
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
                age: 27,
                description: 'Fitness influencer with perfect physique, motivational and energetic...',
                tag1: 'Fitness',
                tag2: 'Motivational',
                tag3: 'Energetic',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Mason/Mason1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Mason/Mason1.mov']
            },
            {
                number: 11,
                name: 'Rohan',
                age: 32,
                description: 'Indian tech professional, spiritual and thoughtful with cultural depth...',
                tag1: 'Spiritual',
                tag2: 'Thoughtful',
                tag3: 'Cultural',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Rohan/Rohan1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Rohan/Rohan1.mov']
            },
            {
                number: 12,
                name: 'Terrell',
                age: 36,
                description: 'Powerful black alpha, confident leader with magnetic personality...',
                tag1: 'Powerful',
                tag2: 'Alpha',
                tag3: 'Leader',
                images: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Image/Terrell/Terrell1.png'],
                videos: ['https://pub-a8c0ec3eb521478ab957033bdc7837e9.r2.dev/Video/Terrell/Terrell1.mov']
            }
        ];
    }

    // 生成角色卡HTML
    generateCharacterCard(character) {
        const imageUrl = character.images && character.images.length > 0 ? character.images[0] : '';
        const videoUrl = character.videos && character.videos.length > 0 ? character.videos[0] : '';
        
        // 截取描述文本到最多两行
        const truncatedDescription = this.truncateDescription(character.description || '', 100);
        
        // 生成标签HTML
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

    // 生成标签HTML
    generateTagsHtml(tag1, tag2, tag3) {
        const tags = [tag1, tag2, tag3].filter(tag => tag && tag.trim() !== '');
        
        if (tags.length === 0) return '';
        
        return `
            <div class="character-tags">
                ${tags.map(tag => `<span class="character-tag">${tag}</span>`).join('')}
            </div>
        `;
    }

    // 截取描述文本
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

    // 渲染所有角色卡
    async renderCharacterCards() {
        const characterGrid = document.querySelector('.character-grid');
        
        if (!characterGrid) {
            console.error('未找到角色网格容器 (.character-grid)');
            return;
        }

        // 显示加载状态
        characterGrid.innerHTML = '<div class="loading-message">正在加载角色数据...</div>';

        try {
            // 加载角色数据
            await this.loadCharacters();

            // 生成角色卡HTML
            const characterCardsHtml = this.characters.map(character => 
                this.generateCharacterCard(character)
            ).join('');

            // 插入到页面
            characterGrid.innerHTML = characterCardsHtml;

            // 重新初始化视频悬停效果
            if (typeof initCharacterVideoHover === 'function') {
                initCharacterVideoHover();
            }

            console.log('角色卡渲染完成');
            
        } catch (error) {
            console.error('渲染角色卡失败:', error);
            characterGrid.innerHTML = `
                <div class="error-message">
                    <p>加载角色数据失败</p>
                    <p>${this.errorMessage}</p>
                    <button onclick="characterLoader.renderCharacterCards()" class="retry-btn">重试</button>
                </div>
            `;
        }
    }

    // 根据姓名查找角色
    findCharacterByName(name) {
        return this.characters.find(character => 
            character.name.toLowerCase() === name.toLowerCase()
        );
    }

    // 获取所有角色
    getAllCharacters() {
        return this.characters;
    }
}

// 创建全局实例
const characterLoader = new CharacterDataLoader();

// 页面加载完成后自动渲染角色卡
document.addEventListener('DOMContentLoaded', () => {
    characterLoader.renderCharacterCards();
});

// 导出给其他模块使用
window.CharacterDataLoader = CharacterDataLoader;
window.characterLoader = characterLoader; 