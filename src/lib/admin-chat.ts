import { supabase } from "@/integrations/supabase/client";

export type AdminMessage = {
  id: string;
  user_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

export async function fetchMyAdminChat(userId: string): Promise<AdminMessage[]> {
  const { data, error } = await supabase
    .from("admin_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminMessage[];
}

export async function sendAdminMessage(userId: string, body: string) {
  const { data, error } = await supabase
    .from("admin_messages")
    .insert({ user_id: userId, sender_id: userId, sender_role: "user", body: body.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as AdminMessage;
}
