import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Camera, Home, MessageCircle, Plus } from "lucide-react";
import { UpdateComposer } from "@/components/update-composer";
import { useAuth } from "@/hooks/use-auth";

const itemClass = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-primary";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const active = (path: string) => location.pathname === path;

  const postTrigger = (
    <button type="button" className={itemClass} aria-label="Post">
      <Plus className="h-5 w-5" />
      <span>Post</span>
    </button>
  );

  return (
    <nav id="community-bottom-nav" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/98 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-20 max-w-2xl grid-cols-4 px-1">
        {user ? (
          <UpdateComposer trigger={postTrigger} />
        ) : (
          <button type="button" className={itemClass} aria-label="Post" onClick={() => navigate({ to: "/auth" })}>
            <Plus className="h-5 w-5" />
            <span>Post</span>
          </button>
        )}
        <Link to="/identify" className={`${itemClass} ${active("/identify") ? "text-primary" : ""}`} aria-label="Identify plant">
          <Camera className="h-5 w-5" />
          <span>Identify</span>
        </Link>
        <Link to="/" className={`${itemClass} ${active("/") ? "text-primary" : ""}`} aria-label="Community feed">
          <Home className="h-5 w-5" />
          <span>Feed</span>
        </Link>
        <Link to="/chat" className={`${itemClass} ${active("/chat") ? "text-primary" : ""}`} aria-label="Help us grow">
          <MessageCircle className="h-5 w-5" />
          <span>Help Us Grow</span>
        </Link>
      </div>
    </nav>
  );
}
