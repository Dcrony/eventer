import { useState, useEffect, useRef } from "react";
import {
    X,
    Video,
    Activity,
    ChevronRight,
    AlertCircle,
    Play,
    Sparkles
} from "lucide-react";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";

export default function GoLiveModal({ isOpen, onClose, onStreamStarted, focusReturnRef }) {
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [isToggling, setIsToggling] = useState(false);
    const modalRef = useRef(null);
    
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            API.get("/events/my-events")
                .then((res) => {
                    setMyEvents(res.data || []);
                    setLoading(false);
                })
                .catch((err) => {
                    setError("Failed to load your events. Please try again.");
                    setLoading(false);
                });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;
        const el = modalRef.current;
        const focusables = el.querySelectorAll(FOCUSABLE);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (first) first.focus();

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                focusReturnRef?.current?.focus();
                return;
            }
            if (e.key !== "Tab") return;
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        el.addEventListener("keydown", handleKeyDown);
        return () => el.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, focusReturnRef]);

    const handleToggleLive = async () => {
        if (!selectedEventId) return;

        setIsToggling(true);
        try {
            const res = await API.patch("/events/toggle-live", {
                eventId: selectedEventId,
                isLive: true
            });
            onStreamStarted(selectedEventId);
            onClose();
        } catch (err) {
            alert("Failed to go live. Please try again.");
        } finally {
            setIsToggling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-live-modal-title"
        >
            <div
                ref={modalRef}
                className="w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden animate-scale-in"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100 text-pink-500">
                            <Video size={22} />
                        </div>
                        <h2 id="go-live-modal-title" className="text-lg font-extrabold tracking-tight text-gray-900">
                            Start Your Stream
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-500 mb-4">
                        Select one of your existing events to start broadcasting live to your audience.
                    </p>

                    {error ? (
                        <div className="text-center py-8">
                            <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
                            <p className="text-sm text-gray-600 mb-3">{error}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    API.get("/events/my-events")
                                        .then((res) => { setMyEvents(res.data || []); setLoading(false); })
                                        .catch(() => { setError("Failed to load your events."); setLoading(false); });
                                }}
                                className="px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600"
                            >
                                Retry
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                            <span className="text-sm text-gray-500">Loading your events...</span>
                        </div>
                    ) : myEvents.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <Sparkles size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-semibold text-gray-700 mb-1">No events found</p>
                            <p className="text-xs text-gray-500">You need to create an event before you can go live.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                            {myEvents.map((event) => (
                                <div
                                    key={event._id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedEventId(event._id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedEventId(event._id);
                                        }
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        selectedEventId === event._id
                                            ? "border-pink-500 bg-pink-50 shadow-sm"
                                            : "border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50/30"
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                        {getEventImageUrl(event) ? (
                                            <img
                                                src={getEventImageUrl(event)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Play size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate">{event.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {event.category || "General"} • {new Date(event.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {selectedEventId === event._id && (
                                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white flex-shrink-0">
                                            <ChevronRight size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
                        <Activity size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                        <p className="leading-relaxed">Going live will notify all ticket holders that the event has started.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-semibold transition-all duration-200 hover:border-pink-300 hover:text-pink-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedEventId || isToggling}
                            onClick={handleToggleLive}
                            className="flex-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-md shadow-pink-500/25"
                        >
                            {isToggling ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Activity size={18} />
                                    Start Streaming
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
}