CREATE TABLE public.plant_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_id uuid NOT NULL REFERENCES public.plant_identifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL CHECK (char_length(content) <= 20000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plant_ai_messages_ident_idx ON public.plant_ai_messages(identification_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.plant_ai_messages TO authenticated;
GRANT ALL ON public.plant_ai_messages TO service_role;
ALTER TABLE public.plant_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read plant chat" ON public.plant_ai_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.plant_identifications p WHERE p.id = identification_id AND p.user_id = auth.uid()));
CREATE POLICY "Owners add plant chat" ON public.plant_ai_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.plant_identifications p WHERE p.id = identification_id AND p.user_id = auth.uid()));
CREATE POLICY "Owners delete plant chat" ON public.plant_ai_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());