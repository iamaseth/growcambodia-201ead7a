import { supabase } from "@/integrations/supabase/client";

export type LibraryEntryType = "wild_edible" | "medicinal_plant" | "local_remedy";

export type LibraryEntry = {
  id: string;
  entry_type: LibraryEntryType;
  common_name: string;
  khmer_name: string | null;
  scientific_name: string | null;
  description: string | null;
  edible_parts: string[] | null;
  traditional_uses: string[] | null;
  preparation_notes: string | null;
  safety_warning: string | null;
  region_text: string | null;
  season_text: string | null;
  source_url: string | null;
  source_title: string | null;
  verification_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LibraryContribution = {
  id: string;
  entry_id: string;
  user_id: string;
  contribution_type: string;
  body: string;
  status: string;
  created_at: string;
};

export const ENTRY_TYPE_LABELS: Record<LibraryEntryType, string> = {
  wild_edible: "Wild Edibles",
  medicinal_plant: "Medicinal Plants",
  local_remedy: "Local Remedies",
};

export const CONTRIBUTION_TYPES = [
  { value: "local_name", label: "Local / Khmer name" },
  { value: "where_found", label: "Where it grows / where I found it" },
  { value: "preparation", label: "Traditional preparation" },
  { value: "food_use", label: "Food use" },
  { value: "traditional_use", label: "Medicinal / traditional use" },
  { value: "warning", label: "Safety warning" },
  { value: "remedy_note", label: "Local remedy note" },
] as const;

export async function fetchLibraryEntries(): Promise<LibraryEntry[]> {
  const { data, error } = await supabase
    .from("community_knowledge_library")
    .select("*")
    .order("common_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as LibraryEntry[];
}

export async function fetchContributions(entryId: string): Promise<LibraryContribution[]> {
  const { data, error } = await supabase
    .from("community_knowledge_contributions")
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LibraryContribution[];
}

export async function addContribution(input: {
  entry_id: string;
  user_id: string;
  contribution_type: string;
  body: string;
}) {
  const { error } = await supabase
    .from("community_knowledge_contributions")
    .insert({ ...input, status: "community" });
  if (error) throw error;
}

export async function addCommunityEntry(input: {
  created_by: string;
  entry_type: LibraryEntryType;
  common_name: string;
  khmer_name?: string | null;
  scientific_name?: string | null;
  description?: string | null;
  region_text?: string | null;
  season_text?: string | null;
  preparation_notes?: string | null;
  safety_warning?: string | null;
}) {
  const { data, error } = await supabase
    .from("community_knowledge_library")
    .insert({ ...input, verification_status: "community" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as LibraryEntry;
}
