"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UnitMatch {
  id: string;
  unit_number: string;
  building_name: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  neighbourhood: string;
  filter_url: string;
}

interface ChatResponse {
  message: string;
  units?: UnitMatch[];
  booking_collected?: boolean;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your leasing assistant for YourKeyMTL. 👋\n\nI can help you find the perfect apartment in Montreal. What are you looking for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unitMatches, setUnitMatches] = useState<UnitMatch[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setUnitMatches([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data: ChatResponse = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message },
      ]);

      if (data.units && data.units.length > 0) {
        setUnitMatches(data.units);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatMessage(content: string) {
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split("\n").length - 1 && <br />}
      </span>
    ));
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-brand-navy text-white rounded-full shadow-lg hover:bg-brand-blue hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-24px))] chat-panel-enter">
          <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
            style={{ maxHeight: "min(560px, calc(100vh - 120px))" }}>
            {/* Header */}
            <div className="bg-brand-navy px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">YourKeyMTL Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-white/60 text-xs">Online — typically replies instantly</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-navy text-white rounded-br-sm"
                        : "bg-gray-50 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {formatMessage(msg.content)}
                  </div>
                </div>
              ))}

              {/* Unit matches */}
              {unitMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 px-1">Matching units:</p>
                  {unitMatches.slice(0, 3).map((unit) => (
                    <a
                      key={unit.id}
                      href={unit.filter_url}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-2xl px-4 py-3 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-brand-navy">
                          Unit {unit.unit_number}
                          {unit.building_name ? ` · ${unit.building_name}` : ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms} bd`} · {unit.bathrooms} ba
                          {unit.sqft > 0 ? ` · ${unit.sqft} ft²` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-brand-blue">
                        <span className="text-sm font-semibold">${unit.price.toLocaleString()}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </a>
                  ))}
                  {unitMatches.length > 3 && (
                    <a
                      href={unitMatches[0].filter_url}
                      className="flex items-center justify-center gap-1 text-xs text-brand-blue hover:text-brand-navy transition-colors py-2"
                    >
                      View all {unitMatches.length} matching units
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 shrink-0">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center text-white hover:bg-brand-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
