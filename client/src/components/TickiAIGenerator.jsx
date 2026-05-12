import { useEffect, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle2, X, Edit2 } from "lucide-react";
import API from "../api/axios";

const EXAMPLE_PROMPTS = [
    "Tech meetup in Lagos for 200 people, ₦3000 ticket",
    "Summer concert featuring live bands, free entry, 500 capacity",
    "Business networking breakfast in Abuja, ₦5000 per person",
    "Fitness bootcamp every weekend, ₦1500, 50 participants max",
    "Comedy show at the waterfront, ₦8000, intimate 100-person venue",
];

const TickiAIGenerator = ({ onGenerate = null, onClose = null }) => {
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
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                        <Sparkles size={18} />
                    </div>
                    <h2 className="text-base font-extrabold text-gray-900">AI Event Generator</h2>
                </div>
                <p className="text-xs text-gray-500">Describe your event and let TickiAI build it instantly.</p>
            </div>

            <div className="p-5">
                {!generated ? (
                    <>
                        <form onSubmit={handleGenerateEvent} className="space-y-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    setError(null);
                                }}
                                placeholder="e.g. Tech meetup in Lagos, 200 people, ₦3000"
                                disabled={loading}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-none disabled:opacity-50"
                            />

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !prompt.trim()}
                                className="w-full py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-md shadow-pink-500/25"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </span>
                                ) : (
                                    "Generate Event"
                                )}
                            </button>
                        </form>

                        <div className="mt-5">
                            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-2">Try these examples</p>
                            <div className="flex flex-wrap gap-2">
                                {EXAMPLE_PROMPTS.map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => handleUseExample(example)}
                                        className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium transition-all duration-200 hover:bg-pink-100 hover:text-pink-600"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-5">
                            <CheckCircle2 size={16} />
                            <span>Event generated. You can edit it below.</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { key: "title", label: "Title" },
                                { key: "category", label: "Category" },
                                { key: "location", label: "Location" },
                                { key: "date", label: "Date" },
                                { key: "time", label: "Time" },
                                { key: "capacity", label: "Capacity" },
                                { key: "ticketPrice", label: "Price" },
                            ].map(({ key, label }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">{label}</label>
                                    {editMode[key] ? (
                                        <input
                                            value={generated[key]}
                                            onChange={(e) => setGenerated({ ...generated, [key]: e.target.value })}
                                            onBlur={() => setEditMode({ ...editMode, [key]: false })}
                                            autoFocus
                                            className="w-full px-3 py-2 rounded-lg border-2 border-pink-500 bg-white text-gray-900 text-sm outline-none"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setEditMode({ ...editMode, [key]: true })}
                                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50/30"
                                        >
                                            <span className="flex-1">{generated[key] || "—"}</span>
                                            <Edit2 size={12} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Description</label>
                                <div
                                    onClick={() => setEditMode({ ...editMode, description: true })}
                                    className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm cursor-pointer transition-all duration-200 hover:border-pink-300 hover:bg-pink-50/30 min-h-[60px]"
                                >
                                    <span className="flex-1 break-words">{generated.description || "—"}</span>
                                    <Edit2 size={12} className="text-gray-400 flex-shrink-0 mt-1" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setGenerated(null);
                                    setEditMode({});
                                }}
                                className="flex-1 py-2.5 rounded-full border-2 border-gray-200 bg-white text-gray-600 text-sm font-bold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                            >
                                Back
                            </button>
                            <button onClick={handleApply} className="flex-1 py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/25">
                                Use Event
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TickiAIGenerator;