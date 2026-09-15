import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askPlantAI } from "@/lib/plant-chat.functions";

type Message = { role: "user" | "assistant"; content: string };

export function PlantAIChat({ plantContext }: { plantContext: any }) {
  const askFn = useServerFn(askPlantAI);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (preset?: string) => {
    const text = (preset ?? question).trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setQuestion("");
    setLoading(true);
    setError(null);
    try {
      const answer = await askFn({ data: { plant: plantContext, messages: next } });
      setMessages([...next, { role: "assistant", content: answer.content }]);
    } catch (e: any) {
      setError(e?.message ?? "Could not answer that question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 space-y-4 border-primary/30">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Ask about this plant</p>
          <h3 className="font-semibold text-lg">Continue with AI</h3>
          <p className="text-xs text-muted-foreground mt-1">I remember this identification and our conversation. Ask about propagation, care, problems, pruning, soil, or growing it in Cambodia.</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Can I grow this from a stem?", "How should I care for it in Cambodia?", "What problems should I watch for?"].map((q) => (
            <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border px-3 py-2 text-xs hover:bg-muted">{q}</button>
          ))}
        </div>
      )}

      {messages.length > 0 && <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
            {m.role === "assistant" && <Bot className="h-4 w-4 mb-1 text-primary" />}{m.content}
          </div>
        </div>)}
        {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking about this plant…</div>}
      </div>}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 items-end">
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a follow-up question…" rows={2} maxLength={1500} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <Button size="icon" onClick={() => send()} disabled={loading || !question.trim()} aria-label="Ask plant AI">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
      </div>
    </Card>
  );
}
