CREATE TABLE IF NOT EXISTS public.admin_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  post_type TEXT NOT NULL CHECK (post_type IN ('announcement','advertisement','event','community_info','featured_listing','safety_notice')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  location_text TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_feed_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.admin_feed_posts TO authenticated;
ALTER TABLE public.admin_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active admin posts readable" ON public.admin_feed_posts
  FOR SELECT TO anon, authenticated
  USING (active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

CREATE POLICY "admins read all admin posts" ON public.admin_feed_posts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins create admin posts" ON public.admin_feed_posts
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update admin posts" ON public.admin_feed_posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
