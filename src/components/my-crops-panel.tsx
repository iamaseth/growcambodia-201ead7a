import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sprout, History, Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UpdateComposer } from "@/components/update-composer";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyCropSummaries } from "@/lib/db";
import { formatDMY } from "@/lib/date-format";

export function MyCropsPanel() {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const cropsQ = useQuery({
    queryKey: ["mycrops", user?.id],
    queryFn: () => fetchMyCropSummaries(user!.id),
    enabled: !!user,
  });

  const crops = useMemo(() => {
    const list = cropsQ.data ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.crop_type.toLowerCase().includes(term) ||
        (c.farms?.name ?? "").toLowerCase().includes(term),
    );
  }, [cropsQ.data, q]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof crops>();
    for (const c of crops) {
      const key = `${c.farms?.name ?? "Farm"} — ${c.title || "Unnamed plot"}`;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [crops]);


  if (!user) {
    return (
      <Card className="p-8 text-center space-y-3">
        <Sprout className="h-10 w-10 text-primary mx-auto" />
        <p className="font-medium">Sign in to see your crops</p>
        <Link to="/auth">
          <Button size="sm">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your crops or farms"
          className="pl-9"
        />
      </div>

      {cropsQ.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading your crops…</p>}

      {!cropsQ.isLoading && crops.length === 0 && (
        <Card className="p-8 text-center space-y-2">
          <Sprout className="h-10 w-10 text-primary mx-auto" />
          <p className="font-medium">No plant listings yet</p>
          <p className="text-sm text-muted-foreground">
            Tap "Post / add crop" below and choose "+ Add new plant" to start your first crop timeline.
          </p>
        </Card>
      )}

      {groups.map(([groupLabel, items]) => (
        <div key={groupLabel} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 pt-2">
            {groupLabel}
          </h3>

          {items.map((c) => (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to="/log/$logId" params={{ logId: c.id }} className="font-semibold hover:underline block truncate">
                    {c.crop_type}
                    {c.variety ? ` · ${c.variety}` : ""}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.farms?.name ?? "Farm"}
                    {c.title ? ` · ${c.title}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.update_count > 0
                      ? `${c.update_count} update${c.update_count === 1 ? "" : "s"} · last ${formatDMY(c.last_update_at!)}`
                      : "No updates yet"}
                    {c.quantity ? ` · ${c.quantity} plants` : ""}
                    {c.area_value ? ` · ${c.area_value} ${c.area_unit === "hectares" ? "ha" : "m²"}` : ""}
                  </p>
                </div>
                {c.latest_stage && <Badge variant="secondary" className="shrink-0">{c.latest_stage}</Badge>}
              </div>

              <div className="flex gap-2">
                <UpdateComposer
                  logId={c.id}
                  trigger={
                    <Button size="sm" className="flex-1">
                      <Plus className="h-4 w-4 mr-1" /> Add to timeline
                    </Button>
                  }
                />
                <Link to="/log/$logId" params={{ logId: c.id }} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">
                    <History className="h-4 w-4 mr-1" /> Timeline
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
