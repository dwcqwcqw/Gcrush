-- 修复user_gallery表的RLS策略
-- 允许API使用anon key插入数据

-- 首先删除现有的严格策略
DROP POLICY IF EXISTS "Users can insert own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can view own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can update own gallery images" ON user_gallery;
DROP POLICY IF EXISTS "Users can delete own gallery images" ON user_gallery;

-- 创建更宽松的策略，允许anon用户操作
-- 插入策略：允许anon用户插入任何数据
CREATE POLICY "Allow anon insert to user_gallery" ON user_gallery
    FOR INSERT 
    WITH CHECK (true);

-- 查看策略：允许anon用户查看任何数据
CREATE POLICY "Allow anon select from user_gallery" ON user_gallery
    FOR SELECT 
    USING (true);

-- 更新策略：允许anon用户更新任何数据
CREATE POLICY "Allow anon update user_gallery" ON user_gallery
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 删除策略：允许anon用户删除任何数据
CREATE POLICY "Allow anon delete from user_gallery" ON user_gallery
    FOR DELETE 
    USING (true);

-- 确保RLS仍然启用
ALTER TABLE user_gallery ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_gallery'; 