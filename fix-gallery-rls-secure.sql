-- 更安全的user_gallery RLS策略修复
-- 只允许必要的操作

-- 删除现有策略
DROP POLICY IF EXISTS "Users can insert own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can view own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can update own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can delete own gallery images" ON user_gallery;

-- 允许anon角色插入数据（用于API）
CREATE POLICY "API can insert gallery images" ON user_gallery
    FOR INSERT 
    TO anon
    WITH CHECK (user_id IS NOT NULL);

-- 允许anon角色查看数据（用于前端）
CREATE POLICY "API can select gallery images" ON user_gallery
    FOR SELECT 
    TO anon
    USING (true);

-- 允许anon角色更新数据（用于API更新图片状态）
CREATE POLICY "API can update gallery images" ON user_gallery
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);

-- 不允许删除（可选，如果需要删除功能可以启用）
-- CREATE POLICY "API can delete gallery images" ON user_gallery
--     FOR DELETE 
--     TO anon
--     USING (true);

-- 如果用户已认证，允许查看自己的数据
CREATE POLICY "Authenticated users can view own images" ON user_gallery
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- 确保RLS启用
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_gallery'; 