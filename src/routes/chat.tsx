import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { askGarden } from "@/lib/memories/server";
import { useMemoryStore } from "@/lib/memories/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "rules";
};

const SUGGESTIONS = [
  "How was my month?",
  "What makes me happiest?",
  "What stresses me?",
  "What have I learned?",
  "What emotional patterns do you see?",
  "What should I reflect on?",
];

function ChatPage() {
  const hydrated = useMemoryStore((s) => s.hydrated);
  const memoryCount = useMemoryStore((s) => s.memories.length);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm your garden assistant. Ask about your month, themes, stress, growth — I'll answer only from your own memories.",
      source: "rules",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await askGarden({
        data: {
          question: q,
          history: history.slice(0, -1), // prior turns only
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
          source: result.source,
        },
      ]);
    } catch (err) {
      console.error("[chat] garden request failed", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I can't reach your garden memories right now. Please try again in a moment.",
          source: "rules",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  if (!hydrated) {
    return <p className="font-hand text-xl text-muted">Nurturing your garden…</p>;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6">
      <header>
        <p className="font-hand text-lg text-accent">🌱 Talk to Your Garden</p>
        <h1 className="font-display text-3xl sm:text-4xl">Your personal memory companion</h1>
        <p className="mt-2 text-sm text-muted">
          Answers come only from your memories
          {memoryCount > 0 ? ` · ${memoryCount} planted` : " · plant a few to unlock richer replies"}.
        </p>
      </header>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
          <div className="flex max-h-[min(55vh,28rem)] flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-moss text-cream"
                    : "mr-auto bg-surface text-foreground shadow-border",
                )}
              >
                {msg.role === "assistant" ? (
                  <p className="mb-1 text-[11px] tracking-wide text-muted uppercase">
                    🌱 Garden Assistant
                    {msg.source === "rules" ? " · offline insight" : ""}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading ? (
              <div className="mr-auto rounded-2xl bg-surface px-3.5 py-2.5 text-sm text-muted shadow-border">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">Growing a reply</span>
                  <span className="animate-pulse delay-75">…</span>
                </span>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 ? (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => void send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your garden something…"
              disabled={loading}
              maxLength={1000}
              className="h-11 flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-5">
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
