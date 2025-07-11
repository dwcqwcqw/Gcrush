-- Fix RLS policy to allow anonymous access to characters table
-- Run this in your Supabase SQL Editor

-- Option 1: Allow both authenticated and anonymous users
DROP POLICY IF EXISTS "Characters are viewable by authenticated users" ON public.characters;

CREATE POLICY "Characters are viewable by all users" 
ON public.characters 
FOR SELECT 
USING (true);

-- Option 2: If you want to keep it simple, you can also disable RLS entirely
-- ALTER TABLE public.characters DISABLE ROW LEVEL SECURITY;

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'characters'; 