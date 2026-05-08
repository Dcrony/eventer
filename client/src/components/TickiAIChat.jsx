import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RotateCcw, Send, Sparkles } from "lucide-react";
import API from "../api/axios";
import "./css/TickiAi.css";

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

  return (
    <div className={isFullPage ? "ai-page-wrapper" : "ai-modal-wrapper"}>
      {/* HEADER */}
      <header className="ai-page-header">
        <div className="header-left">
          {isFullPage && (
            <button onClick={() => navigate(-1)} className="ai-back-btn">
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="header-info">
            <span className="ai-brand">TickiAI</span>
            <h1>{role === "organizer" ? "Assistant" : "Concierge"}</h1>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="ai-reset-btn">
          <RotateCcw size={18} />
        </button>
      </header>

      {/* BODY */}
      <main className="ai-page-body">
        {/* ROLE SWITCH */}
        <div className="ai-role-tabs">
          {["organizer", "user"].map((opt) => (
            <button 
              key={opt} 
              className={role === opt ? "active" : ""} 
              onClick={() => setRole(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>

        {/* CHAT BUBBLES */}
        <div className="ai-chat-container">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <Sparkles size={40} className="ai-spark-icon" />
              <p>{SYSTEM_MESSAGE[role]}</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`ai-bubble ${m.sender}`}>
                {m.text}
              </div>
            ))
          )}
          {loading && <div className="ai-bubble assistant loading">Thinking...</div>}
          {error && <div className="ai-error-tag">{error}</div>}
          <div ref={scrollRef} />
        </div>

        {/* SUGGESTIONS */}
        <div className="ai-suggestions">
          {QUICK_PROMPTS[role].map((p) => (
            <button key={p} onClick={() => sendMessage(p)}>{p}</button>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="ai-page-footer">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  );
}