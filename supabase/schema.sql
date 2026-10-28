-- Supabase Full Schema for Weather Outfit (v0.1.0)
-- 테이블: profiles, outfit_logs

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO public.profiles (name)
VALUES ('기본 사용자')
ON CONFLICT (name) DO NOTHING;

-- 2. outfit_logs 테이블
CREATE TABLE IF NOT EXISTS public.outfit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_name TEXT NOT NULL DEFAULT '기본 사용자',      -- 사용자 프로필명
    location_name TEXT NOT NULL,
    target_temp NUMERIC(4, 1) NOT NULL,
    apparent_temp NUMERIC(4, 1) NOT NULL,
    time_slot TEXT NOT NULL,                         -- '08:00', '13:00', '19:00'
    selected_outer TEXT NOT NULL DEFAULT '없음',
    selected_top TEXT[] DEFAULT ARRAY[]::TEXT[],     -- 상의 다중 선택 배열
    selected_bottom TEXT[] DEFAULT ARRAY[]::TEXT[],  -- 하의 다중 선택 배열
    selected_items TEXT[] DEFAULT ARRAY[]::TEXT[],   -- 소품 배열
    score INT NOT NULL CHECK (score BETWEEN -5 AND 5), -- 체감 온도 편차 (-5°C ~ +5°C)
    condition TEXT NOT NULL DEFAULT '정상',           -- '정상', '피곤', '감기', '활동량많음'
    memo TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_outfit_logs_user_name_temp ON public.outfit_logs (user_name, target_temp);
CREATE INDEX IF NOT EXISTS idx_outfit_logs_created_at ON public.outfit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles (name);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow public insert to profiles"
ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to outfit_logs"
ON public.outfit_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert to outfit_logs"
ON public.outfit_logs FOR INSERT WITH CHECK (true);
