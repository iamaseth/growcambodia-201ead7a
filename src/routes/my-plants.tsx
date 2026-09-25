import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyPlantIdentifications } from "@/lib/plant-identifications";
export const Route=createFileRoute("/my-plants")({component:Page});
function Page(){const {user}=useAuth();const q=useQuery({queryKey:["my-plants",user?.id],queryFn:()=>fetchMyPlantIdentifications(user!.id),enabled:!!user});
if(!user)return <main className="mx-auto max-w-2xl p-6 text-center"><Leaf className="mx-auto h-10 w-10 text-primary"/><h1 className="mt-3 text-xl font-bold">My Plant Memory</h1><p className="my-3 text-sm text-muted-foreground">Sign in to keep your plant history.</p><Link to="/auth"><Button>Sign in</Button></Link></main>;
return <main className="mx-auto max-w-2xl space-y-3 p-4 pb-28"><h1 className="text-xl font-bold">My Plant Memory</h1><p className="text-sm text-muted-foreground">Private by default. Share a plant only when you choose.</p>{q.isLoading&&<p>Loading...</p>}{!q.isLoading&&!q.data?.length&&<Card className="p-6 text-center"><p className="mb-3">No saved plants yet.</p><Link to="/identify"><Button>Identify a plant</Button></Link></Card>}{(q.data||[]).map(p=><Link key={p.id} to="/plant-memory/$id" params={{id:p.id}} className="block"><Card className="p-4"><div className="flex justify-between gap-3"><div><b>{p.common_name||p.scientific_name||"Unknown plant"}</b>{p.common_name&&p.scientific_name&&<p className="text-xs italic text-muted-foreground">{p.scientific_name}</p>}</div><span className="text-xs">{p.is_community_shared?"Shared":"Private"}</span></div><p className="mt-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p></Card></Link>)}</main>}
