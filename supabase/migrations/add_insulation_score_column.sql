-- total_insulation_score 컬럼 추가 (의류 아이템별 보온 수치 점수 기록)
ALTER TABLE public.outfit_logs ADD COLUMN IF NOT EXISTS total_insulation_score NUMERIC DEFAULT 0;
ALTER TABLE public.temperature_evaluations ADD COLUMN IF NOT EXISTS total_insulation_score NUMERIC DEFAULT 0;
