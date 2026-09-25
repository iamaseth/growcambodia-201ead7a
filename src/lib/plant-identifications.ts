import { supabase } from "@/integrations/supabase/client";

export type SavedPlantIdentification = {
  id: string; user_id: string; image_path: string | null; common_name: string | null;
  scientific_name: string | null; confidence: number | null; identification_source: "ai" | "database" | "community";
  status: "identified" | "needs_help" | "community_identified"; latitude: number | null; longitude: number | null;
  location_accuracy_m: number | null; result_json: any; is_community_shared?: boolean; library_entry_id?: string | null;
  created_at: string; updated_at: string;
};

export async function savePlantIdentification(input: {
  user_id: string; image_path?: string | null; common_name?: string | null; scientific_name?: string | null;
  confidence?: number | null; identification_source?: "ai" | "database" | "community";
  status?: "identified" | "needs_help" | "community_identified"; latitude?: number | null; longitude?: number | null;
  location_accuracy_m?: number | null; result_json?: any; is_community_shared?: boolean; library_entry_id?: string | null;
}) {
  const { data, error } = await supabase.from("plant_identifications").insert({
    ...input, identification_source: input.identification_source ?? "ai", status: input.status ?? "identified",
    is_community_shared: input.is_community_shared ?? false,
  }).select("*").single();
  if (error) throw error; return data as unknown as SavedPlantIdentification;
}

export async function fetchMyPlantIdentifications(userId: string) {
  const { data, error } = await supabase.from("plant_identifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error; return (data ?? []) as unknown as SavedPlantIdentification[];
}

export async function setIdentificationCommunitySharing(id: string, userId: string, shared: boolean) {
  const { error } = await supabase.from("plant_identifications").update({ is_community_shared: shared }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function linkIdentificationToLibrary(id: string, userId: string, libraryEntryId: string | null) {
  const { error } = await supabase.from("plant_identifications").update({ library_entry_id: libraryEntryId }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
