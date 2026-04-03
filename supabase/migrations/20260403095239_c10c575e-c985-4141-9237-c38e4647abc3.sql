
CREATE TABLE public.default_app_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.default_app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read default app data"
ON public.default_app_data
FOR SELECT
TO anon, authenticated
USING (true);
