import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";
import "./css/TickiAi.css";

const QUICK_PROMPTS = {
    organizer: [
        "Create an event launch plan for my new experience.",
        "What is the best pricing strategy for this event?",
        "Give me marketing copy for ticket sales.",
    ],
    user: [
        "Find events near me this weekend.",
        "What should I know before attending this event?",
        "Which ticket should I buy for the best experience?",
    ],
};

const SYSTEM_MESSAGE = {
    organizer: "TickiAI is your organizer assistant. Ask for help with event creation, pricing, marketing, or performance.",
    user: "TickiAI is your event concierge. Ask questions about events, tickets, or recommendations.",
};

const buildContextPayload = (event, user) => {
    const payload = {};

    if (event) {
        payload.event = {
            _id: event._id || event.id,
            title: event.title,
            category: event.category,
            location: event.location,
            description: event.description,
            startDate: event.startDate,
            startTime: event.startTime,
            pricing: event.pricing,
            ticketsSold: event.ticketsSold,
            viewCount: event.viewCount,
            shareCount: event.shareCount,
            analytics: event.analytics,
        };
    }

    if (user) {
        payload.user = {
            _id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location,
            favorites: user.favorites,
            plan: user.plan,
            preferences: user.preferences,
        };
    }

    return payload;
};

const makeMessageId = () => `tickiai-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TickiAIChat({ event, user, initialRole = "organizer" || "user" }) {
    const storageKey = "tickiAI.chat.history";
    const [role, setRole] = useState(initialRole);
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed.messages) ? parsed.messages : [];
        } catch {
            return [];
        }
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
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading]);

    const appendMessage = (message) => {
        setMessages((current) => [...current, { ...message, id: makeMessageId() }]);
    };

    const clearConversation = () => {
        setMessages([]);
        setError(null);
    };

    const sendMessage = async (text) => {
        const trimmed = String(text || "").trim();
        if (!trimmed) return;

        setError(null);
        const userMessage = {
            sender: "user",
            role: "user",
            text: trimmed,
        };

        appendMessage(userMessage);
        setInput("");
        setLoading(true);

        try {
            const response = await API.post("/ai/chat", {
                role,
                message: trimmed,
                context,
            });

            appendMessage({ sender: "assistant", role: "assistant", text: response.data.answer || "Sorry, I couldn't generate a response." });
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Unable to reach TickiAI.";
            setError(message);
            appendMessage({ sender: "assistant", role: "assistant", text: "There was a problem processing your request. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (eventSubmit) => {
        eventSubmit.preventDefault();
        await sendMessage(input);
    };

    return (
        <section className="ticki-ai-chat">
  {/* HEADER */}
  <div className="ticki-ai-header">
    <div>
      <p className="ticki-ai-badge">TickiAI</p>
      <h2>
        {role === "organizer" ? "Organizer Assistant" : "Event Concierge"}
      </h2>
    </div>

    <button onClick={clearConversation} className="ticki-ai-reset">
      Reset
    </button>
  </div>

  {/* ROLE SWITCH */}
  <div className="ticki-ai-role-switch">
    {["organizer", "user"].map((option) => (
      <button
        key={option}
        onClick={() => setRole(option)}
        className={role === option ? "active" : ""}
      >
        {option === "organizer" ? "Organizer" : "User"}
      </button>
    ))}
  </div>

  {/* QUICK PROMPTS */}
  <div className="ticki-ai-prompts">
    {QUICK_PROMPTS[role].map((prompt) => (
      <button key={prompt} onClick={() => sendMessage(prompt)}>
        {prompt}
      </button>
    ))}
  </div>

  {/* CHAT BODY */}
  <div className="ticki-ai-body">
    {messages.length === 0 ? (
      <p className="ticki-ai-empty">{SYSTEM_MESSAGE[role]}</p>
    ) : (
      messages.map((message) => (
        <div
          key={message.id}
          className={`ticki-ai-msg ${message.sender}`}
        >
          {message.text}
        </div>
      ))
    )}

    {loading && <p className="ticki-ai-loading">TickiAI is thinking…</p>}
    {error && <p className="ticki-ai-error">{error}</p>}

    <div ref={scrollRef} />
  </div>

  {/* INPUT */}
  <form onSubmit={handleSubmit} className="ticki-ai-footer">
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder={
        role === "organizer"
          ? "Ask about pricing, growth..."
          : "Ask about events..."
      }
      disabled={loading}
    />

    <button disabled={loading || !input.trim()}>
      {loading ? "..." : "Send"}
    </button>
  </form>
</section>
    );
}
