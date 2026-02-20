import { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { sendChatMessage } from "../services/chatService";

// ── Suggestion chips shown at the start of a conversation ─────────────────
const SUGGESTIONS = [
  "How do I file a complaint?",
  "What does 🟠 status mean?",
  "How does geofencing work?",
  "How do I earn Civic Coins?",
];

// ── Format timestamp for chat bubbles ──────────────────────────────────────
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Get logged-in citizen from localStorage ─────────────────────────────
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };

  // ── Auto-scroll to the latest message ───────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Show greeting when chat first opens ─────────────────────────────────
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const user = getUser();
      const name =
        user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || "there";
      const greeting = {
        role: "bot",
        text: `Hi ${name}! 👋 I'm **GeoBot**, your GeoCivic assistant.\n\nI can help you:\n• Understand your complaint status\n• Guide you on how the platform works\n• Answer questions about Civic Coins & rewards\n\nTry asking about a ticket by saying **"ticket #12"** or pick a topic below!`,
        time: new Date(),
        id: Date.now(),
      };
      setMessages([greeting]);
      setHasGreeted(true);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasGreeted]);

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const user = getUser();

    // Add citizen message
    const userMsg = {
      role: "user",
      text: msg,
      time: new Date(),
      id: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(msg, user?.id ?? null);
      const botMsg = {
        role: "bot",
        text:
          res.data.reply || "Sorry, I didn't get a response. Please try again.",
        time: new Date(),
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ I'm having trouble connecting right now. Please check your internet and try again.",
          time: new Date(),
          id: Date.now() + 1,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setHasGreeted(false);
  };

  // ── Render markdown-lite: bold **text** and newlines ──────────────────────
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part.split("\n").map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))
      ),
    );
  };

  return (
    <>
      {/* ── Floating Toggle Button ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close GeoBot" : "Open GeoBot"}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-emerald-600 hover:bg-emerald-700 rotate-0"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 4px 24px rgba(5,150,105,0.4)"
            : "0 4px 24px rgba(16,185,129,0.5)",
        }}
      >
        {/* Pulse ring — only when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
        )}
        {isOpen ? (
          <ChevronDown size={22} className="text-white" />
        ) : (
          <Bot size={22} className="text-white" />
        )}
      </button>

      {/* ── Chat Panel ─────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-[1.75rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        style={{ maxHeight: "540px" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight flex items-center gap-1.5">
                GeoBot <Sparkles size={11} className="text-emerald-200" />
              </p>
              <p className="text-emerald-100 text-[10px] font-medium">
                {loading ? "Typing…" : "Online · GeoCivic Assistant"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Clear chat"
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <RotateCcw size={13} className="text-white" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              {msg.role === "bot" && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mb-0.5">
                  <Bot size={14} className="text-emerald-600" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : msg.isError
                      ? "bg-red-50 text-red-700 border border-red-100 rounded-bl-sm"
                      : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"
                }`}
              >
                {renderText(msg.text)}
                <p
                  className={`text-[9px] mt-1 text-right ${
                    msg.role === "user" ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {formatTime(msg.time)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-emerald-600" />
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {/* Suggestion chips — only show when just greeted */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-[11px] font-semibold px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0 flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // auto-grow up to 3 rows
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 72) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask GeoBot anything…"
            disabled={loading}
            className="flex-1 resize-none text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-60"
            style={{ minHeight: "40px", maxHeight: "72px", overflowY: "auto" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shadow-sm shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
