import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminFeedCard } from "@/components/admin-feed-card";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyRoles } from "@/lib/db";
import { fetchActiveAdminFeedPosts } from "@/lib/admin-feed";

export function CommunityAdminFeed() {
  const { user } = useAuth();
  const postsQ = useQuery({
    queryKey: ["admin-feed-active"],
    queryFn: fetchActiveAdminFeedPosts,
  });
  const rolesQ = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: () => fetchMyRoles(user!.id),
    enabled: !!user,
  });
  const isAdmin = rolesQ.data?.includes("admin") ?? false;

  if (!isAdmin && (postsQ.data ?? []).length === 0) return null;

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex justify-end">
          <Link to="/admin-feed">
            <Button variant="outline" size="sm">
              <Megaphone className="h-4 w-4 mr-1.5" /> Feed Manager
            </Button>
          </Link>
        </div>
      )}
      {(postsQ.data ?? []).map((post) => (
        <AdminFeedCard key={post.id} post={post} />
      ))}
    </div>
  );
}
