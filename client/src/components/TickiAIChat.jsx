import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RotateCcw, Send, Sparkles, User, Briefcase } from "lucide-react";
import API from "../api/axios";

const QUICK_PROMPTS = {
  organizer: [
    "Create an event launch plan.",
    "Best pricing strategy?",
    "Marketing copy for tickets.",
  ],
  user: [
    "Find events this weekend.",
    "Know before attending?",
    "Which ticket is best?",
  ],
};

const SYSTEM_MESSAGE = {
  organizer: "TickiAI is your organizer assistant. Ask for help with event creation, pricing, or marketing.",
  user: "TickiAI is your event concierge. Ask questions about events, tickets, or recommendations.",
};

const buildContextPayload = (event, user) => {
  const payload = {};
  if (event) {
    payload.event = {
      _id: event._id || event.id,
      title: event.title,
      category: event.category,
      pricing: event.pricing,
    };
  }
  if (user) {
    payload.user = {
      _id: user._id || user.id,
      name: user.name,
      role: user.role,
    };
  }
  return payload;
};

const makeMessageId = () => `tickiai-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TickiAIChat({ event, user, initialRole = "user" }) {
  const navigate = useNavigate();
  const isFullPage = window.location.pathname === "/ticki-ai";
  const storageKey = "tickiAI.chat.history";
  const [role, setRole] = useState(initialRole);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed.messages) ? parsed.messages : [];
    } catch { return []; }
  });
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const context = useMemo(() => buildContextPayload(event, user), [event, user]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ role, messages }));
  }, [messages, role]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const appendMessage = (message) => {
    setMessages((current) => [...current, { ...message, id: makeMessageId() }]);
  };

  const sendMessage = async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;

    setError(null);
    appendMessage({ sender: "user", text: trimmed });
    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/ai/chat", { role, message: trimmed, context });
      appendMessage({ sender: "assistant", text: response.data.answer || "I couldn't generate a response." });
    } catch (err) {
      setError("Unable to reach TickiAI.");
      appendMessage({ sender: "assistant", text: "There was a problem. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gray-50 font-geist flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500">
                <ChevronLeft size={20} />
              </button>
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-500">
                  <Sparkles size={12} /> TickiAI
                </span>
                <h1 className="text-lg font-extrabold text-gray-900">{role === "organizer" ? "Assistant" : "Concierge"}</h1>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500" title="Reset conversation">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* Role Switch */}
        <div className="flex justify-center gap-2 py-4 bg-gray-50 border-b border-gray-200">
          {["organizer", "user"].map((opt) => (
            <button
              key={opt}
              onClick={() => setRole(opt)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                role === opt
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-500"
              }`}
            >
              {opt === "organizer" ? <Briefcase size={14} /> : <User size={14} />}
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <Sparkles size={32} className="text-pink-500" />
              </div>
              <p className="text-gray-500 max-w-md">{SYSTEM_MESSAGE[role]}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-pink-500 text-white rounded-br-md"
                        : "bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="text-center text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {QUICK_PROMPTS[role].map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-medium transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-full border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all duration-200 hover:bg-pink-600 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-pink-500/30"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </footer>

        <style jsx>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
          .animate-bounce {
            animation: bounce 1.4s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Modal version (for embedded use)
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
            <Sparkles size={12} />
          </div>
          <span className="text-xs font-bold text-gray-900">TickiAI</span>
        </div>
        <button onClick={() => setMessages([])} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-pink-500 transition-colors" title="Reset conversation">
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Role Switch */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {["organizer", "user"].map((opt) => (
          <button
            key={opt}
            onClick={() => setRole(opt)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              role === opt
                ? "bg-pink-500 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Sparkles size={24} className="text-pink-300" />
            <p className="text-xs text-gray-500">{SYSTEM_MESSAGE[role]}</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-pink-500 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-700 rounded-bl-md"
              }`}>
                {m.text}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl rounded-bl-md px-3 py-1.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 p-2 border-t border-gray-100">
        {QUICK_PROMPTS[role].slice(0, 2).map((p) => (
          <button key={p} onClick={() => sendMessage(p)} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[0.65rem] font-medium hover:bg-pink-100 hover:text-pink-600 transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 p-2 border-t border-gray-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-900 text-xs outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100 disabled:opacity-50"
        />
        <button type="submit" disabled={loading || !input.trim()} className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all duration-200 hover:bg-pink-600 disabled:opacity-40">
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}