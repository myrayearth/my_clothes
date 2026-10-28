-- Migration: Update Guest Evaluations RLS and Aggregate Dynamic Recommendation Function
-- File: supabase/migrations/update_guest_evaluations_and_rls.sql

-- 1. temperature_evaluations 테이블 user_id 외래키 널 허용 확인 (비로그인 게스트 평가 지원)
ALTER TABLE public.temperature_evaluations ALTER COLUMN user_id DROP NOT NULL;

-- 2. temperature_evaluations RLS 정책 개편:
-- 비로그인(게스트/anon) 및 로그인 사용자 누구나 평가를 DB에 INSERT할 수 있도록 허용
DROP POLICY IF EXISTS "Admin insert temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Allow all insert temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Allow anon insert temperature_evaluations" ON public.temperature_evaluations;

CREATE POLICY "Allow all insert temperature_evaluations"
ON public.temperature_evaluations
FOR INSERT
WITH CHECK (true);

-- 3. 전체 평가 데이터 집계 및 조회를 위해 SELECT 정책 오픈 (게스트 + 로그인 전체 통합 분석)
DROP POLICY IF EXISTS "Admin select temperature_evaluations" ON public.temperature_evaluations;
DROP POLICY IF EXISTS "Allow all select temperature_evaluations" ON public.temperature_evaluations;

CREATE POLICY "Allow all select temperature_evaluations"
ON public.temperature_evaluations
FOR SELECT
USING (true);

-- 4. UPDATE 및 DELETE는 여전히 관리자(is_admin)만 가능하도록 엄격히 유지
-- (Admin update temperature_evaluations 및 Admin delete temperature_evaluations 유지)

-- 5. 기온별 누적 평가 데이터 기반 추천 아이템 집계 함수 (PostgreSQL Security Definer RPC)
-- 기준 기온(target_temp +- 3도 범위) 내 누적된 모든 평가(게스트 포함)를 분석하여
-- 적합도 점수(score=0: +2점, score=+-1: +1점, score=+-2: 0점)를 계산하고 상위 추천 목록 반환
CREATE OR REPLACE FUNCTION public.get_temperature_aggregated_recommendations(
    target_temperature NUMERIC,
    temp_tolerance NUMERIC DEFAULT 3.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH filtered_evals AS (
        SELECT 
            selected_outer,
            selected_top,
            selected_bottom,
            selected_items,
            CASE 
                WHEN score = 0 THEN 2
                WHEN ABS(score) = 1 THEN 1
                ELSE 0
            END AS suitability
        FROM public.temperature_evaluations
        WHERE ABS(target_temp - target_temperature) <= temp_tolerance
    ),
    outer_stats AS (
        SELECT 
            selected_outer AS item_name,
            COUNT(*) AS eval_count,
            ROUND(AVG(suitability)::numeric, 2) AS avg_suitability,
            SUM(suitability) AS total_score
        FROM filtered_evals
        WHERE selected_outer IS NOT NULL AND selected_outer <> '없음' AND selected_outer <> ''
        GROUP BY selected_outer
        ORDER BY total_score DESC, avg_suitability DESC, eval_count DESC
        LIMIT 5
    ),
    top_stats AS (
        SELECT 
            top_item AS item_name,
            COUNT(*) AS eval_count,
            ROUND(AVG(suitability)::numeric, 2) AS avg_suitability,
            SUM(suitability) AS total_score
        FROM filtered_evals,
        LATERAL UNNEST(selected_top) AS top_item
        WHERE top_item IS NOT NULL AND top_item <> ''
        GROUP BY top_item
        ORDER BY total_score DESC, avg_suitability DESC, eval_count DESC
        LIMIT 6
    ),
    bottom_stats AS (
        SELECT 
            bottom_item AS item_name,
            COUNT(*) AS eval_count,
            ROUND(AVG(suitability)::numeric, 2) AS avg_suitability,
            SUM(suitability) AS total_score
        FROM filtered_evals,
        LATERAL UNNEST(selected_bottom) AS bottom_item
        WHERE bottom_item IS NOT NULL AND bottom_item <> ''
        GROUP BY bottom_item
        ORDER BY total_score DESC, avg_suitability DESC, eval_count DESC
        LIMIT 6
    ),
    items_stats AS (
        SELECT 
            acc_item AS item_name,
            COUNT(*) AS eval_count,
            ROUND(AVG(suitability)::numeric, 2) AS avg_suitability,
            SUM(suitability) AS total_score
        FROM filtered_evals,
        LATERAL UNNEST(selected_items) AS acc_item
        WHERE acc_item IS NOT NULL AND acc_item <> ''
        GROUP BY acc_item
        ORDER BY total_score DESC, avg_suitability DESC, eval_count DESC
        LIMIT 6
    )
    SELECT jsonb_build_object(
        'target_temp', target_temperature,
        'total_eval_count', (SELECT COUNT(*) FROM filtered_evals),
        'outers', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', item_name, 'score', avg_suitability, 'count', eval_count)) FROM outer_stats), '[]'::jsonb),
        'tops', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', item_name, 'score', avg_suitability, 'count', eval_count)) FROM top_stats), '[]'::jsonb),
        'bottoms', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', item_name, 'score', avg_suitability, 'count', eval_count)) FROM bottom_stats), '[]'::jsonb),
        'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', item_name, 'score', avg_suitability, 'count', eval_count)) FROM items_stats), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_temperature_aggregated_recommendations TO anon, authenticated, service_role;

-- 6. PostgREST 스키마 리로드
NOTIFY pgrst, 'reload schema';
