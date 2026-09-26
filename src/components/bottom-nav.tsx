import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Camera, MessageCircle, NotebookPen, Users } from "lucide-react";

const itemClass = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition hover:text-primary";

export function BottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", label: "Community", icon: Users },
    { to: "/library", label: "Local Plants", icon: BookOpen },
    { to: "/identify", label: "Identify", icon: Camera },
    { to: "/my-plants", label: "Plant Diary", icon: NotebookPen },
    { to: "/chat", label: "Help Us Grow", icon: MessageCircle },
  ] as const;

  return (
    <nav aria-label="Grow main navigation" id="community-bottom-nav" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/98 backdrop-blur shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-20 max-w-2xl grid-cols-5 px-1">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} aria-label={label} aria-current={location.pathname === to ? "page" : undefined} className={`${itemClass} ${location.pathname === to || (to === "/my-plants" && location.pathname.startsWith("/plant-memory/")) ? "text-primary" : ""}`}>
            <Icon className="h-5 w-5" />
            <span className="text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
