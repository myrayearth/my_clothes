-- gender 컬럼 추가 (남성/여성 선택 기능 지원)
ALTER TABLE public.outfit_logs ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.temperature_evaluations ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
