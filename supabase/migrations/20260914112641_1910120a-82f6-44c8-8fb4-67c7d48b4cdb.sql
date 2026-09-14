GRANT SELECT ON public.community_knowledge_library TO anon;
GRANT SELECT, INSERT, UPDATE ON public.community_knowledge_library TO authenticated;
GRANT ALL ON public.community_knowledge_library TO service_role;

GRANT SELECT ON public.community_knowledge_contributions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.community_knowledge_contributions TO authenticated;
GRANT ALL ON public.community_knowledge_contributions TO service_role;