import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, AlertTriangle, Leaf, MapPin, CalendarRange, Plus, ShieldCheck, Users, Search, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  ENTRY_TYPE_LABELS,
  CONTRIBUTION_TYPES,
  addCommunityEntry,
  addContribution,
  fetchContributions,
  fetchLibraryEntries,
  type LibraryEntry,
  type LibraryEntryType,
} from "@/lib/library";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Plant Library — Cambodia Wild Edibles & Remedies" },
      { name: "description", content: "Cambodia-focused plant knowledge: wild edibles, medicinal plants and local remedies, with community notes and safety warnings." },
      { property: "og:title", content: "Plant Library — Cambodia Wild Edibles & Remedies" },
      { property: "og:description", content: "Wild edibles, medicinal plants and local remedies from Cambodia, shared by farmers and growers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TYPES: LibraryEntryType[] = ["wild_edible", "medicinal_plant", "local_remedy"];

function verificationBadge(status: string) {
  if (status === "source_backed" || status === "verified")
    return <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Source-backed</Badge>;
  return <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> Community knowledge</Badge>;
}

function LibraryPage() {
  const [type, setType] = useState<LibraryEntryType>("wild_edible");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<LibraryEntry | null>(null);
  const entriesQ = useQuery({ queryKey: ["library"], queryFn: fetchLibraryEntries });

  const featured = useMemo(() => (entriesQ.data ?? []).filter((e) => e.featured_area === "Kampot" && (e.highlight_priority ?? 0) > 0).sort((a,b) => (b.highlight_priority ?? 0) - (a.highlight_priority ?? 0)), [entriesQ.data]);

  const entries = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (entriesQ.data ?? []).filter((e) => {
      if (e.entry_type !== type) return false;
      if (!term) return true;
      return [e.common_name, e.khmer_name, e.scientific_name, e.description, e.region_text]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [entriesQ.data, type, q]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 h-14">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Feed</Button>
          </Link>
          <span className="flex items-center gap-2 font-bold text-primary"><BookOpen className="h-5 w-5" /> Plant Library</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <h1 className="sr-only">Cambodia plant library</h1>

        <p className="text-xs text-muted-foreground rounded-md border bg-muted/40 p-2 leading-relaxed">
          Traditional and community knowledge shared by growers in Cambodia. It is not medical advice and traditional
          uses are not proven treatments. Never eat or treat with a plant unless you are certain of the identification.
        </p>

        {featured.length > 0 && <section className="space-y-2"><div><h2 className="font-bold text-lg">Kampot — Surprisingly Useful Plants</h2><p className="text-xs text-muted-foreground">Local plants worth rediscovering for food, nutrition, traditional knowledge, farming and local livelihoods.</p></div><div className="flex gap-3 overflow-x-auto pb-2">{featured.map((e)=><Card key={"featured-"+e.id} className="min-w-[260px] p-4 cursor-pointer" onClick={()=>setOpen(e)}><div className="flex justify-between gap-2"><h3 className="font-semibold">{e.common_name}</h3><Badge>Featured</Badge></div><p className="text-xs italic text-muted-foreground">{e.scientific_name}</p>{e.featured_reason&&<p className="text-sm mt-2">{e.featured_reason}</p>}<div className="flex flex-wrap gap-1 mt-2">{[...(e.nutrition_tags??[]),...(e.use_tags??[])].slice(0,5).map(t=><Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div></Card>)}</div></section>}

        <Tabs value={type} onValueChange={(v) => setType(v as LibraryEntryType)}>
          <TabsList className="grid w-full grid-cols-3">
            {TYPES.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs">{ENTRY_TYPE_LABELS[t]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plants, Khmer names, regions…" className="pl-8" />
          </div>
          <AddEntryDialog defaultType={type} />
        </div>

        {entriesQ.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading library…</p>}
        {!entriesQ.isLoading && entries.length === 0 && (
          <Card className="p-8 text-center space-y-2">
            <Leaf className="h-10 w-10 text-primary mx-auto" />
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Add the first plant to {ENTRY_TYPE_LABELS[type]}.</p>
          </Card>
        )}

        {entries.map((e) => (
          <Card key={e.id} className="p-4 space-y-2 cursor-pointer hover:bg-muted/40 transition" onClick={() => setOpen(e)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">{e.common_name}</h2>
                <p className="text-xs text-muted-foreground">
                  {[e.khmer_name, e.scientific_name].filter(Boolean).join(" · ")}
                </p>
              </div>
              {verificationBadge(e.verification_status)}
            </div>
            {e.description && <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>}
            {e.safety_warning && (
              <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {e.safety_warning}
              </p>
            )}
          </Card>
        ))}
      </main>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {open && <EntryDetail entry={open} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  );
}

function EntryDetail({ entry }: { entry: LibraryEntry }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const contribQ = useQuery({ queryKey: ["library-contrib", entry.id], queryFn: () => fetchContributions(entry.id) });
  const [ctype, setCtype] = useState<string>(CONTRIBUTION_TYPES[0].value);
  const [body, setBody] = useState("");

  const add = useMutation({
    mutationFn: () => addContribution({ entry_id: entry.id, user_id: user!.id, contribution_type: ctype, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      toast.success("Thanks — your note was shared as community knowledge");
      qc.invalidateQueries({ queryKey: ["library-contrib", entry.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't save your note"),
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="pr-6">{entry.common_name}</DialogTitle>
        <p className="text-xs text-muted-foreground text-left">
          {[entry.khmer_name, entry.scientific_name].filter(Boolean).join(" · ")}
        </p>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{ENTRY_TYPE_LABELS[entry.entry_type]}</Badge>
        {verificationBadge(entry.verification_status)}
      </div>

      {entry.safety_warning && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {entry.safety_warning}
          </p>
        </div>
      )}

      {entry.featured_reason && <Field label="Why this plant matters">{entry.featured_reason}</Field>}
      {entry.nutrition_summary && <Field label="Nutrition — vitamins, minerals, protein & more">{entry.nutrition_summary}</Field>}
      {entry.health_research_summary && <Field label="Health research">{entry.health_research_summary}</Field>}
      {entry.evidence_level && <Field label="Strength of evidence"><Badge variant="secondary">{entry.evidence_level}</Badge></Field>}
      {entry.evidence_summary && <Field label="What the evidence means">{entry.evidence_summary}</Field>}{entry.nutrition_tags?.length ? <Field label="Nutrition highlights"><div className="flex flex-wrap gap-1">{entry.nutrition_tags.map(t=><Badge key={t} variant="secondary">{t}</Badge>)}</div></Field> : null}{entry.use_tags?.length ? <Field label="Useful for"><div className="flex flex-wrap gap-1">{entry.use_tags.map(t=><Badge key={t} variant="outline">{t}</Badge>)}</div></Field> : null}{entry.local_opportunity && <Field label="Local opportunity">{entry.local_opportunity}</Field>}{entry.description && <Field label="Description">{entry.description}</Field>}
      {entry.edible_parts?.length ? <Field label="Edible parts">{entry.edible_parts.join(", ")}</Field> : null}
      {entry.traditional_uses?.length ? (
        <Field label="Traditional / local uses">
          <ul className="list-disc pl-4 space-y-0.5">
            {entry.traditional_uses.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
          <p className="text-[11px] text-muted-foreground mt-1">Traditional use only — not a proven medical treatment.</p>
        </Field>
      ) : null}
      {entry.preparation_notes && <Field label="Preparation notes">{entry.preparation_notes}</Field>}
      {entry.season_text && (
        <Field label="Season"><span className="inline-flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" />{entry.season_text}</span></Field>
      )}
      {entry.region_text && (
        <Field label="Where in Cambodia"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{entry.region_text}</span></Field>
      )}
      {entry.research_sources?.length ? <Field label="Research sources"><div className="space-y-1">{entry.research_sources.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-primary flex items-start gap-1">{s.title}<ExternalLink className="h-3 w-3 shrink-0 mt-1" /></a>)}</div></Field> : null}
      {entry.source_url && (
        <Field label="Source">
          <a href={entry.source_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 break-all">
            {entry.source_title ?? entry.source_url} <ExternalLink className="h-3 w-3" />
          </a>
        </Field>
      )}

      <div className="border-t pt-3 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4 w-4" /> Community notes</h3>
        <p className="text-[11px] text-muted-foreground">Shared by growers — unverified traditional knowledge.</p>

        {contribQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No community notes yet.</p>}
        {(contribQ.data ?? []).map((c) => (
          <div key={c.id} className="rounded-md border p-2 text-sm">
            <div className="text-[11px] font-medium text-muted-foreground">
              {CONTRIBUTION_TYPES.find((t) => t.value === c.contribution_type)?.label ?? c.contribution_type}
            </div>
            <p className="whitespace-pre-wrap mt-0.5">{c.body}</p>
          </div>
        ))}

        {user ? (
          <div className="space-y-2">
            <Select value={ctype} onValueChange={setCtype}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTRIBUTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what you know locally…" rows={3} />
            <Button size="sm" disabled={!body.trim() || add.isPending} onClick={() => add.mutate()} className="w-full">
              Share community note
            </Button>
          </div>
        ) : (
          <Link to="/auth"><Button size="sm" variant="outline" className="w-full">Sign in to add your local knowledge</Button></Link>
        )}
      </div>
    </div>
  );
}

function AddEntryDialog({ defaultType }: { defaultType: LibraryEntryType }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    entry_type: defaultType as LibraryEntryType,
    common_name: "",
    khmer_name: "",
    scientific_name: "",
    description: "",
    region_text: "",
    season_text: "",
    preparation_notes: "",
    safety_warning: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () =>
      addCommunityEntry({
        created_by: user!.id,
        entry_type: form.entry_type,
        common_name: form.common_name.trim(),
        khmer_name: form.khmer_name.trim() || null,
        scientific_name: form.scientific_name.trim() || null,
        description: form.description.trim() || null,
        region_text: form.region_text.trim() || null,
        season_text: form.season_text.trim() || null,
        preparation_notes: form.preparation_notes.trim() || null,
        safety_warning: form.safety_warning.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Added as community knowledge");
      setOpen(false);
      setForm((f) => ({ ...f, common_name: "", khmer_name: "", scientific_name: "", description: "", region_text: "", season_text: "", preparation_notes: "", safety_warning: "" }));
      qc.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't save this plant"),
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Add a plant"><Plus className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add a plant</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Select value={form.entry_type} onValueChange={(v) => set("entry_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{ENTRY_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Common / English name" value={form.common_name} onChange={(e) => set("common_name", e.target.value)} />
          <Input placeholder="Khmer / local name" value={form.khmer_name} onChange={(e) => set("khmer_name", e.target.value)} />
          <Input placeholder="Scientific name (optional)" value={form.scientific_name} onChange={(e) => set("scientific_name", e.target.value)} />
          <Textarea placeholder="Description and traditional or local uses" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          <Textarea placeholder="Preparation notes" rows={2} value={form.preparation_notes} onChange={(e) => set("preparation_notes", e.target.value)} />
          <Input placeholder="Region in Cambodia" value={form.region_text} onChange={(e) => set("region_text", e.target.value)} />
          <Input placeholder="Season" value={form.season_text} onChange={(e) => set("season_text", e.target.value)} />
          <Textarea placeholder="Safety warning (toxic parts, special preparation…)" rows={2} value={form.safety_warning} onChange={(e) => set("safety_warning", e.target.value)} />
          <p className="text-[11px] text-muted-foreground">
            Saved as unverified community knowledge. Do not describe traditional uses as medical treatment.
          </p>
          <Button className="w-full" disabled={!form.common_name.trim() || save.isPending} onClick={() => save.mutate()}>
            Add to library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
