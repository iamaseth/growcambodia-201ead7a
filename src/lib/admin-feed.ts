import { supabase } from "@/integrations/supabase/client";

export type AdminFeedType = "announcement" | "advertisement" | "event" | "community_info" | "featured_listing" | "safety_notice";

export type AdminFeedPost = {
  id: string;
  created_by: string;
  post_type: AdminFeedType;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  location_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  pinned: boolean;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchActiveAdminFeedPosts(): Promise<AdminFeedPost[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_feed_posts")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as AdminFeedPost[];
}

export async function fetchAllAdminFeedPosts(): Promise<AdminFeedPost[]> {
  const { data, error } = await supabase.from("admin_feed_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminFeedPost[];
}

export async function createAdminFeedPost(input: Omit<AdminFeedPost, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("admin_feed_posts").insert(input).select().single();
  if (error) throw error;
  return data as unknown as AdminFeedPost;
}

export async function updateAdminFeedPost(id: string, patch: Partial<AdminFeedPost>) {
  const { data, error } = await supabase.from("admin_feed_posts").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as unknown as AdminFeedPost;
}
