import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Megaphone, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyRoles } from "@/lib/db";
import { createAdminFeedPost, fetchAllAdminFeedPosts, updateAdminFeedPost, type AdminFeedType } from "@/lib/admin-feed";
import { AdminFeedCard } from "@/components/admin-feed-card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-feed")({ component: AdminFeedPage });

const types: { value: AdminFeedType; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "advertisement", label: "Advertisement" },
  { value: "event", label: "Event" },
  { value: "community_info", label: "Community Info" },
  { value: "featured_listing", label: "Featured Listing" },
  { value: "safety_notice", label: "Safety / Weather Notice" },
];

function AdminFeedPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const rolesQ = useQuery({ queryKey: ["roles", user?.id], queryFn: () => fetchMyRoles(user!.id), enabled: !!user });
  const isAdmin = useMemo(() => rolesQ.data?.includes("admin") ?? false, [rolesQ.data]);
  const postsQ = useQuery({ queryKey: ["admin-feed-all"], queryFn: fetchAllAdminFeedPosts, enabled: isAdmin });

  const [postType, setPostType] = useState<AdminFeedType>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [featured, setFeatured] = useState(false);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (!title.trim()) throw new Error("Title is required");
      return createAdminFeedPost({
        created_by: user.id,
        post_type: postType,
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        location_text: locationText.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        pinned,
        featured,
        active: true,
      });
    },
    onSuccess: () => {
      toast.success("Feed item published");
      setTitle(""); setBody(""); setImageUrl(""); setLinkUrl(""); setLocationText(""); setStartsAt(""); setEndsAt(""); setPinned(false); setFeatured(false);
      qc.invalidateQueries({ queryKey: ["admin-feed-all"] });
      qc.invalidateQueries({ queryKey: ["admin-feed-active"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not publish"),
  });

  if (!user) return <Gate message="Sign in as an administrator to manage the feed." />;
  if (rolesQ.isLoading) return <Gate message="Checking administrator access…" />;
  if (!isAdmin) return <Gate message="Administrator access required." />;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" /> Community</Link>
          <div className="flex items-center gap-2 font-semibold text-primary"><Megaphone className="h-4 w-4" /> Feed Manager</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        <Card className="p-5 space-y-4">
          <div><h1 className="text-xl font-bold">Add to community feed</h1><p className="text-sm text-muted-foreground">Announcements, ads, events and useful community information appear in the normal feed.</p></div>
          <Select value={postType} onValueChange={(v) => setPostType(v as AdminFeedType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Short message" rows={4} />
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" />
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Website/contact link (optional)" />
          <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Location (optional)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Starts<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm" /></label><label className="text-xs text-muted-foreground">Ends<input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm" /></label></div>
          <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><Switch checked={pinned} onCheckedChange={setPinned} /> Pinned</label><label className="flex items-center gap-2"><Switch checked={featured} onCheckedChange={setFeatured} /> Featured</label></div>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !title.trim()} className="w-full">{createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}Publish to feed</Button>
        </Card>

        <section className="space-y-3">
          <div><h2 className="font-semibold">Existing feed items</h2><p className="text-xs text-muted-foreground">Turn an item off instead of deleting it.</p></div>
          {(postsQ.data ?? []).map((post) => (
            <div key={post.id} className="space-y-2">
              <AdminFeedCard post={post} />
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{post.active ? "Visible" : "Hidden"}</span>
                <Switch checked={post.active} onCheckedChange={async (active) => { try { await updateAdminFeedPost(post.id, { active }); await qc.invalidateQueries({ queryKey: ["admin-feed-all"] }); await qc.invalidateQueries({ queryKey: ["admin-feed-active"] }); } catch (e: any) { toast.error(e?.message ?? "Could not update"); } }} />
              </div>
            </div>
          ))}
          {!postsQ.isLoading && (postsQ.data ?? []).length === 0 && <Card className="p-5 text-sm text-muted-foreground">No admin feed items yet.</Card>}
        </section>
      </main>
    </div>
  );
}

function Gate({ message }: { message: string }) {
  return <div className="min-h-screen grid place-items-center bg-background p-4"><Card className="max-w-sm p-6 text-center space-y-4"><Megaphone className="h-8 w-8 text-primary mx-auto" /><p className="text-sm">{message}</p><Link to="/"><Button variant="outline">Back to community</Button></Link></Card></div>;
}
