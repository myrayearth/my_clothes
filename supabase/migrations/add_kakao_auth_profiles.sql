-- Migration: profiles 테이블에 카카오 연동을 위한 avatar_url, email 컬럼 추가
-- 파일 경로: supabase/migrations/add_kakao_auth_profiles.sql

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
