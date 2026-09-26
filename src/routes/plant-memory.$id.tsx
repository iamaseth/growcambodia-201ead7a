import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlantAIChat } from "@/components/plant-ai-chat";
import { Card } from "@/components/ui/card"; import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { addPlantObservation,fetchPlantIdentification,fetchPlantObservations,setIdentificationCommunitySharing } from "@/lib/plant-identifications";
export const Route=createFileRoute("/plant-memory/$id")({component:Page});
function Page(){const {id}=Route.useParams();const {user}=useAuth();const qc=useQueryClient();const [note,setNote]=useState("");
const plant=useQuery({queryKey:["plant",id],queryFn:()=>fetchPlantIdentification(id)});
const obs=useQuery({queryKey:["plant-observations",id],queryFn:()=>fetchPlantObservations(id)});
const add=useMutation({mutationFn:()=>addPlantObservation({identification_id:id,user_id:user!.id,observation_type:"note",body:note}),onSuccess:()=>{setNote("");qc.invalidateQueries({queryKey:["plant-observations",id]})}});
const share=useMutation({mutationFn:(v:boolean)=>setIdentificationCommunitySharing(id,user!.id,v),onSuccess:()=>qc.invalidateQueries({queryKey:["plant",id]})});
const p=plant.data;if(!p)return <main className="p-6">Loading...</main>;const owner=user?.id===p.user_id;
return <main className="mx-auto max-w-2xl space-y-4 p-4 pb-28"><Link to="/my-plants" className="text-sm text-primary">Back to My Plant Memory</Link><Card className="p-4"><h1 className="text-xl font-bold">{p.common_name||p.scientific_name||"Unknown plant"}</h1>{p.scientific_name&&p.common_name&&<p className="italic text-muted-foreground">{p.scientific_name}</p>}<p className="mt-2 text-xs text-muted-foreground">Identified {new Date(p.created_at).toLocaleString()}</p>{owner&&<div className="mt-4 flex items-center justify-between gap-3"><div><b className="text-sm">{p.is_community_shared?"Shared with community":"Private"}</b><p className="text-xs text-muted-foreground">Sharing is always your choice.</p></div><Button variant={p.is_community_shared?"outline":"default"} onClick={()=>share.mutate(!p.is_community_shared)}>{p.is_community_shared?"Make private":"Share"}</Button></div>}</Card>
{owner && <PlantAIChat identificationId={p.id} plantContext={p.result_json ?? { identification: { commonName: p.common_name, scientificName: p.scientific_name } }} />}
<Card className="p-4"><h2 className="font-semibold">Plant history</h2>{owner&&<div className="mt-3 flex gap-2"><input className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={note} onChange={e=>setNote(e.target.value)} placeholder="Add an observation..." /><Button disabled={!note.trim()||add.isPending} onClick={()=>add.mutate()}>Add</Button></div>}<div className="mt-4 space-y-3">{!obs.data?.length&&<p className="text-sm text-muted-foreground">No observations yet.</p>}{(obs.data||[]).map(o=><div key={o.id} className="border-l-2 pl-3"><p className="text-xs font-medium capitalize">{o.observation_type.replace("_"," ")}</p>{o.body&&<p className="text-sm">{o.body}</p>}<p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p></div>)}</div></Card></main>}
