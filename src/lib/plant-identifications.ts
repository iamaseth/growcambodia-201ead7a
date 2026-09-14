import { supabase } from "@/integrations/supabase/client";

export type SavedPlantIdentification = {
  id: string;
  user_id: string;
  image_path: string | null;
  common_name: string | null;
  scientific_name: string | null;
  confidence: number | null;
  identification_source: "ai" | "database" | "community";
  status: "identified" | "needs_help" | "community_identified";
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  result_json: any;
  created_at: string;
  updated_at: string;
};

export async function savePlantIdentification(input: {
  user_id: string;
  image_path?: string | null;
  common_name?: string | null;
  scientific_name?: string | null;
  confidence?: number | null;
  identification_source?: "ai" | "database" | "community";
  status?: "identified" | "needs_help" | "community_identified";
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy_m?: number | null;
  result_json?: any;
}) {
  const { data, error } = await supabase
    .from("plant_identifications")
    .insert({
      ...input,
      identification_source: input.identification_source ?? "ai",
      status: input.status ?? "identified",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as SavedPlantIdentification;
}

export async function fetchMyPlantIdentifications(userId: string) {
  const { data, error } = await supabase
    .from("plant_identifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedPlantIdentification[];
}
