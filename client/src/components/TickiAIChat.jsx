import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";

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

export default function TickiAIChat({ event, user, initialRole = "user" }) {
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
        <section
            className="ticki-ai-chat"
            style={{
                width: "100%",
                maxWidth: "560px",
                border: "1px solid #e5e7eb",
                borderRadius: "24px",
                background: "#ffffff",
                boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
            }}
        >
            <div
                className="ticki-ai-chat-header"
                style={{ padding: "20px", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "16px" }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                        <p style={{ margin: 0, fontSize: "14px", color: "#6366f1", fontWeight: 700 }}>TickiAI</p>
                        <h2 style={{ margin: "8px 0 0", fontSize: "20px", lineHeight: "1.2", color: "#111827" }}>
                            {role === "organizer" ? "Organizer Assistant" : "User Concierge"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={clearConversation}
                        style={{
                            border: "1px solid #d1d5db",
                            borderRadius: "999px",
                            background: "#f9fafb",
                            color: "#374151",
                            padding: "10px 16px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Reset
                    </button>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(["organizer", "user"]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRole(option)}
                            style={{
                                borderRadius: "999px",
                                border: option === role ? "1px solid #4338ca" : "1px solid #d1d5db",
                                background: option === role ? "#eef2ff" : "#ffffff",
                                color: option === role ? "#312e81" : "#374151",
                                padding: "10px 18px",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            {option === "organizer" ? "Organizer" : "User"}
                        </button>
                    ))}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {QUICK_PROMPTS[role].map((prompt) => (
                        <button
                            type="button"
                            key={prompt}
                            onClick={() => sendMessage(prompt)}
                            style={{
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                background: "#f9fafb",
                                color: "#111827",
                                padding: "10px 14px",
                                cursor: "pointer",
                                fontSize: "13px",
                            }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className="ticki-ai-chat-body"
                style={{
                    minHeight: "320px",
                    maxHeight: "520px",
                    overflowY: "auto",
                    padding: "20px",
                    background: "#f8fafc",
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ color: "#6b7280", fontSize: "15px", lineHeight: "1.7" }}>
                        {SYSTEM_MESSAGE[role]}
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                marginBottom: "16px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: message.sender === "assistant" ? "flex-start" : "flex-end",
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: "95%",
                                    padding: "16px",
                                    borderRadius: "20px",
                                    background: message.sender === "assistant" ? "#ffffff" : "#4338ca",
                                    color: message.sender === "assistant" ? "#111827" : "#ffffff",
                                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: "1.6",
                                }}
                            >
                                {message.text}
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div style={{ marginTop: "12px", color: "#6b7280", fontSize: "14px" }}>TickiAI is composing a response…</div>
                )}
                {error && (
                    <div style={{ marginTop: "12px", color: "#b91c1c", fontSize: "14px" }}>{error}</div>
                )}
                <div ref={scrollRef} />
            </div>

            <form
                className="ticki-ai-chat-footer"
                onSubmit={handleSubmit}
                style={{ display: "flex", gap: "12px", padding: "20px", borderTop: "1px solid #f3f4f6", background: "#ffffff" }}
            >
                <label htmlFor="ticki-ai-input" style={{ display: "none" }}>
                    Ask TickiAI
                </label>
                <input
                    id="ticki-ai-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={role === "organizer" ? "Ask your business assistant…" : "Ask your event concierge…"}
                    style={{
                        flexGrow: 1,
                        minHeight: "48px",
                        borderRadius: "16px",
                        border: "1px solid #d1d5db",
                        padding: "0 16px",
                        color: "#111827",
                        fontSize: "15px",
                    }}
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        borderRadius: "16px",
                        border: "none",
                        background: "#4338ca",
                        color: "#ffffff",
                        padding: "0 22px",
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        minHeight: "48px",
                    }}
                >
                    {loading ? "Waiting…" : "Send"}
                </button>
            </form>
        </section>
    );
}
