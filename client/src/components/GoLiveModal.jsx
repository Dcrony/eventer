import { useState, useEffect, useRef } from "react";
import {
    X,
    Video,
    Activity,
    ChevronRight,
    AlertCircle,
    Play
} from "lucide-react";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";
import "./css/GoLiveModal.css";

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
                    console.error(err);
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
            console.error(err);
            alert("Failed to go live. Please try again.");
        } finally {
            setIsToggling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="golive-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-live-modal-title"
        >
            <div ref={modalRef} className="golive-modal">
                <div className="golive-header">
                    <div className="golive-header-left">
                        <div className="golive-header-icon">
                            <Video size={24} />
                        </div>
                        <h2 id="go-live-modal-title" className="golive-title">Start Your Stream</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="golive-close-btn"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="golive-body">
                    <p className="golive-instruction">
                        Select one of your existing events to start broadcasting live to your audience.
                    </p>

                    {error ? (
                        <div className="golive-error-wrap">
                            <p className="golive-error-text">{error}</p>
                            <button
                                type="button"
                                className="golive-retry-btn"
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    API.get("/events/my-events")
                                        .then((res) => { setMyEvents(res.data || []); setLoading(false); })
                                        .catch((err) => { console.error(err); setError("Failed to load your events."); setLoading(false); });
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="golive-loading">
                            <div className="golive-spinner" />
                            <span className="golive-loading-text">Loading your events...</span>
                        </div>
                    ) : myEvents.length === 0 ? (
                        <div className="golive-empty">
                            <AlertCircle className="golive-empty-icon" size={40} />
                            <p className="golive-empty-title">No events found</p>
                            <p className="golive-empty-sub">You need to create an event before you can go live.</p>
                        </div>
                    ) : (
                        <div className="golive-list">
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
                                    className={`golive-event-item ${selectedEventId === event._id ? "selected" : ""}`}
                                >
                                    <div className="golive-event-thumb">
                                        {getEventImageUrl(event) ? (
                                            <img
                                                src={getEventImageUrl(event)}
                                                alt=""
                                            />
                                        ) : (
                                            <div className="golive-event-thumb-placeholder">
                                                <Play size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="golive-event-info">
                                        <h4 className="golive-event-name">{event.title}</h4>
                                        <p className="golive-event-meta">
                                            {event.category || "General"} • {new Date(event.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {selectedEventId === event._id && (
                                        <div className="golive-event-check">
                                            <ChevronRight size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="golive-footer">
                    <div className="golive-notice">
                        <Activity size={14} />
                        <p>Going live will notify all ticket holders that the event has started.</p>
                    </div>

                    <div className="golive-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="golive-btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedEventId || isToggling}
                            onClick={handleToggleLive}
                            className="golive-btn-start"
                        >
                            {isToggling ? (
                                <div className="golive-btn-spinner" />
                            ) : (
                                <>
                                    <Activity size={20} />
                                    Start Streaming
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
