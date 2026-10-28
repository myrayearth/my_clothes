-- Migration: Admin RBAC & Temperature Evaluations Table
-- File: supabase/migrations/add_admin_rbac_evaluations.sql

-- 1. profiles 테이블에 role 컬럼 추가 (기본값 'user')
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. temperature_evaluations 테이블 생성
CREATE TABLE IF NOT EXISTS public.temperature_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL DEFAULT '기본 사용자',
    location_name TEXT NOT NULL,
    target_temp NUMERIC(4, 1) NOT NULL,
    apparent_temp NUMERIC(4, 1) NOT NULL,
    time_slot TEXT NOT NULL,                         -- '08:00', '13:00', '19:00'
    selected_outer TEXT NOT NULL DEFAULT '없음',
    selected_top TEXT[] DEFAULT ARRAY[]::TEXT[],
    selected_bottom TEXT[] DEFAULT ARRAY[]::TEXT[],
    selected_items TEXT[] DEFAULT ARRAY[]::TEXT[],
    score INT NOT NULL CHECK (score BETWEEN -5 AND 5), -- 체감 온도 편차 (-5°C ~ +5°C)
    condition TEXT NOT NULL DEFAULT '정상',           -- '정상', '피곤', '감기', '활동량많음'
    memo TEXT
);

-- 3. 검색 및 필터 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_temp_eval_target_temp ON public.temperature_evaluations (target_temp);
CREATE INDEX IF NOT EXISTS idx_temp_eval_created_at ON public.temperature_evaluations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_temp_eval_score ON public.temperature_evaluations (score);
CREATE INDEX IF NOT EXISTS idx_temp_eval_user_name ON public.temperature_evaluations (user_name);

-- 4. 관리자 판별 함수 is_admin(user_id) 생성 (Security Definer)
-- ray0412@kakao.com 이메일 또는 카카오 메타데이터 / profiles 역할 기준 판별
CREATE OR REPLACE FUNCTION public.is_admin(lookup_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_is_admin BOOLEAN := false;
BEGIN
    IF lookup_uid IS NULL THEN
        RETURN false;
    END IF;

    -- a) auth.users의 email, raw_user_meta_data->>'email', raw_app_meta_data 판별
    SELECT EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = lookup_uid
          AND (
            LOWER(COALESCE(u.email, '')) = 'ray0412@kakao.com'
            OR LOWER(COALESCE(u.raw_user_meta_data->>'email', '')) = 'ray0412@kakao.com'
            OR LOWER(COALESCE(u.raw_user_meta_data->'kakao_account'->>'email', '')) = 'ray0412@kakao.com'
            OR LOWER(COALESCE(u.raw_app_meta_data->>'role', '')) = 'admin'
          )
    ) INTO v_is_admin;

    IF v_is_admin THEN
        RETURN true;
    END IF;

    -- b) public.profiles 테이블의 role = 'admin' 또는 email = 'ray0412@kakao.com' 판별
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = lookup_uid
          AND (
            LOWER(COALESCE(p.role, '')) = 'admin'
            OR LOWER(COALESCE(p.email, '')) = 'ray0412@kakao.com'
          )
    ) INTO v_is_admin;

    RETURN v_is_admin;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.is_admin TO anon, authenticated, service_role;

-- 5. RLS(Row Level Security) 활성화 및 관리자 전용 정책 설정
ALTER TABLE public.temperature_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin select temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Admin insert temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Admin update temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Admin delete temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Allow anon select temperature_evaluations" ON public.temperature_evaluations;

-- 오직 관리자(admin) 역할을 가진 사용자만 SELECT 가능
CREATE POLICY "Admin select temperature_evaluations"
ON public.temperature_evaluations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 오직 관리자(admin) 역할을 가진 사용자만 INSERT 가능
CREATE POLICY "Admin insert temperature_evaluations"
ON public.temperature_evaluations
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- 오직 관리자(admin) 역할을 가진 사용자만 UPDATE 가능
CREATE POLICY "Admin update temperature_evaluations"
ON public.temperature_evaluations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 오직 관리자(admin) 역할을 가진 사용자만 DELETE 가능
CREATE POLICY "Admin delete temperature_evaluations"
ON public.temperature_evaluations
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. 기존 outfit_logs 데이터가 있을 경우 temperature_evaluations로 시드 복제 (초기 마이그레이션)
INSERT INTO public.temperature_evaluations (
    created_at, user_name, location_name, target_temp, apparent_temp,
    time_slot, selected_outer, selected_top, selected_bottom, selected_items,
    score, condition, memo
)
SELECT 
    created_at, user_name, location_name, target_temp, apparent_temp,
    time_slot, selected_outer, selected_top, selected_bottom, selected_items,
    score, condition, memo
FROM public.outfit_logs
ON CONFLICT DO NOTHING;

-- 7. 현재 로그인된 카카오 사용자 계정에 관리자 권한 및 ray0412@kakao.com 이메일 연결
UPDATE auth.users
SET 
  email = 'ray0412@kakao.com',
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email": "ray0412@kakao.com"}'::jsonb,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = 'cc4a3175-6560-4a1b-9d6a-1390858fe311'
   OR raw_user_meta_data->>'provider_id' = '5157761129';

UPDATE public.profiles
SET 
  email = 'ray0412@kakao.com',
  role = 'admin'
WHERE id = 'cc4a3175-6560-4a1b-9d6a-1390858fe311'
   OR name = '레이';

-- 8. PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
