ALTER TABLE public.exam_sets ADD COLUMN IF NOT EXISTS rubric_text text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric_score numeric;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric_criterion text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric_notes text;