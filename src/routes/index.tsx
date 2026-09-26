import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sprout, LogIn, LogOut, CalendarIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { UpdateCard } from "@/components/update-card";
import { UpdateComposer } from "@/components/update-composer";
import { CommunityAdminFeed } from "@/components/community-admin-feed";
import { fetchFeed } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatDM } from "@/lib/date-format";



export const Route = createFileRoute("/")({
  component: Home,
});

type Preset = "today" | "week" | "month" | "custom";

function computeRange(preset: Preset, custom: { from?: Date; to?: Date }) {
  const now = new Date();
  const start = new Date(now);
  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: undefined as string | undefined, label: "Today" };
  }
  if (preset === "week") {
    start.setDate(now.getDate() - 7);
    return { from: start.toISOString(), to: undefined, label: "This Week" };
  }
  if (preset === "month") {
    start.setMonth(now.getMonth() - 1);
    return { from: start.toISOString(), to: undefined, label: "This Month" };
  }
  return {
    from: custom.from ? new Date(custom.from.setHours(0, 0, 0, 0)).toISOString() : undefined,
    to: custom.to ? new Date(custom.to.setHours(23, 59, 59, 999)).toISOString() : undefined,
    label: "Custom",
  };
}

function Home() {
  const { user, signOut } = useAuth();
  const [preset, setPreset] = useState<Preset>("week");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const range = useMemo(() => computeRange(preset, { from: customFrom, to: customTo }), [preset, customFrom, customTo]);
  const feedQ = useQuery({
    queryKey: ["feed", range.from ?? "any", range.to ?? "any"],
    queryFn: () => fetchFeed({ from: range.from, to: range.to }),
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary"><Sprout className="h-5 w-5" /> Grow Cambodia</Link>
          <div className="flex items-center gap-1">
            <Link to="/settings"><Button variant="ghost" size="sm" aria-label="Settings"><Settings className="h-4 w-4" /></Button></Link>
            {user ? <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button> :
              <Link to="/auth"><Button variant="ghost" size="sm"><LogIn className="mr-1 h-4 w-4" /> Sign in</Button></Link>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        <h1 className="text-lg font-semibold">Community</h1>
        <div className="flex flex-wrap gap-1.5">
          {(["today", "week", "month", "custom"] as Preset[]).map((p) => {
            const labels: Record<Preset, string> = { today: "Today", week: "This Week", month: "This Month", custom: "Custom" };
            if (p === "custom") {
              return (
                <Popover key={p}>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant={preset === "custom" ? "default" : "outline"}
                      className="h-8"
                      onClick={() => setPreset("custom")}
                    >
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {preset === "custom" && (customFrom || customTo)
                        ? `${customFrom ? formatDM(customFrom) : "…"} – ${customTo ? formatDM(customTo) : "…"}`
                        : "Custom"}

                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: customFrom, to: customTo }}
                      onSelect={(r) => { setCustomFrom(r?.from); setCustomTo(r?.to); setPreset("custom"); }}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              );
            }
            return (
              <Button
                key={p}
                size="sm"
                variant={preset === p ? "default" : "outline"}
                className="h-8"
                onClick={() => setPreset(p)}
              >
                {labels[p]}
              </Button>
            );
          })}
        </div>

        <CommunityAdminFeed />

        {feedQ.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading updates…</p>}
        {!feedQ.isLoading && feedQ.data && feedQ.data.length === 0 && (
          <Card className="p-8 text-center space-y-2">
            <Sprout className="h-10 w-10 text-primary mx-auto" />
            <p className="font-medium">No updates yet — be the first to post</p>
            <p className="text-sm text-muted-foreground">Tap "Post / add crop" below to log the first growth stage.</p>
          </Card>
        )}
        {(feedQ.data ?? []).map((item) => <UpdateCard key={item.id} item={item} />)}

      </main>
      <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2"><UpdateComposer /></div>
    </div>
  );
}
