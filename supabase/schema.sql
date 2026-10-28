-- Supabase Schema for Weather Outfit
-- 테이블명: outfit_logs

-- 1. UUID 확장 모듈 (필요 시)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. outfit_logs 테이블 생성
CREATE TABLE IF NOT EXISTS public.outfit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    location_name TEXT NOT NULL,
    target_temp NUMERIC(4, 1) NOT NULL,
    apparent_temp NUMERIC(4, 1) NOT NULL,
    time_slot TEXT NOT NULL,                         -- '08:00', '13:00', '19:00' (또는 morning, noon, evening)
    selected_outer TEXT NOT NULL DEFAULT '없음',
    selected_top TEXT NOT NULL,
    selected_bottom TEXT NOT NULL,
    selected_items TEXT[] DEFAULT ARRAY[]::TEXT[],   -- 소품 배열
    score INT NOT NULL CHECK (score BETWEEN -5 AND 5), -- 체감 온도 편차: -5°C(매우 추움) ~ 0°C(적정) ~ +5°C(매우 더움)
    condition TEXT NOT NULL DEFAULT '정상',           -- '정상', '피곤', '감기', '활동량많음'
    memo TEXT
);

-- 3. 빠른 기온 범위 검색을 위한 B-Tree 인덱스
CREATE INDEX IF NOT EXISTS idx_outfit_logs_target_temp ON public.outfit_logs (target_temp);
CREATE INDEX IF NOT EXISTS idx_outfit_logs_created_at ON public.outfit_logs (created_at DESC);

-- 4. Row Level Security (RLS) 설정
ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

-- 익명 사용자 읽기 허용 정책
CREATE POLICY "Allow public read access to outfit_logs"
ON public.outfit_logs FOR SELECT
USING (true);

-- 익명 사용자 쓰기 허용 정책
CREATE POLICY "Allow public insert to outfit_logs"
ON public.outfit_logs FOR INSERT
WITH CHECK (true);
