import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { ArrowLeft, Camera, CheckCircle2, ExternalLink, Leaf, Loader2, MapPin, RotateCcw, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlantAIChat } from "@/components/plant-ai-chat";
import { identifyPlant } from "@/lib/identify-plant.functions";
import { useAuth } from "@/hooks/use-auth";
import { compressAndUploadPhotos } from "@/lib/photo";
import { savePlantIdentification } from "@/lib/plant-identifications";
import { findLibraryEntriesForPlant, ENTRY_TYPE_LABELS, type LibraryEntry } from "@/lib/library";

export const Route = createFileRoute("/identify")({ component: IdentifyPlantPage });

async function fileToDataUrl(file: File) {
  const compressed = await imageCompression(file, { maxSizeMB: 1.2, maxWidthOrHeight: 1800, useWebWorker: true, fileType: "image/jpeg" });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(compressed);
  });
}

async function getCurrentPlantLocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return await new Promise<{ latitude: number; longitude: number; accuracy: number } | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

function IdentifyPlantPage() {
  const { user } = useAuth();
  const identifyFn = useServerFn(identifyPlant);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedWithGps, setSavedWithGps] = useState(false);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null); setSaved(false); setSavedWithGps(false);
    try {
      const imageDataUrl = await fileToDataUrl(file);
      setPreview(imageDataUrl);
      const locationPromise = user ? getCurrentPlantLocation() : Promise.resolve(null);
      const uploadPromise = user ? compressAndUploadPhotos([file], user.id).catch(() => [] as string[]) : Promise.resolve([] as string[]);
      const identified = await identifyFn({ data: { imageDataUrl } });
      setResult(identified);
      if (user) {
        const [location, uploaded] = await Promise.all([locationPromise, uploadPromise]);
        const plant = identified?.identification ?? {};
        const confidence = typeof plant.confidence === "number" ? plant.confidence : null;
        const hasUsefulId = Boolean(plant.commonName || plant.scientificName);
        await savePlantIdentification({
          user_id: user.id, image_path: uploaded[0] ?? null, common_name: plant.commonName ?? null,
          scientific_name: plant.scientificName ?? null, confidence,
          identification_source: identified?.provider === "plantnet" ? "database" : "ai",
          status: hasUsefulId && (confidence == null || confidence >= 0.55) ? "identified" : "needs_help",
          latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
          location_accuracy_m: location?.accuracy ?? null, result_json: identified,
        });
        setSaved(true); setSavedWithGps(Boolean(location));
      }
    } catch (e: any) { setError(e?.message ?? "Could not identify this plant"); }
    finally { setLoading(false); }
  };

  const reset = () => { setPreview(null); setResult(null); setError(null); setSaved(false); setSavedWithGps(false); };

  return <div className="min-h-screen bg-background pb-24">
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="max-w-2xl mx-auto h-14 px-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" /> Grow Cambodia</Link>
      <div className="flex items-center gap-2 text-primary font-semibold"><Leaf className="h-4 w-4" /> Identify Plant</div>
    </div></header>
    <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
      <div className="space-y-1"><h1 className="text-2xl font-bold">What plant is this?</h1><p className="text-sm text-muted-foreground">Take a clear photo. We identify the plant, verify its scientific name, and save the result with GPS when you are signed in and location permission is available.</p></div>
      {!preview && <Card className="p-6 text-center space-y-4 border-dashed"><div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Camera className="h-7 w-7 text-primary" /></div><div><p className="font-medium">Photograph one plant</p><p className="text-xs text-muted-foreground mt-1">For best results, include clear leaves, flowers, fruit, or bark.</p></div><label className="inline-flex cursor-pointer"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])}/><span className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"><Camera className="h-4 w-4 mr-2" /> Take or upload photo</span></label></Card>}
      {preview && <Card className="overflow-hidden"><img src={preview} alt="Plant to identify" className="w-full max-h-[420px] object-cover" /><div className="p-3 flex justify-between items-center"><span className="text-xs text-muted-foreground">Plant photo</span><Button variant="ghost" size="sm" onClick={reset} disabled={loading}><RotateCcw className="h-4 w-4 mr-1" /> Try another</Button></div></Card>}
      {loading && <Card className="p-6 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><div><p className="font-medium text-sm">Identifying plant…</p><p className="text-xs text-muted-foreground">Checking the photo, taxonomy, Cambodia context, and location.</p></div></Card>}
      {error && <Card className="p-4 border-destructive/40"><p className="font-medium text-sm text-destructive">Identification failed</p><p className="text-sm mt-1">{error}</p><p className="text-xs text-muted-foreground mt-2">Try a closer, brighter photo showing leaves, flowers, fruit, or bark.</p></Card>}
      {saved && <Card className="p-4 flex gap-3 items-start border-primary/30 bg-primary/5"><CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /><div><p className="font-medium text-sm">Saved to your plant identification history</p><p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{savedWithGps ? "GPS location saved with this identification." : "Location unavailable; the identification was still saved."}</p></div></Card>}
      {result && <PlantResult result={result} />}
    </main>
  </div>;
}

