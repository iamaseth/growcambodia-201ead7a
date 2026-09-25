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


export type PlantObservation = {
  id: string;
  identification_id: string;
  user_id: string;
  observation_type: "note" | "photo" | "community_suggestion" | "expert_comment" | "correction" | "harvest" | "outcome";
  body: string | null;
  image_path: string | null;
  suggested_common_name: string | null;
  suggested_scientific_name: string | null;
  accepted: boolean;
  created_at: string;
};

export async function fetchPlantIdentification(id: string) {
  const { data, error } = await supabase.from("plant_identifications").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as SavedPlantIdentification;
}

export async function fetchPlantObservations(identificationId: string) {
  const { data, error } = await supabase.from("plant_identification_observations").select("*").eq("identification_id", identificationId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlantObservation[];
}

export async function addPlantObservation(input: {
  identification_id: string;
  user_id: string;
  observation_type: PlantObservation["observation_type"];
  body?: string | null;
  image_path?: string | null;
  suggested_common_name?: string | null;
  suggested_scientific_name?: string | null;
}) {
  const { data, error } = await supabase.from("plant_identification_observations").insert(input).select("*").single();
  if (error) throw error;
  return data as unknown as PlantObservation;
}
