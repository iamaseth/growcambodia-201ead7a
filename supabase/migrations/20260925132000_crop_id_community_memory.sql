-- Crop ID community memory: persistent observations + community knowledge links.
-- Additive only. Existing plant identification and library records remain intact.

ALTER TABLE public.plant_identifications
  ADD COLUMN IF NOT EXISTS is_community_shared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS library_entry_id uuid REFERENCES public.community_knowledge_library(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plant_identifications_library_entry
  ON public.plant_identifications(library_entry_id);
CREATE INDEX IF NOT EXISTS idx_plant_identifications_shared
  ON public.plant_identifications(is_community_shared, created_at DESC);

CREATE TABLE IF NOT EXISTS public.plant_identification_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_id uuid NOT NULL REFERENCES public.plant_identifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  observation_type text NOT NULL DEFAULT 'note'
    CHECK (observation_type IN ('note','photo','community_suggestion','expert_comment','correction','harvest','outcome')),
  body text,
  image_path text,
  suggested_common_name text,
  suggested_scientific_name text,
  accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plant_id_observations_identification
  ON public.plant_identification_observations(identification_id, created_at DESC);

ALTER TABLE public.plant_identification_observations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.plant_identification_observations TO authenticated;
GRANT ALL ON public.plant_identification_observations TO service_role;

CREATE POLICY "owners read identification observations"
  ON public.plant_identification_observations FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.plant_identifications p
      WHERE p.id = identification_id
        AND (p.user_id = auth.uid() OR p.is_community_shared = true)
    )
  );

CREATE POLICY "users add observations to own or shared identifications"
  ON public.plant_identification_observations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.plant_identifications p
      WHERE p.id = identification_id
        AND (p.user_id = auth.uid() OR p.is_community_shared = true)
    )
  );

CREATE POLICY "authors update own observations"
  ON public.plant_identification_observations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON COLUMN public.plant_identifications.is_community_shared IS
  'Explicit opt-in only. Private/formal field-trial evidence must never be auto-published.';
