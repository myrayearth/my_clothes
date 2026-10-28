-- Migration: Bidirectional Sync between temperature_evaluations and outfit_logs
-- File: supabase/migrations/sync_evaluations_with_outfit_logs.sql

-- 1. DELETE 트리거: temperature_evaluations에서 삭제 시 outfit_logs도 함께 삭제
CREATE OR REPLACE FUNCTION public.sync_temp_eval_delete_to_outfit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.outfit_logs
    WHERE id = OLD.id
       OR (user_name = OLD.user_name AND created_at = OLD.created_at)
       OR (user_name = OLD.user_name AND target_temp = OLD.target_temp AND time_slot = OLD.time_slot AND score = OLD.score);
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_temp_eval_delete ON public.temperature_evaluations;
CREATE TRIGGER trg_temp_eval_delete
AFTER DELETE ON public.temperature_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.sync_temp_eval_delete_to_outfit_logs();

-- 2. UPDATE 트리거: temperature_evaluations 수정 시 outfit_logs도 동기화 갱신
CREATE OR REPLACE FUNCTION public.sync_temp_eval_update_to_outfit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.outfit_logs
    SET 
        target_temp = NEW.target_temp,
        apparent_temp = NEW.apparent_temp,
        score = NEW.score,
        condition = NEW.condition,
        memo = NEW.memo,
        selected_outer = NEW.selected_outer,
        selected_top = NEW.selected_top,
        selected_bottom = NEW.selected_bottom,
        selected_items = NEW.selected_items
    WHERE id = NEW.id
       OR (user_name = NEW.user_name AND created_at = NEW.created_at);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_temp_eval_update ON public.temperature_evaluations;
CREATE TRIGGER trg_temp_eval_update
AFTER UPDATE ON public.temperature_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.sync_temp_eval_update_to_outfit_logs();

-- 3. outfit_logs 테이블과 temperature_evaluations 데이터 불일치 정리 (기존 고아 데이터 삭제)
DELETE FROM public.outfit_logs
WHERE user_name = '레이'
  AND target_temp = 3.0;

-- 4. PostgREST 스키마 리로드
NOTIFY pgrst, 'reload schema';
