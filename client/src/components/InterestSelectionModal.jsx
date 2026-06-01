import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import API from "../api/axios";

const FALLBACK_CATEGORIES = [
    "Music",
    "Concerts",
    "Comedy",
    "Tech",
    "Business",
    "Startup",
    "Networking",
    "Education",
    "Sports",
    "Gaming",
    "Religious",
    "Fashion",
    "Food",
    "Festival",
    "Conference",
    "Entertainment",
];

const normalizeCategory = (value) => String(value || "").trim();

export default function InterestSelectionModal({ user, token, onComplete }) {
    const [categories, setCategories] = useState([]);
    const [selected, setSelected] = useState(user?.interests || []);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await API.get("/categories");
                if (Array.isArray(data?.categories) && data.categories.length > 0) {
                    setCategories(
                        data.categories
                            .map((category) => normalizeCategory(category))
                            .filter(Boolean)
                            .filter((value, index, list) => list.indexOf(value) === index),
                    );
                } else {
                    setCategories(FALLBACK_CATEGORIES);
                }
            } catch (err) {
                setCategories(FALLBACK_CATEGORIES);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleToggle = (category) => {
        setSelected((current) => {
            const normalized = normalizeCategory(category);
            if (!normalized) return current;
            return current.includes(normalized)
                ? current.filter((item) => item !== normalized)
                : [...current, normalized];
        });
    };

    const saveInterests = async (skip = false) => {
        setSaving(true);
        setError("");
        try {
            const payload = {
                interests: skip ? [] : selected,
                skip,
            };
            const response = await API.put("/settings/interests", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onComplete(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save interests. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const availableCategories = useMemo(() => {
        const names = categories.map((category) => normalizeCategory(category));
        return names.length > 0 ? names : FALLBACK_CATEGORIES;
    }, [categories]);

    const title = user?.name ? `Hi ${user.name.split(" ")[0]}` : "Choose your interests";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-7 animate-slide-up">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pink-500">Personalize TickiSpot</p>
                        <h2 className="mt-3 text-2xl font-extrabold text-gray-900">{title}</h2>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Select a few topics that match your interests. This helps prioritize events and recommendations without limiting search.
                        </p>
                    </div>
                    <div className="text-pink-500 bg-pink-100 rounded-full w-11 h-11 flex items-center justify-center">
                        <Sparkles size={20} />
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {availableCategories.map((category) => {
                        const normalized = normalizeCategory(category);
                        const active = selected.includes(normalized);
                        return (
                            <button
                                key={normalized}
                                type="button"
                                onClick={() => handleToggle(normalized)}
                                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${active
                                        ? "border-pink-500 bg-pink-50 text-pink-700"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                                    }`}
                            >
                                {normalized}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <button
                        type="button"
                        onClick={() => saveInterests(false)}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-pink-500 text-white text-sm font-semibold shadow-md shadow-pink-500/20 hover:bg-pink-600 transition-all disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save interests"}
                        {saving && <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => saveInterests(true)}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        Skip for now
                    </button>
                </div>

                <div className="text-xs text-gray-400">You can update these anytime from Settings.</div>
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.24s ease-out; }
      `}</style>
        </div>
    );
}
