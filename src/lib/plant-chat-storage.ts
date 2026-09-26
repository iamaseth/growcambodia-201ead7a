import { supabase } from "@/integrations/supabase/client";

export type PlantChatMessage = {
  id: string;
  identification_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function fetchPlantChat(identificationId: string): Promise<PlantChatMessage[]> {
  const { data, error } = await supabase.from("plant_ai_messages")
    .select("*").eq("identification_id", identificationId)
    .order("created_at", { ascending: true }).order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlantChatMessage[];
}

export async function savePlantChatMessage(
  identificationId: string, userId: string, role: PlantChatMessage["role"], content: string,
): Promise<PlantChatMessage> {
  const { data, error } = await supabase.from("plant_ai_messages")
    .insert({ identification_id: identificationId, user_id: userId, role, content })
    .select("*").single();
  if (error) throw error;
  return data as PlantChatMessage;
}
