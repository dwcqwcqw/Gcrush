-- Fix RLS policies for anonymous users in Gcrush chat system
-- Run this script in Supabase SQL Editor

-- Allow anonymous users to read characters
DROP POLICY IF EXISTS "Characters are viewable by anonymous users" ON characters;
CREATE POLICY "Characters are viewable by anonymous users" 
    ON characters FOR SELECT 
    TO anon 
    USING (true);

-- Allow anonymous users to manage chat sessions
DROP POLICY IF EXISTS "Anonymous users can view chat sessions" ON chat_sessions;
CREATE POLICY "Anonymous users can view chat sessions" 
    ON chat_sessions FOR SELECT 
    TO anon 
    USING (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can create chat sessions" ON chat_sessions;
CREATE POLICY "Anonymous users can create chat sessions" 
    ON chat_sessions FOR INSERT 
    TO anon 
    WITH CHECK (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can update chat sessions" ON chat_sessions;
CREATE POLICY "Anonymous users can update chat sessions" 
    ON chat_sessions FOR UPDATE 
    TO anon 
    USING (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can delete chat sessions" ON chat_sessions;
CREATE POLICY "Anonymous users can delete chat sessions" 
    ON chat_sessions FOR DELETE 
    TO anon 
    USING (user_id = 'anonymous');

-- Allow anonymous users to manage chat messages
DROP POLICY IF EXISTS "Anonymous users can view chat messages" ON chat_messages;
CREATE POLICY "Anonymous users can view chat messages" 
    ON chat_messages FOR SELECT 
    TO anon 
    USING (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can create chat messages" ON chat_messages;
CREATE POLICY "Anonymous users can create chat messages" 
    ON chat_messages FOR INSERT 
    TO anon 
    WITH CHECK (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can update chat messages" ON chat_messages;
CREATE POLICY "Anonymous users can update chat messages" 
    ON chat_messages FOR UPDATE 
    TO anon 
    USING (user_id = 'anonymous');

DROP POLICY IF EXISTS "Anonymous users can delete chat messages" ON chat_messages;
CREATE POLICY "Anonymous users can delete chat messages" 
    ON chat_messages FOR DELETE 
    TO anon 
    USING (user_id = 'anonymous');

-- Grant necessary permissions to anon role
GRANT SELECT ON characters TO anon;
GRANT ALL ON chat_sessions TO anon;
GRANT ALL ON chat_messages TO anon;

-- Also ensure the existing authenticated user policies remain
-- Characters: authenticated users can still read
CREATE POLICY "Characters are viewable by authenticated users" 
    ON characters FOR SELECT 
    TO authenticated 
    USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('characters', 'chat_sessions', 'chat_messages')
ORDER BY tablename, policyname; 