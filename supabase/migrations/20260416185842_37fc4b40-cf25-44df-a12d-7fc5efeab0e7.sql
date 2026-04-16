CREATE TABLE public.patient_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender SMALLINT NOT NULL,
  height NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  ap_hi INTEGER NOT NULL,
  ap_lo INTEGER NOT NULL,
  cholesterol SMALLINT NOT NULL,
  gluc SMALLINT NOT NULL,
  smoke SMALLINT NOT NULL,
  alco SMALLINT NOT NULL,
  active SMALLINT NOT NULL,
  bmi NUMERIC NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_tier TEXT NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own records"
  ON public.patient_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own records"
  ON public.patient_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own records"
  ON public.patient_records FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_patient_records_user_created
  ON public.patient_records (user_id, created_at DESC);