import { Link, useLocation } from "@tanstack/react-router";
import { Camera, Home, MessageCircle, Plus } from "lucide-react";
import { UpdateComposer } from "@/components/update-composer";

const itemClass = "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition hover:text-primary";

export function BottomNav() {
  const location = useLocation();
  const active = (path: string) => location.pathname === path;

  return (
    <nav id="community-bottom-nav" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/98 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-2xl items-stretch px-1">
        <UpdateComposer
          trigger={
            <button type="button" className={`${itemClass} text-primary`} aria-label="Post">
              <Plus className="h-5 w-5" />
              <span>Post</span>
            </button>
          }
        />

        <Link to="/identify" className={`${itemClass} ${active("/identify") ? "text-primary" : ""}`} aria-label="Identify plant">
          <Camera className="h-5 w-5" />
          <span>Identify</span>
        </Link>

        <Link to="/" className={`${itemClass} ${active("/") ? "text-primary" : ""}`} aria-label="Community feed">
          <Home className="h-5 w-5" />
          <span>Feed</span>
        </Link>

        <Link to="/chat" className={`${itemClass} ${active("/chat") ? "text-primary" : ""}`} aria-label="Chat with admin">
          <MessageCircle className="h-5 w-5" />
          <span>Chat Admin</span>
        </Link>
      </div>
    </nav>
  );
}
