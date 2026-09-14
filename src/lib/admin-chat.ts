import { supabase } from "@/integrations/supabase/client";

export type AdminMessage = {
  id: string;
  user_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

export type AdminConversation = {
  userId: string;
  displayName: string;
  messages: AdminMessage[];
  lastMessageAt: string;
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

export async function fetchAdminInbox(): Promise<AdminConversation[]> {
  const { data: messages, error } = await supabase
    .from("admin_messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const userIds = Array.from(new Set((messages ?? []).map((m: any) => m.user_id)));
  let names: Record<string, string> = {};
  if (userIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
    names = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.display_name || "Community member"]));
  }

  const grouped = new Map<string, AdminMessage[]>();
  for (const row of (messages ?? []) as any[]) {
    const arr = grouped.get(row.user_id) ?? [];
    arr.push(row as AdminMessage);
    grouped.set(row.user_id, arr);
  }

  return Array.from(grouped.entries())
    .map(([userId, thread]) => ({
      userId,
      displayName: names[userId] ?? "Community member",
      messages: thread,
      lastMessageAt: thread[thread.length - 1]?.created_at ?? "",
    }))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export async function sendAdminReply(userId: string, adminId: string, body: string) {
  const { data, error } = await supabase
    .from("admin_messages")
    .insert({ user_id: userId, sender_id: adminId, sender_role: "admin", body: body.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as AdminMessage;
}
