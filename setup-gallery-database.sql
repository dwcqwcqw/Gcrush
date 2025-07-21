-- 创建用户图片画廊表
CREATE TABLE IF NOT EXISTS user_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    filename TEXT,
    prompt TEXT,
    negative_prompt TEXT,
    character_name TEXT,
    character_id UUID,
    seed BIGINT,
    generation_params JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_gallery_user_id ON user_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gallery_created_at ON user_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_gallery_character_id ON user_gallery(character_id);

-- 启用RLS (Row Level Security)
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户只能看到自己的图片
CREATE POLICY "Users can view own gallery images" ON user_gallery
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gallery images" ON user_gallery
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery images" ON user_gallery
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gallery images" ON user_gallery
    FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_gallery_updated_at 
    BEFORE UPDATE ON user_gallery 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 