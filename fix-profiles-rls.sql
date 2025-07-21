-- 修复profiles表RLS策略
-- 允许前端查询用户profiles信息

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 允许anon角色查看profiles数据（用于前端）
CREATE POLICY "API can select profiles" ON profiles
    FOR SELECT 
    TO anon
    USING (true);

-- 允许anon角色插入profiles数据（用于API）
CREATE POLICY "API can insert profiles" ON profiles
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- 允许anon角色更新profiles数据（用于API）
CREATE POLICY "API can update profiles" ON profiles
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);

-- 如果用户已认证，允许管理自己的profile
CREATE POLICY "Authenticated users can manage own profile" ON profiles
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 确保RLS启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'; 