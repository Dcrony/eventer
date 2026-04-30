import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import API from "../api/axios";

const EXAMPLE_PROMPTS = [
    "Tech meetup in Lagos for 200 people, ₦3000 ticket",
    "Summer concert featuring live bands, free entry, 500 capacity",
    "Business networking breakfast in Abuja, ₦5000 per person",
    "Fitness bootcamp every weekend, ₦1500, 50 participants max",
    "Comedy show at the waterfront, ₦8000, intimate 100-person venue",
];

const TickiAIGenerator = ({ onGenerate = null }) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(null);
    const [editMode, setEditMode] = useState({});

    const handleGenerateEvent = async (event) => {
        event.preventDefault();
        setError(null);

        const trimmed = prompt.trim();
        if (!trimmed) {
            setError("Please describe your event");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post("/ai/generate-event", { prompt: trimmed });
            setGenerated(response.data.event);

            if (onGenerate) {
                onGenerate(response.data.event);
            }

            setPrompt("");
        } catch (err) {
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Failed to generate event. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUseExample = (example) => {
        setPrompt(example);
        setError(null);
    };

    const handleEditField = (field, value) => {
        setGenerated({ ...generated, [field]: value });
        setEditMode({ ...editMode, [field]: false });
    };

    const handleApply = () => {
        if (onGenerate) {
            onGenerate(generated);
        }
    };

    return (
        <section
            className="ticki-ai-generator"
            style={{
                width: "100%",
                maxWidth: "640px",
                margin: "0 auto",
            }}
        >
            <div
                style={{
                    borderRadius: "24px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    boxShadow: "0 16px 48px rgba(15, 23, 42, 0.08)",
                    overflow: "hidden",
                }}
            >
                <div
                    className="ticki-ai-generator-header"
                    style={{
                        padding: "24px",
                        borderBottom: "1px solid #f3f4f6",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#ffffff",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "8px",
                        }}
                    >
                        <Sparkles size={24} />
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
                            TickiAI Event Generator
                        </h2>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "14px",
                            opacity: 0.9,
                            lineHeight: "1.5",
                        }}
                    >
                        Describe your event in plain text. AI will auto-fill the event form for you.
                    </p>
                </div>

                <div style={{ padding: "24px" }}>
                    {!generated ? (
                        <>
                            <form onSubmit={handleGenerateEvent}>
                                <div
                                    style={{
                                        marginBottom: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    <label
                                        htmlFor="event-prompt"
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "#374151",
                                        }}
                                    >
                                        Describe your event
                                    </label>
                                    <textarea
                                        id="event-prompt"
                                        value={prompt}
                                        onChange={(e) => {
                                            setPrompt(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="e.g., Tech meetup in Lagos for 200 people, ₦3000 ticket"
                                        style={{
                                            minHeight: "120px",
                                            padding: "12px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            fontSize: "14px",
                                            fontFamily: "inherit",
                                            resize: "vertical",
                                            color: "#111827",
                                        }}
                                        disabled={loading}
                                    />
                                </div>

                                {error && (
                                    <div
                                        style={{
                                            marginBottom: "16px",
                                            padding: "12px",
                                            borderRadius: "12px",
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "flex-start",
                                            color: "#991b1b",
                                            fontSize: "14px",
                                        }}
                                    >
                                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !prompt.trim()}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: "#667eea",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                                        opacity: loading || !prompt.trim() ? 0.6 : 1,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {loading ? "Generating..." : "Generate Event"}
                                </button>
                            </form>

                            <div style={{ marginTop: "24px" }}>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                        marginBottom: "12px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Try examples:
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    {EXAMPLE_PROMPTS.map((example) => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => handleUseExample(example)}
                                            style={{
                                                padding: "12px",
                                                borderRadius: "12px",
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                color: "#374151",
                                                fontSize: "13px",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                hover: {
                                                    background: "#f3f4f6",
                                                    borderColor: "#d1d5db",
                                                },
                                            }}
                                        >
                                            "{example}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    padding: "16px",
                                    borderRadius: "12px",
                                    background: "#ecfdf5",
                                    border: "1px solid #a7f3d0",
                                    display: "flex",
                                    gap: "10px",
                                    alignItems: "flex-start",
                                    marginBottom: "24px",
                                    color: "#065f46",
                                    fontSize: "14px",
                                }}
                            >
                                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>Event generated successfully! Review and edit as needed.</span>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px",
                                    marginBottom: "24px",
                                }}
                            >
                                {[
                                    { key: "title", label: "Title" },
                                    { key: "category", label: "Category" },
                                    { key: "location", label: "Location" },
                                    { key: "date", label: "Date" },
                                    { key: "time", label: "Time" },
                                    { key: "capacity", label: "Capacity" },
                                    { key: "ticketPrice", label: "Ticket Price (₦)" },
                                ].map(({ key, label }) => (
                                    <div key={key} style={{ gridColumn: key === "description" ? "1 / -1" : "auto" }}>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#6b7280",
                                                display: "block",
                                                marginBottom: "6px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {label}
                                        </label>
                                        {editMode[key] ? (
                                            <input
                                                type={key === "capacity" || key === "ticketPrice" ? "number" : "text"}
                                                value={generated[key]}
                                                onChange={(e) => {
                                                    const value = key === "capacity" || key === "ticketPrice" ? Number(e.target.value) : e.target.value;
                                                    setGenerated({ ...generated, [key]: value });
                                                }}
                                                onBlur={() => setEditMode({ ...editMode, [key]: false })}
                                                autoFocus
                                                style={{
                                                    width: "100%",
                                                    padding: "8px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #667eea",
                                                    fontSize: "14px",
                                                    color: "#111827",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => setEditMode({ ...editMode, [key]: true })}
                                                style={{
                                                    padding: "8px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #e5e7eb",
                                                    background: "#f9fafb",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    color: "#111827",
                                                    minHeight: "32px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {generated[key] || "—"}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            display: "block",
                                            marginBottom: "6px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Description
                                    </label>
                                    {editMode.description ? (
                                        <textarea
                                            value={generated.description}
                                            onChange={(e) => setGenerated({ ...generated, description: e.target.value })}
                                            onBlur={() => setEditMode({ ...editMode, description: false })}
                                            autoFocus
                                            style={{
                                                width: "100%",
                                                minHeight: "80px",
                                                padding: "8px",
                                                borderRadius: "8px",
                                                border: "1px solid #667eea",
                                                fontSize: "14px",
                                                fontFamily: "inherit",
                                                color: "#111827",
                                                resize: "vertical",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setEditMode({ ...editMode, description: true })}
                                            style={{
                                                padding: "8px",
                                                borderRadius: "8px",
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                color: "#111827",
                                                minHeight: "80px",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                whiteSpace: "pre-wrap",
                                                lineHeight: "1.5",
                                            }}
                                        >
                                            {generated.description || "—"}
                                        </div>
                                    )}
                                </div>

                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            display: "block",
                                            marginBottom: "6px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Tags
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "8px",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "1px solid #e5e7eb",
                                            background: "#f9fafb",
                                            minHeight: "32px",
                                        }}
                                    >
                                        {generated.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    background: "#dbeafe",
                                                    color: "#1e40af",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGenerated(null);
                                        setEditMode({});
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "1px solid #d1d5db",
                                        background: "#ffffff",
                                        color: "#374151",
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: "#667eea",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    Use This Event
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TickiAIGenerator;
