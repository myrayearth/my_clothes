-- =========================================================================
-- Migration: Isolate Guest Mode and Secure Supabase RLS with user_id Binding
-- File: supabase/migrations/isolate_guest_and_secure_rls.sql
-- =========================================================================

-- 1. outfit_logs 테이블에 user_id 컬럼 추가 (auth.users 외래키 바인딩 가능)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'outfit_logs' 
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.outfit_logs ADD COLUMN user_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_outfit_logs_user_id ON public.outfit_logs(user_id);
    END IF;
END $$;

-- 2. outfit_logs 인덱스 최적화: user_id + target_temp 복합 인덱스 (리콜 범위 검색 가속)
CREATE INDEX IF NOT EXISTS idx_outfit_logs_user_target_temp 
ON public.outfit_logs(user_id, target_temp, created_at DESC);

-- 3. outfit_logs RLS 활성화
ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

-- 기존 관대한 익명 정책 제거
DROP POLICY IF EXISTS "Allow anon all on outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Allow all on outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Users can read own outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Users can insert own outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Users can update own outfit_logs" ON public.outfit_logs;
DROP POLICY IF EXISTS "Users can delete own outfit_logs" ON public.outfit_logs;

-- [보안 정책 1] SELECT: 본인의 user_id 기록만 조회 가능 (관리자는 전체 조회 가능)
CREATE POLICY "Users can read own outfit_logs"
ON public.outfit_logs
FOR SELECT
USING (
    auth.uid()::text = user_id 
    OR auth.jwt()->>'email' = 'ray0412@kakao.com'
);

-- [보안 정책 2] INSERT: 본인의 user_id로만 데이터 삽입 가능
CREATE POLICY "Users can insert own outfit_logs"
ON public.outfit_logs
FOR INSERT
WITH CHECK (
    auth.uid()::text = user_id 
    OR auth.jwt()->>'email' = 'ray0412@kakao.com'
);

-- [보안 정책 3] UPDATE: 본인의 user_id로 작성된 기록만 수정 가능
CREATE POLICY "Users can update own outfit_logs"
ON public.outfit_logs
FOR UPDATE
USING (
    auth.uid()::text = user_id 
    OR auth.jwt()->>'email' = 'ray0412@kakao.com'
)
WITH CHECK (
    auth.uid()::text = user_id 
    OR auth.jwt()->>'email' = 'ray0412@kakao.com'
);

-- [보안 정책 4] DELETE: 본인의 user_id로 작성된 기록만 삭제 가능
CREATE POLICY "Users can delete own outfit_logs"
ON public.outfit_logs
FOR DELETE
USING (
    auth.uid()::text = user_id 
    OR auth.jwt()->>'email' = 'ray0412@kakao.com'
);

-- 4. 게스트 모드 안내 주석:
-- 비로그인(게스트) 사용자는 Supabase 클라이언트를 거치지 않고
-- 100% 브라우저 LocalStorage('weather_outfit_logs_v3')에만 격리 보관되므로
-- 익명 키(anon key)를 통한 타인 데이터 변조 및 DB 오염이 원천적으로 차단됩니다.
