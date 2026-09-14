import { Megaphone, CalendarDays, MapPin, Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AdminFeedPost } from "@/lib/admin-feed";

const labels: Record<AdminFeedPost["post_type"], string> = {
  announcement: "Announcement",
  advertisement: "Advertisement",
  event: "Event",
  community_info: "Community Info",
  featured_listing: "Featured",
  safety_notice: "Safety Notice",
};

export function AdminFeedCard({ post }: { post: AdminFeedPost }) {
  return (
    <Card className="overflow-hidden border-primary/20">
      {post.image_url && <img src={post.image_url} alt="" className="w-full max-h-80 object-cover bg-muted" />}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Megaphone className="h-3.5 w-3.5" />
            {labels[post.post_type]}
            {post.post_type === "advertisement" && <span className="text-muted-foreground">Sponsored</span>}
            {post.pinned && <Pin className="h-3 w-3" />}
          </div>
          <h3 className="font-semibold mt-1">{post.title}</h3>
        </div>
        {post.body && <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.body}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {post.location_text && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{post.location_text}</span>}
          {post.starts_at && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(post.starts_at).toLocaleString()}</span>}
        </div>
        {post.link_url && <p className="text-xs text-primary break-all">{post.link_url}</p>}
      </div>
    </Card>
  );
}
