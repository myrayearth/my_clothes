-- Migration: Update score range constraint (-5 to +5) and rating column
-- File: supabase/migrations/update_score_range_and_rating.sql

-- 1. score 컬럼 check 제약조건 확실화 (-5 ~ +5)
ALTER TABLE public.temperature_evaluations DROP CONSTRAINT IF EXISTS temperature_evaluations_score_check;
ALTER TABLE public.temperature_evaluations ADD CONSTRAINT temperature_evaluations_score_check CHECK (score BETWEEN -5 AND 5);

ALTER TABLE public.outfit_logs DROP CONSTRAINT IF EXISTS outfit_logs_score_check;
ALTER TABLE public.outfit_logs ADD CONSTRAINT outfit_logs_score_check CHECK (score BETWEEN -5 AND 5);

-- 2. rating 컬럼 호환성 지원 (score와 동기화)
ALTER TABLE public.temperature_evaluations ADD COLUMN IF NOT EXISTS rating INT;
UPDATE public.temperature_evaluations SET rating = score WHERE rating IS NULL;

ALTER TABLE public.temperature_evaluations DROP CONSTRAINT IF EXISTS temperature_evaluations_rating_check;
ALTER TABLE public.temperature_evaluations ADD CONSTRAINT temperature_evaluations_rating_check CHECK (rating IS NULL OR (rating BETWEEN -5 AND 5));

-- 3. rating 컬럼 자동 동기화 트리거
CREATE OR REPLACE FUNCTION public.sync_temp_eval_rating_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.score IS NOT NULL AND NEW.rating IS NULL THEN
        NEW.rating := NEW.score;
    ELSIF NEW.rating IS NOT NULL AND NEW.score IS NULL THEN
        NEW.score := NEW.rating;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_temp_eval_rating_score ON public.temperature_evaluations;
CREATE TRIGGER trg_temp_eval_rating_score
BEFORE INSERT OR UPDATE ON public.temperature_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.sync_temp_eval_rating_score();

-- 4. get_temperature_aggregated_recommendations RPC 함수 개편 (-5 ~ +5 점수 체계에 맞춘 적합도 산출)
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
                WHEN score = 0 THEN 5
                WHEN ABS(score) = 1 THEN 4
                WHEN ABS(score) = 2 THEN 3
                WHEN ABS(score) = 3 THEN 2
                WHEN ABS(score) = 4 THEN 1
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
        LIMIT 6
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

NOTIFY pgrst, 'reload schema';
