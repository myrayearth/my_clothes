-- Migration: 사용자 프로필(profiles) 테이블 신설 및 outfit_logs 다중 선택(text[]) 지원
-- 파일 경로: supabase/migrations/update_users_and_multi_select.sql

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 기본 프로필 생성 (기본 사용자)
INSERT INTO public.profiles (name)
VALUES ('기본 사용자')
ON CONFLICT (name) DO NOTHING;

-- 2. outfit_logs 테이블에 user_name 컬럼 추가 (기존 행은 '기본 사용자'로 세팅)
ALTER TABLE public.outfit_logs 
ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '기본 사용자';

UPDATE public.outfit_logs
SET user_name = '기본 사용자'
WHERE user_name IS NULL;

ALTER TABLE public.outfit_logs 
ALTER COLUMN user_name SET NOT NULL;

-- 3. selected_top 컬럼을 text에서 text[]로 안전하게 변환
DO $$
BEGIN
    -- 컬럼 타입이 text인 경우에만 배열로 전환
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outfit_logs' 
        AND column_name = 'selected_top' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.outfit_logs 
        ALTER COLUMN selected_top TYPE TEXT[] 
        USING ARRAY[selected_top];
    END IF;
END $$;

-- 4. selected_bottom 컬럼을 text에서 text[]로 안전하게 변환
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outfit_logs' 
        AND column_name = 'selected_bottom' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.outfit_logs 
        ALTER COLUMN selected_bottom TYPE TEXT[] 
        USING ARRAY[selected_bottom];
    END IF;
END $$;

-- 5. 인덱스 생성 (사용자별 기온 범위 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_outfit_logs_user_name_temp 
ON public.outfit_logs (user_name, target_temp);

CREATE INDEX IF NOT EXISTS idx_profiles_name 
ON public.profiles (name);

-- 6. RLS 정책 업데이트
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);
