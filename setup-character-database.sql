-- =====================================================
-- Gcrush Virtual Character Database Setup
-- 虚拟角色聊天网站数据库结构
-- =====================================================

-- 1. 角色卡表 (Characters Table)
-- 存储所有虚拟角色的基本信息和人设
CREATE TABLE IF NOT EXISTS characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number INTEGER UNIQUE NOT NULL, -- 角色编号 (1-12)
    name VARCHAR(100) NOT NULL, -- 角色名称
    style VARCHAR(100), -- 角色风格/类型
    age INTEGER, -- 角色年龄
    system_prompt TEXT NOT NULL, -- 系统提示词/人设核心
    situation TEXT, -- 角色所处情境/背景
    greeting TEXT NOT NULL, -- 角色问候语/开场白
    description TEXT, -- 角色详细描述
    tag1 VARCHAR(50), -- 标签1
    tag2 VARCHAR(50), -- 标签2  
    tag3 VARCHAR(50), -- 标签3
    voice VARCHAR(100), -- 语音设置/声音类型
    images TEXT[], -- 角色图片URLs数组
    videos TEXT[], -- 角色视频URLs数组
    is_active BOOLEAN DEFAULT true, -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 聊天会话表 (Chat Sessions)
-- 存储用户与角色的聊天会话
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    session_name VARCHAR(200), -- 会话名称(可选)
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0, -- 消息总数
    is_active BOOLEAN DEFAULT true, -- 会话是否活跃
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个用户与每个角色只有一个活跃会话
    UNIQUE(user_id, character_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- 3. 聊天消息表 (Chat Messages)
-- 存储具体的聊天消息记录
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'character', 'system')),
    content TEXT NOT NULL, -- 消息内容
    metadata JSONB, -- 额外元数据(如情感分析、语音信息等)
    is_deleted BOOLEAN DEFAULT false, -- 软删除标记
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户角色偏好表 (User Character Preferences)
-- 存储用户对特定角色的个性化设置
CREATE TABLE IF NOT EXISTS user_character_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    custom_name VARCHAR(100), -- 用户给角色起的自定义名称
    favorite BOOLEAN DEFAULT false, -- 是否收藏
    interaction_count INTEGER DEFAULT 0, -- 互动次数
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    settings JSONB, -- 个性化设置(如语音偏好、对话风格等)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, character_id)
);

-- =====================================================
-- 索引优化 (Indexes for Performance)
-- =====================================================

-- 角色表索引
CREATE INDEX IF NOT EXISTS idx_characters_number ON characters(number);
CREATE INDEX IF NOT EXISTS idx_characters_active ON characters(is_active);
CREATE INDEX IF NOT EXISTS idx_characters_tags ON characters(tag1, tag2, tag3);

-- 聊天会话索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_character ON chat_sessions(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);

-- 聊天消息索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_character ON chat_messages(character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);

-- 用户偏好索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_character_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_character ON user_character_preferences(character_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_favorite ON user_character_preferences(favorite) WHERE favorite = true;

-- =====================================================
-- 触发器 (Triggers for Auto-Updates)
-- =====================================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加自动更新触发器
CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_character_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动更新会话消息计数和最后消息时间的函数
CREATE OR REPLACE FUNCTION update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_sessions 
        SET message_count = message_count + 1,
            last_message_at = NEW.created_at
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_sessions 
        SET message_count = message_count - 1
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为消息表添加统计更新触发器
CREATE TRIGGER update_session_stats_trigger
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_session_stats();

-- =====================================================
-- 行级安全策略 (Row Level Security - RLS)
-- =====================================================

-- 启用行级安全
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_character_preferences ENABLE ROW LEVEL SECURITY;

-- 角色表：所有认证用户都可以读取，只有管理员可以修改
CREATE POLICY "Characters are viewable by authenticated users" 
    ON characters FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Characters are editable by admins only" 
    ON characters FOR ALL 
    TO authenticated 
    USING (auth.jwt() ->> 'role' = 'admin');

-- 聊天会话：用户只能访问自己的会话
CREATE POLICY "Users can view own chat sessions" 
    ON chat_sessions FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" 
    ON chat_sessions FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" 
    ON chat_sessions FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" 
    ON chat_sessions FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 聊天消息：用户只能访问自己的消息
CREATE POLICY "Users can view own chat messages" 
    ON chat_messages FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" 
    ON chat_messages FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" 
    ON chat_messages FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" 
    ON chat_messages FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 用户偏好：用户只能访问自己的偏好设置
CREATE POLICY "Users can manage own character preferences" 
    ON user_character_preferences FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 示例数据插入 (Sample Data for Testing)
-- =====================================================

-- 插入示例角色数据 (你可以根据实际需要修改)
INSERT INTO characters (number, name, style, age, system_prompt, situation, greeting, description, tag1, tag2, tag3, voice) VALUES
(1, '示例角色1', '友善助手', 25, '你是一个友善、乐于助人的AI助手，总是以积极的态度回应用户。', '在一个温馨的咖啡厅里', '你好！很高兴见到你，有什么我可以帮助你的吗？', '一个充满活力和正能量的助手角色', '友善', '助手', '积极', 'female_voice_1'),
(2, '示例角色2', '知识学者', 30, '你是一个博学的学者，擅长各种学术话题的讨论。', '在一个古典的图书馆中', '欢迎来到知识的殿堂，我们今天想探讨什么话题呢？', '一个富有智慧和学识的学者角色', '学者', '知识', '智慧', 'male_voice_1')
ON CONFLICT (number) DO NOTHING;

-- 完成提示
SELECT 'Database setup completed successfully! 数据库设置完成！' AS status; 