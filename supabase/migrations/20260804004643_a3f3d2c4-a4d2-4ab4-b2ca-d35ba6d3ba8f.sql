DROP POLICY IF EXISTS "Users insert own comments" ON public.update_comments;
CREATE POLICY "Users insert own comments" ON public.update_comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (is_agronomist_reply = false OR public.has_role(auth.uid(), 'agronomist'::app_role))
  AND is_ai = false
  AND (pinned = false OR public.has_role(auth.uid(), 'moderator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);