function PlantResult({ result }: { result: any }) {
  const plant = result.identification; const profile = result.cambodiaProfile; const taxonomy = result.taxonomy;
  const confidence = Math.round((plant.confidence ?? 0) * 100);
  const [knowledge, setKnowledge] = useState<LibraryEntry[]>([]);
  useEffect(() => {
    findLibraryEntriesForPlant(plant.scientificName, plant.commonName).then(setKnowledge).catch(() => setKnowledge([]));
  }, [plant.scientificName, plant.commonName]);
  return <div className="space-y-4">
    <Card className="p-5 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">Likely identification</p><h2 className="text-2xl font-bold mt-1">{plant.commonName || plant.scientificName}</h2><p className="italic text-sm text-muted-foreground">{plant.scientificName}</p>{plant.family && <p className="text-xs text-muted-foreground mt-1">Family: {plant.family}</p>}</div><div className="shrink-0 text-right"><div className="font-semibold">{confidence}%</div><div className="text-[10px] text-muted-foreground">photo confidence</div></div></div><p className="text-sm leading-relaxed">{plant.description}</p>{taxonomy && <div className="rounded-md bg-muted p-3 text-xs flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /><div><p className="font-medium">Taxonomy checked against GBIF</p><p className="text-muted-foreground">{taxonomy.status ?? "Matched"}{taxonomy.rank ? ` · ${taxonomy.rank}` : ""}</p>{taxonomy.sourceUrl && <a href={taxonomy.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary mt-1 hover:underline">View GBIF record <ExternalLink className="h-3 w-3" /></a>}</div></div>}</Card>
    {profile ? <Card className="p-5 space-y-4"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">Cambodia growing guide</p><h3 className="font-semibold text-lg mt-1">How to grow it here</h3><p className="text-sm text-muted-foreground mt-1">{profile.cambodiaFit}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><Info label="Best planting time" value={profile.plantingWindow}/><Info label="Sun" value={profile.sun}/><Info label="Water" value={profile.water}/><Info label="Soil" value={profile.soil}/><Info label="Propagation" value={profile.propagation}/></div>{profile.notes?.length > 0 && <div><p className="text-sm font-medium mb-1">Cambodia tips</p><ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">{profile.notes.map((tip: string) => <li key={tip}>{tip}</li>)}</ul></div>}</Card> : <Card className="p-5 space-y-3"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">General growing guidance</p><p className="text-xs text-muted-foreground mt-1">This species is not yet in our curated Cambodia library. These tips are general and should be refined as the library grows.</p></div>{plant.generalTips?.length > 0 && <ul className="text-sm list-disc pl-5 space-y-1">{plant.generalTips.map((tip: string) => <li key={tip}>{tip}</li>)}</ul>}</Card>}
    {plant.visibleFeatures?.length > 0 && <Card className="p-5"><h3 className="font-semibold text-sm">What the photo shows</h3><ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">{plant.visibleFeatures.map((feature: string) => <li key={feature}>{feature}</li>)}</ul></Card>}
    {plant.alternatives?.length > 0 && <Card className="p-5"><h3 className="font-semibold text-sm">Other possible matches</h3><div className="mt-2 space-y-2">{plant.alternatives.map((alt: any, i: number) => <div key={`${alt.scientific_name}-${i}`} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"><div><span>{alt.common_name || alt.scientific_name}</span><span className="text-muted-foreground italic ml-1">{alt.scientific_name}</span></div>{typeof alt.confidence === "number" && <span className="text-xs text-muted-foreground">{Math.round(alt.confidence * 100)}%</span>}</div>)}</div></Card>}
    {knowledge.length > 0 && <Card className="p-5 space-y-3">
      <div><p className="text-xs font-medium uppercase tracking-wide text-primary">Cambodia community plant knowledge</p>
      <h3 className="font-semibold text-lg mt-1">Wild food & traditional knowledge</h3>
      <p className="text-xs text-muted-foreground mt-1">Traditional/community uses are preserved separately from verified evidence. Identification does not establish that a plant is safe to eat or use medicinally.</p></div>
      <div className="space-y-3">{knowledge.map((entry) => <div key={entry.id} className="rounded-md border p-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-sm">{entry.common_name}</span><span className="text-xs text-muted-foreground">{ENTRY_TYPE_LABELS[entry.entry_type]}</span></div>
        {entry.khmer_name && <p className="text-sm">Khmer/local name: {entry.khmer_name}</p>}
        {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}
        {entry.traditional_uses?.length ? <p className="text-sm"><span className="font-medium">Traditional uses:</span> {entry.traditional_uses.join(", ")}</p> : null}
        {entry.safety_warning && <p className="text-xs font-medium text-destructive">Safety: {entry.safety_warning}</p>}
      </div>)}</div>
      <Link to="/library"><Button variant="outline" size="sm" className="w-full">Open Cambodia Plant Library</Button></Link>
    </Card>}
    <PlantAIChat plantContext={result} />
    <Card className="p-4 flex items-center gap-3"><Sprout className="h-5 w-5 text-primary" /><div className="flex-1"><p className="font-medium text-sm">Growing this plant?</p><p className="text-xs text-muted-foreground">Add it to Grow Cambodia and start its photo timeline.</p></div><Link to="/"><Button size="sm">My Crops</Button></Link></Card>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1">{value}</p></div>; }
