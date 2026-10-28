-- Migration: profiles 테이블 생성 및 RLS 정책 전면 오픈 (익명 접근 SELECT, INSERT, UPDATE, DELETE 허용)
-- 파일 경로: supabase/migrations/allow_anon_profiles_rls.sql

-- 1. profiles 테이블 생성 (존재하지 않을 경우)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. profiles 테이블 RLS 활성화 및 익명(anon) CRUD 정책 오픈
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert to profiles" ON public.profiles;

CREATE POLICY "Allow anon select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete profiles" ON public.profiles FOR DELETE USING (true);

-- 3. outfit_logs 테이블 업데이트 및 삭제 RLS 정책 추가 (사용자 이름 변경 및 삭제 연동 지원)
DROP POLICY IF EXISTS "Allow anon update outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Allow anon delete outfit_logs" ON public.outfit_logs;

CREATE POLICY "Allow anon update outfit_logs" ON public.outfit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete outfit_logs" ON public.outfit_logs FOR DELETE USING (true);
