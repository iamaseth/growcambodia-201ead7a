import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyAdminChat, sendAdminMessage } from "@/lib/admin-chat";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({ component: ChatWithAdminPage });

function ChatWithAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const messagesQ = useQuery({
    queryKey: ["admin-chat", user?.id],
    queryFn: () => fetchMyAdminChat(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (!body.trim()) throw new Error("Write a message first");
      return sendAdminMessage(user.id, body);
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["admin-chat", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send message"),
  });

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-4 pb-24">
        <Card className="max-w-sm p-6 text-center space-y-4">
          <MessageCircle className="h-8 w-8 mx-auto text-primary" />
          <p className="text-sm">Sign in to chat with the community admin.</p>
          <Link to="/auth"><Button>Sign in</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium"><ArrowLeft className="h-4 w-4" /> Community</Link>
          <div className="flex items-center gap-2 font-semibold text-primary"><MessageCircle className="h-4 w-4" /> Chat with Admin</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <p className="text-sm font-medium">Community support</p>
          <p className="text-xs text-muted-foreground mt-1">Ask about the app, farming community, events, listings, seed sharing, or report a problem.</p>
        </Card>

        <div className="space-y-2 min-h-[45vh]">
          {messagesQ.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading messages…</p>}
          {(messagesQ.data ?? []).map((m) => (
            <div key={m.id} className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm ${m.sender_role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`text-[10px] mt-1 ${m.sender_role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {m.sender_role === "admin" ? "Admin · " : ""}{new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {!messagesQ.isLoading && (messagesQ.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No messages yet. Send the admin a message below.</p>
          )}
        </div>

        <div className="sticky bottom-20 bg-background pt-2">
          <Card className="p-3 flex gap-2 items-end">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message admin…" rows={2} maxLength={2000} />
            <Button size="icon" onClick={() => sendMut.mutate()} disabled={sendMut.isPending || !body.trim()} aria-label="Send message">
              {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
