import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, CalendarDays, Camera, Leaf, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyPlantIdentifications, fetchPlantObservations } from "@/lib/plant-identifications";
import { fetchFeed } from "@/lib/db";
import { UpdateCard } from "@/components/update-card";

export const Route = createFileRoute("/my-plants")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [view, setView] = useState<"plants" | "timeline">("plants");
  const plants = useQuery({ queryKey: ["my-plants", user?.id], queryFn: () => fetchMyPlantIdentifications(user!.id), enabled: !!user });
  const observations = useQuery({
    queryKey: ["my-plant-observations", user?.id, (plants.data ?? []).map(p => p.id).join(",")],
    queryFn: async () => (await Promise.all((plants.data ?? []).map(async plant =>
      (await fetchPlantObservations(plant.id)).filter(o => o.user_id === user!.id).map(o => ({ ...o, plant }))
    ))).flat().sort((a, b) => b.created_at.localeCompare(a.created_at)),
    enabled: !!user && !!plants.data?.length && view === "timeline",
  });
  const communityUpdates = useQuery({
    queryKey: ["my-community-updates", user?.id],
    queryFn: async () => (await fetchFeed()).filter(update => update.user_id === user!.id),
    enabled: !!user && view === "timeline",
  });
  if (!user) return <main className="mx-auto max-w-2xl p-6 pb-28 text-center"><Leaf className="mx-auto h-10 w-10 text-primary"/><h1 className="mt-3 text-xl font-bold">Plant Diary</h1><p className="my-3 text-sm text-muted-foreground">Sign in to keep your private plant history.</p><Link to="/auth"><Button>Sign in</Button></Link></main>;
  const entries = [
    ...(plants.data ?? []).map(p => ({ kind: "identification" as const, id: p.id, date: p.created_at, plant: p })),
    ...(observations.data ?? []).map(o => ({ kind: "observation" as const, id: o.id, date: o.created_at, plant: o.plant, observation: o })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return <main className="mx-auto max-w-2xl space-y-4 p-4 pb-28">
    <h1 className="text-xl font-bold">My Plant Diary</h1>
    <p className="text-sm text-muted-foreground">Your saved plants and growing history are private by default. Choose what to share with the community.</p>
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Plant Diary views">
      <Button role="tab" aria-selected={view === "plants"} variant={view === "plants" ? "default" : "outline"} onClick={() => setView("plants")}><Leaf className="mr-2 h-4 w-4"/>My Plants</Button>
      <Button role="tab" aria-selected={view === "timeline"} variant={view === "timeline" ? "default" : "outline"} onClick={() => setView("timeline")}><CalendarDays className="mr-2 h-4 w-4"/>Timeline</Button>
    </div>
    <div className="flex flex-wrap gap-2"><Link to="/identify"><Button size="sm"><Camera className="mr-2 h-4 w-4"/>Identify a plant</Button></Link><Link to="/"><Button size="sm" variant="outline"><BookOpen className="mr-2 h-4 w-4"/>Community</Button></Link></div>
    {plants.isError && <p role="alert" className="text-sm text-destructive">Could not load your plants. Please try again.</p>}
    {view === "plants" ? <>
      <h2 className="font-semibold">My Plants</h2>
      {plants.isLoading && <p>Loading plants…</p>}
      {!plants.isLoading && !plants.data?.length && <Card className="p-6 text-center">No saved plants yet. Identify a plant to start your diary.</Card>}
      {(plants.data ?? []).map(p => <Link key={p.id} to="/plant-memory/$id" params={{ id: p.id }} className="block"><Card className="p-4"><div className="flex justify-between gap-3"><div><b>{p.common_name || p.scientific_name || "Unknown plant"}</b>{p.common_name && p.scientific_name && <p className="text-xs italic text-muted-foreground">{p.scientific_name}</p>}</div><span className="text-xs">{p.is_community_shared ? "Shared" : "Private"}</span></div><p className="mt-2 text-xs text-muted-foreground">Identified {new Date(p.created_at).toLocaleDateString()} · Open plant diary</p></Card></Link>)}
      <button className="text-sm font-medium text-primary underline" onClick={() => setView("timeline")}>View my full timeline →</button>
    </> : <>
      <h2 className="font-semibold">My Timeline</h2>
      <p className="text-xs text-muted-foreground">Your saved identifications and personal observations, newest first. Community posts you have shared appear below.</p>
      {(observations.isLoading || plants.isLoading) && <p>Loading diary…</p>}
      {observations.isError && <p role="alert" className="text-sm text-destructive">Could not load some diary entries.</p>}
      {!plants.isLoading && !observations.isLoading && !entries.length && <Card className="p-6">Your timeline is empty. Identify a plant to start.</Card>}
      {entries.map(entry => <Link key={entry.kind + entry.id} to="/plant-memory/$id" params={{ id: entry.plant.id }} className="block"><Card className="space-y-1 p-4"><p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString()}</p><b>{entry.plant.common_name || entry.plant.scientific_name || "Unknown plant"}</b><p className="text-sm">{entry.kind === "identification" ? "Plant identified and saved" : entry.observation.body || entry.observation.observation_type}</p><p className="text-xs text-primary">Open individual plant diary →</p></Card></Link>)}
      <h3 className="pt-3 font-semibold">My shared community updates</h3>
      {communityUpdates.isLoading && <p className="text-sm">Loading shared updates…</p>}
      {communityUpdates.isError && <p className="text-sm text-destructive">Could not load shared updates.</p>}
      {(communityUpdates.data ?? []).map(update => <UpdateCard key={update.id} item={update} diary />)}
    </>}
  </main>;
}
