import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import {
    Users, Heart, Share2, MessageCircle, Settings as SettingsIcon,
    Maximize, Flag, Info, Mic, MicOff, Video as VideoIcon, VideoOff,
    UserCheck, Calendar, Ticket, Radio, Loader2, Send, X, Monitor,
    Grid, PictureInPicture2, Pin, PinOff, Wifi, WifiOff, BarChart2,
    Eye, Clock, TrendingUp, ChevronDown, Volume2, VolumeX, Camera,
    MoreVertical, AlertCircle, CheckCircle2, Minimize2, Cast,
} from "lucide-react";
import io from "socket.io-client";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import useAgoraLive from "../hooks/useAgoraLive";
import { UserAvatar } from "../components/ui/avatar";
import {
    canManageTickets as canManageEventTickets,
    isEventBroadcaster,
} from "../utils/eventPermissions";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");
const SOCKET_URL = SERVER_URL;

/* ─── Layout modes for multi-camera ─── */
const LAYOUT_MODES = {
    SINGLE: "single",
    GRID: "grid",
    PIP: "pip",
    FOCUS: "focus",
};

/* ─── Analytics mock data helper ─── */
const useStreamAnalytics = (isLive) => {
    const [analytics, setAnalytics] = useState({
        peakViewers: 0,
        avgWatchTime: 0,
        chatMessages: 0,
        dropOffRate: 0,
        watchTimeHistory: [],
    });

    useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(() => {
            setAnalytics((prev) => ({
                ...prev,
                peakViewers: Math.max(prev.peakViewers, Math.floor(Math.random() * 50) + 10),
                avgWatchTime: Math.floor(Math.random() * 20) + 5,
                dropOffRate: Math.floor(Math.random() * 15) + 2,
            }));
        }, 10000);
        return () => clearInterval(interval);
    }, [isLive]);

    return analytics;
};

/* ─── Network quality indicator ─── */
function NetworkQuality({ quality }) {
    const bars = [1, 2, 3, 4];
    const level = quality || 3;
    return (
        <div className="flex items-end gap-0.5 h-4" title={`Network: ${level === 4 ? "Excellent" : level === 3 ? "Good" : level === 2 ? "Fair" : "Poor"}`}>
            {bars.map((b) => (
                <div
                    key={b}
                    style={{ height: `${b * 25}%` }}
                    className={`w-1 rounded-sm transition-colors ${b <= level ? "bg-green-400" : "bg-white/20"}`}
                />
            ))}
        </div>
    );
}

/* ─── Toast notification ─── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
    };
    const icons = {
        success: <CheckCircle2 size={16} />,
        error: <AlertCircle size={16} />,
        info: <Info size={16} />,
    };
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg ${colors[type]} animate-in slide-in-from-bottom-2 duration-300`}>
            {icons[type]}{message}
        </div>
    );
}

/* ─── Camera Feed Tile ─── */
function FeedTile({ label, containerRef, isPinned, onPin, isLocal, isEmpty, className = "" }) {
    return (
        <div className={`relative bg-gray-950 rounded-xl overflow-hidden group ${isPinned ? "ring-2 ring-pink-500" : ""} ${className}`}>
            {isEmpty ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                    <Camera size={28} />
                    <span className="text-xs mt-1.5">No feed</span>
                </div>
            ) : (
                <div ref={containerRef} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                <span className="text-white text-[11px] font-semibold">{label}</span>
                <div className="flex gap-1">
                    {onPin && (
                        <button onClick={onPin} className="p-1 rounded-md bg-white/15 text-white hover:bg-white/25 transition">
                            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                    )}
                </div>
            </div>
            {isLocal && (
                <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white text-[10px] font-bold">YOU</span>
                </div>
            )}
        </div>
    );
}

/* ─── Multi-Camera Grid ─── */
function MultiCameraGrid({ feeds, layoutMode, pinnedFeed, onPin, localContainerRef, remoteContainerRef }) {
    if (layoutMode === LAYOUT_MODES.SINGLE || feeds.length <= 1) {
        return (
            <div ref={feeds[0]?.isLocal ? localContainerRef : remoteContainerRef}
                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        );
    }

    if (layoutMode === LAYOUT_MODES.PIP) {
        const main = feeds.find((f) => f.id === pinnedFeed) || feeds[0];
        const pip = feeds.filter((f) => f.id !== main.id).slice(0, 3);
        return (
            <div className="relative w-full h-full">
                <div ref={main.isLocal ? localContainerRef : remoteContainerRef}
                    className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                <div className="absolute bottom-16 right-4 flex flex-col gap-2">
                    {pip.map((f, i) => (
                        <div key={f.id} onClick={() => onPin(f.id)}
                            className="w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden border-2 border-white/20 cursor-pointer hover:border-pink-400 transition bg-gray-900 shadow-xl">
                            <div className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                            <div className="absolute inset-0 flex items-end p-1">
                                <span className="text-[10px] text-white/70 font-medium">{f.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Grid mode
    const count = feeds.length;
    const cols = count <= 2 ? 2 : count <= 4 ? 2 : 3;
    return (
        <div className={`grid w-full h-full gap-1 p-1`}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {feeds.map((f) => (
                <FeedTile
                    key={f.id}
                    label={f.label}
                    containerRef={f.isLocal ? localContainerRef : remoteContainerRef}
                    isPinned={pinnedFeed === f.id}
                    onPin={() => onPin(f.id)}
                    isLocal={f.isLocal}
                    isEmpty={f.isEmpty}
                />
            ))}
        </div>
    );
}

/* ─── Analytics Panel ─── */
function AnalyticsPanel({ analytics, viewerCount, isLive }) {
    const stats = [
        { icon: <Eye size={14} />, label: "Live viewers", value: viewerCount.toLocaleString(), color: "text-blue-400" },
        { icon: <TrendingUp size={14} />, label: "Peak viewers", value: analytics.peakViewers.toLocaleString(), color: "text-green-400" },
        { icon: <Clock size={14} />, label: "Avg watch time", value: `${analytics.avgWatchTime}m`, color: "text-yellow-400" },
        { icon: <BarChart2 size={14} />, label: "Chat messages", value: analytics.chatMessages.toLocaleString(), color: "text-pink-400" },
        { icon: <Users size={14} />, label: "Drop-off rate", value: `${analytics.dropOffRate}%`, color: "text-orange-400" },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-gray-400"}`} />
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                    {isLive ? "Live analytics" : "Analytics unavailable"}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                {stats.map((s) => (
                    <div key={s.label} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className={`flex items-center gap-1.5 mb-1 ${s.color}`}>{s.icon}
                            <span className="text-[10px] font-semibold text-gray-400">{s.label}</span>
                        </div>
                        <p className="text-lg font-extrabold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>
            {!isLive && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    Analytics populate when stream is live.
                </div>
            )}
        </div>
    );
}

/* ─── Chat Message ─── */
function ChatMessage({ msg }) {
    return (
        <div className="flex items-start gap-2 group">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.isAdmin ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"}`}>
                {(msg.user || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <span className={`font-semibold text-xs mr-1 ${msg.isAdmin ? "text-pink-600" : "text-gray-700"}`}>
                    {msg.user}{msg.isAdmin && <span className="ml-1 px-1 py-0.5 rounded bg-pink-100 text-pink-600 text-[9px] font-bold">HOST</span>}
                </span>
                <span className="text-sm text-gray-600 break-words">{msg.text}</span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function LiveStream() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewerCount, setViewerCount] = useState(0);
    const [chatMessage, setChatMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const { user } = useAuth();
    const currentUserId = user?.id || user?._id;
    const { toProfile } = useProfileNavigation();
    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);

    const isBroadcaster = useMemo(
        () => isEventBroadcaster(event, currentUserId),
        [event, currentUserId]
    );

    /* ─── UI State ─── */
    const [hostPanelTab, setHostPanelTab] = useState("chat");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [layoutMode, setLayoutMode] = useState(LAYOUT_MODES.SINGLE);
    const [pinnedFeed, setPinnedFeed] = useState("main");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(3);
    const [toast, setToast] = useState(null);

    /* ─── Attendees / Stream control ─── */
    const [attendees, setAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesError, setAttendeesError] = useState(null);
    const [endStreamConfirm, setEndStreamConfirm] = useState(false);
    const [endingStream, setEndingStream] = useState(false);
    const [startingStream, setStartingStream] = useState(false);

    const socketRef = useRef();
    const videoContainerRef = useRef();

    const isCameraStream = !event?.liveStream?.streamType || event.liveStream.streamType === "Camera";
    const agoraEnabled = Boolean(eventId && isCameraStream && event && (isBroadcaster || event.liveStream?.isLive));
    const analytics = useStreamAnalytics(event?.liveStream?.isLive);

    const {
        localContainerRef, remoteContainerRef,
        isReady: agoraReady, hasRemoteStream,
        isMuted, isVideoOff, mediaError, accessError,
        toggleAudio, toggleVideo, retry: retryAgora,
    } = useAgoraLive({ eventId, isHost: isBroadcaster, enabled: agoraEnabled });

    /* ─── Feeds definition ─── */
    const feeds = useMemo(() => {
        const list = [];
        if (isBroadcaster) {
            list.push({ id: "main", label: "Main camera", isLocal: true, isEmpty: !agoraReady });
            list.push({ id: "screen", label: "Screen share", isLocal: false, isEmpty: true });
        } else {
            list.push({ id: "main", label: "Host", isLocal: false, isEmpty: !hasRemoteStream });
        }
        return list;
    }, [isBroadcaster, agoraReady, hasRemoteStream]);

    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
    }, []);

    /* ─── Socket / Event setup ─── */
    useEffect(() => {
        if (!eventId) return;
        API.get(`/events/${eventId}`)
            .then((res) => {
                const eventData = res.data;
                setEvent(eventData);
                setLoading(false);
                setHostPanelTab(canManageEventTickets(eventData) ? "attendees" : "chat");
                socketRef.current = io(SOCKET_URL, {
                    auth: { token: localStorage.getItem("token") },
                    transports: ["websocket", "polling"],
                    withCredentials: true,
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 10,
                });
                socketRef.current.emit("joinRoom", eventId);
                socketRef.current.on("receiveMessage", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });
                socketRef.current.on("viewerCount", (count) => setViewerCount(count));
                socketRef.current.on("disconnect", () => showToast("Connection lost — reconnecting…", "error"));
                socketRef.current.on("reconnect", () => showToast("Reconnected!", "success"));
            })
            .catch(() => setLoading(false));
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [currentUserId, eventId, showToast]);

    /* ─── Auto-scroll chat ─── */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ─── Track analytics message count ─── */
    useEffect(() => {
        analytics.chatMessages = messages.length;
    }, [messages, analytics]);

    /* ─── Attendees ─── */
    useEffect(() => {
        if (!isBroadcaster || !eventId || !canManageEventTickets(event)) return;
        setAttendeesLoading(true);
        API.get(`/events/buyers/${eventId}`)
            .then((res) => { setAttendees(res.data || []); setAttendeesLoading(false); })
            .catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); });
    }, [isBroadcaster, eventId, event]);

    /* ─── Fullscreen tracking ─── */
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onFsChange);
        return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    /* ─── Simulated network quality ─── */
    useEffect(() => {
        const t = setInterval(() => setNetworkQuality(Math.floor(Math.random() * 2) + 3), 15000);
        return () => clearInterval(t);
    }, []);

    const sendMessage = useCallback((e) => {
        if (e.key === "Enter" || e.type === "click") {
            if (!chatMessage.trim()) return;
            const msg = { id: Date.now(), user: user?.username || "Guest", text: chatMessage, eventId, isAdmin: isBroadcaster };
            socketRef.current?.emit("sendMessage", msg);
            setChatMessage("");
        }
    }, [chatMessage, user, eventId, isBroadcaster]);

    const toggleFullscreen = useCallback(() => {
        const el = videoContainerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
    }, []);

    const handleEndStream = useCallback(() => {
        if (!eventId || !endStreamConfirm) return;
        setEndingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: false })
            .then(() => {
                setEvent((prev) => ({ ...prev, liveStream: { ...(prev?.liveStream || {}), isLive: false } }));
                setEndStreamConfirm(false);
                retryAgora();
                showToast("Stream ended", "info");
            })
            .catch(() => showToast("Failed to end stream. Try again.", "error"))
            .finally(() => setEndingStream(false));
    }, [eventId, endStreamConfirm, retryAgora, showToast]);

    const handleGoLive = useCallback(() => {
        if (!eventId || startingStream) return;
        setStartingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: true })
            .then(() => {
                setEvent((prev) => ({ ...prev, liveStream: { ...(prev?.liveStream || {}), isLive: true } }));
                retryAgora();
                showToast("You're live! 🎉", "success");
            })
            .catch(() => showToast("Failed to go live. Try again.", "error"))
            .finally(() => setStartingStream(false));
    }, [eventId, startingStream, retryAgora, showToast]);

    /* ─── Loading / error states ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-950 font-geist">
                <div className="w-10 h-10 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading stream…</p>
            </div>
        );
    }
    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950 font-geist">
                <VideoIcon size={48} className="text-gray-700" />
                <h2 className="text-xl font-extrabold text-white">Stream not found</h2>
                <Link to="/live/events" className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600">
                    Return to Live
                </Link>
            </div>
        );
    }

    const isLive = event.liveStream?.isLive;
    const showControls = (isCameraStream && (isBroadcaster ? agoraReady : hasRemoteStream)) ||
        (!isCameraStream && event.liveStream?.streamURL);

    /* ─── Video area renderer ─── */
    const renderVideoArea = () => {
        if (isCameraStream) {
            if (accessError?.code === "TICKET_REQUIRED") {
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <Ticket size={28} className="text-pink-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Ticket required</h3>
                            <p className="text-sm text-white/50 max-w-sm">{accessError.message}</p>
                        </div>
                        <Link to={`/event/${eventId}`}
                            className="px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition shadow-lg shadow-pink-500/30">
                            Get tickets
                        </Link>
                    </div>
                );
            }

            if (accessError?.code === "STREAM_NOT_LIVE") {
                if (isBroadcaster) {
                    return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gray-950 p-6 text-center">
                            <div ref={localContainerRef}
                                className="absolute inset-0 opacity-0 pointer-events-none [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                                aria-hidden />
                            <div className="relative z-10 w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                                <Radio size={28} className="text-pink-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-extrabold text-white mb-1">Ready to go live</h3>
                                <p className="text-sm text-white/50 max-w-sm">Start your broadcast when ready. Viewers will join once you go live.</p>
                            </div>
                            <button onClick={handleGoLive} disabled={startingStream}
                                className="relative z-10 flex items-center gap-2 px-8 py-3.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-lg shadow-pink-500/30">
                                {startingStream ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                                {startingStream ? "Going live…" : "Go live now"}
                            </button>
                        </div>
                    );
                }
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950 text-white p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Radio size={28} className="text-white/30" />
                        </div>
                        <h3 className="text-lg font-bold">Stream hasn't started yet</h3>
                        <p className="text-sm text-white/50 max-w-sm">Check back when the host goes live. This page updates automatically.</p>
                    </div>
                );
            }

            if (accessError) {
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950 text-white p-6 text-center">
                        <AlertCircle size={40} className="text-red-400" />
                        <p className="text-sm text-white/70">{accessError.message}</p>
                        <button onClick={retryAgora}
                            className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition">
                            Try again
                        </button>
                    </div>
                );
            }

            if (isBroadcaster && !agoraReady && !accessError) {
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950 text-white p-6 text-center">
                        <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                        <h3 className="text-base font-bold">Connecting broadcast…</h3>
                        <p className="text-sm text-white/50">Allow camera and microphone when prompted.</p>
                        {mediaError && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle size={14} />{mediaError}
                            </div>
                        )}
                        <button onClick={retryAgora}
                            className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition shadow-lg shadow-pink-500/30">
                            Retry connection
                        </button>
                    </div>
                );
            }

            return (
                <>
                    {layoutMode === LAYOUT_MODES.GRID ? (
                        <MultiCameraGrid
                            feeds={feeds}
                            layoutMode={layoutMode}
                            pinnedFeed={pinnedFeed}
                            onPin={setPinnedFeed}
                            localContainerRef={localContainerRef}
                            remoteContainerRef={remoteContainerRef}
                        />
                    ) : (
                        <>
                            <div
                                ref={isBroadcaster ? localContainerRef : remoteContainerRef}
                                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                            />
                            {!isBroadcaster && !hasRemoteStream && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950 text-white">
                                    <div className="w-10 h-10 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                                    <p className="text-sm text-white/50">Waiting for broadcaster…</p>
                                </div>
                            )}
                            {/* PiP overlay for host extra feeds */}
                            {isBroadcaster && layoutMode === LAYOUT_MODES.PIP && (
                                <div className="absolute bottom-20 right-4 w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-900 shadow-2xl cursor-pointer hover:border-pink-400 transition group">
                                    <div className="absolute inset-0 flex items-center justify-center text-white/30 group-hover:text-white/50 transition">
                                        <Camera size={24} />
                                    </div>
                                    <div className="absolute bottom-1 left-2 text-[10px] text-white/60 font-medium">Screen share</div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Pre-live overlay for broadcaster */}
                    {isBroadcaster && agoraReady && !isLive && !accessError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/60 backdrop-blur-sm z-10 text-center p-6">
                            <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                                Preview mode
                            </div>
                            <p className="text-sm text-white/70 max-w-xs">Viewers can't see you yet. Start the stream when you're ready.</p>
                            <button onClick={handleGoLive} disabled={startingStream}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-lg shadow-pink-500/30">
                                {startingStream ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                                {startingStream ? "Going live…" : "Go live"}
                            </button>
                        </div>
                    )}
                </>
            );
        }

        /* External stream URL */
        if (event.liveStream?.streamURL) {
            return (
                <iframe
                    width="100%" height="100%"
                    src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
                    title="Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen className="w-full h-full border-0"
                />
            );
        }

        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-950 text-white">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <VideoIcon size={32} strokeWidth={1.5} className="text-white/30" />
                </div>
                <h3 className="font-bold mb-1">{isBroadcaster ? "No stream URL configured" : "Stream not available"}</h3>
                <p className="text-sm text-white/40 max-w-xs mb-4">
                    {isBroadcaster ? "Add a YouTube or RTMP URL in your event settings." : "This stream hasn't been configured yet."}
                </p>
                {isBroadcaster && (
                    <Link to={`/event/${eventId}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition">
                        <SettingsIcon size={14} /> Event settings
                    </Link>
                )}
            </div>
        );
    };

    /* ─── Chat panel (reused in both host and viewer sidebar) ─── */
    const ChatPanel = (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <MessageCircle size={28} className="mb-2 opacity-40" />
                        <p className="text-sm font-medium">No messages yet</p>
                        <p className="text-xs text-gray-300 mt-0.5">Say something to kick things off!</p>
                    </div>
                ) : (
                    messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full border-2 border-gray-200 bg-gray-50 focus-within:border-pink-400 focus-within:bg-white transition-all">
                    <input
                        ref={chatInputRef}
                        type="text"
                        placeholder="Send a message…"
                        className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={sendMessage}
                        maxLength={300}
                    />
                    <button onClick={sendMessage}
                        disabled={!chatMessage.trim()}
                        className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center transition hover:bg-pink-600 disabled:opacity-40 flex-shrink-0">
                        <Send size={12} />
                    </button>
                </div>
            </div>
        </>
    );

    /* ═══════════ RENDER ═══════════ */
    return (
        <div className={`flex min-h-screen h-screen bg-white overflow-hidden font-geist ${isBroadcaster ? "host-view" : "viewer-view"}`}>

            {/* ── MAIN STREAM COLUMN ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Video Player */}
                <div
                    ref={videoContainerRef}
                    className="relative bg-black flex-shrink-0"
                    style={{ aspectRatio: "16/9", maxHeight: sidebarOpen ? "calc(100vh - 280px)" : "70vh" }}
                >
                    {renderVideoArea()}

                    {/* ── Top HUD ── */}
                    <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between pointer-events-none z-10">
                        {/* Left: Live + viewer count */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {isLive ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-red-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                                </span>
                            ) : agoraReady && isBroadcaster ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/80 backdrop-blur-sm text-white text-xs font-bold uppercase">
                                    Preview
                                </span>
                            ) : null}
                            {isLive && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
                                    <Users size={11} /> {viewerCount.toLocaleString()}
                                </span>
                            )}
                        </div>

                        {/* Right: network + host status badges */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {isBroadcaster && agoraReady && (
                                <>
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-sm text-xs font-semibold border ${isMuted ? "bg-red-500/80 text-white border-red-500/30" : "bg-black/50 text-white border-white/10"}`}>
                                        {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                                    </span>
                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-sm text-xs font-semibold border ${isVideoOff ? "bg-red-500/80 text-white border-red-500/30" : "bg-black/50 text-white border-white/10"}`}>
                                        {isVideoOff ? <VideoOff size={11} /> : <VideoIcon size={11} />}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
                                        <NetworkQuality quality={networkQuality} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Bottom Controls ── */}
                    {showControls && (
                        <div className={`absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 transition-opacity duration-200 ${isBroadcaster ? "opacity-100" : "opacity-0 hover:opacity-100 focus-within:opacity-100"}`}>
                            <div className="flex items-center justify-between gap-3">

                                {/* Left controls (host only) */}
                                <div className="flex items-center gap-1.5">
                                    {isBroadcaster && (
                                        <>
                                            <button onClick={toggleAudio} disabled={!agoraReady}
                                                title={isMuted ? "Unmute" : "Mute"}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-40 ${isMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/15 text-white hover:bg-white/25"}`}>
                                                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                                <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mic"}</span>
                                            </button>
                                            <button onClick={toggleVideo} disabled={!agoraReady}
                                                title={isVideoOff ? "Start camera" : "Stop camera"}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all disabled:opacity-40 ${isVideoOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/15 text-white hover:bg-white/25"}`}>
                                                {isVideoOff ? <VideoOff size={14} /> : <VideoIcon size={14} />}
                                                <span className="hidden sm:inline">{isVideoOff ? "Camera off" : "Camera"}</span>
                                            </button>

                                            {/* Layout switcher */}
                                            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/15">
                                                {[
                                                    { mode: LAYOUT_MODES.SINGLE, icon: <Monitor size={13} />, title: "Single view" },
                                                    { mode: LAYOUT_MODES.GRID, icon: <Grid size={13} />, title: "Grid view" },
                                                    { mode: LAYOUT_MODES.PIP, icon: <PictureInPicture2 size={13} />, title: "Picture-in-picture" },
                                                ].map(({ mode, icon, title }) => (
                                                    <button key={mode} onClick={() => setLayoutMode(mode)} title={title}
                                                        className={`p-1.5 rounded-full transition-all ${layoutMode === mode ? "bg-white text-gray-900" : "text-white hover:bg-white/20"}`}>
                                                        {icon}
                                                    </button>
                                                ))}
                                            </div>

                                            {isLive && (
                                                <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-500 text-white text-xs font-semibold transition hover:bg-red-600 disabled:opacity-40">
                                                    {endingStream ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                                                    <span className="hidden sm:inline">End live</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Right controls */}
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => setSidebarOpen((v) => !v)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition">
                                        <MessageCircle size={14} />
                                        <span className="hidden sm:inline">Chat</span>
                                    </button>
                                    <button onClick={toggleFullscreen}
                                        className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition">
                                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Stream Info ── */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="p-4 sm:p-5 border-b border-gray-100">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {isLive && (
                                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-bold uppercase tracking-wide border border-red-100">
                                            Live now
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">{event.category || "Event"}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 truncate">
                                    {event.title}
                                </h1>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={11} />
                                        {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                    {isLive && (
                                        <span className="flex items-center gap-1">
                                            <Users size={11} /> {viewerCount.toLocaleString()} watching
                                        </span>
                                    )}
                                </div>
                            </div>

                            {isBroadcaster ? (
                                <div className="flex gap-2">
                                    {isLive ? (
                                        <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition shadow-md shadow-red-500/20">
                                            {endingStream ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                                            End stream
                                        </button>
                                    ) : (
                                        <button onClick={handleGoLive} disabled={startingStream}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition shadow-md shadow-pink-500/20">
                                            {startingStream ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                                            Go live
                                        </button>
                                    )}
                                    <Link to={`/event/${eventId}`}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition">
                                        <SettingsIcon size={14} /> Settings
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:border-pink-200 hover:text-pink-500 transition">
                                        <Share2 size={14} /> Share
                                    </button>
                                    <button className="p-2 rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition">
                                        <Flag size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Creator strip (viewers only) */}
                    {!isBroadcaster && (
                        <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => toProfile(event.createdBy)}
                                    className="flex items-center gap-3 min-w-0 text-left group">
                                    <UserAvatar user={event.createdBy} className="w-10 h-10 rounded-xl border-2 border-pink-100 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-pink-600 transition">
                                            {event.createdBy?.username || "Organizer"}
                                        </p>
                                        <p className="text-xs text-gray-400">Event organizer</p>
                                    </div>
                                </button>
                                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition shadow-md shadow-pink-500/20 flex-shrink-0">
                                    <Heart size={14} /> Follow
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="px-4 sm:px-5 py-4">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {event.description || "Join us for this amazing live event! Interact in the chat and enjoy the show."}
                        </p>
                    </div>

                    {/* Mobile chat (visible when sidebar hidden or on small screens) */}
                    <div className={`border-t border-gray-100 lg:hidden ${sidebarOpen ? "hidden" : "block"}`}>
                        <div className="h-64 flex flex-col">
                            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 bg-gray-50/80 text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">
                                <MessageCircle size={12} /> Live Chat
                            </div>
                            {ChatPanel}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SIDEBAR ── */}
            {sidebarOpen && (
                <aside className={`
                    flex flex-col bg-white border-l border-gray-100 flex-shrink-0 overflow-hidden
                    w-full lg:w-[340px] xl:w-[380px]
                    ${sidebarOpen ? "flex" : "hidden lg:flex"}
                    absolute inset-0 z-30 lg:relative lg:inset-auto lg:z-auto
                    lg:translate-x-0
                `}>
                    {/* Sidebar close (mobile) */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden bg-white flex-shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                            {isBroadcaster ? "Host Panel" : "Live Chat"}
                        </span>
                        <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                            <X size={16} />
                        </button>
                    </div>

                    {isBroadcaster ? (
                        /* ── HOST PANEL ── */
                        <>
                            <div className="flex p-1.5 gap-0.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0 overflow-x-auto">
                                {[
                                    canManageEventTickets(event) && { id: "attendees", icon: <UserCheck size={13} />, label: "Attendees", badge: attendees.length || null },
                                    { id: "chat", icon: <MessageCircle size={13} />, label: "Chat", badge: null },
                                    { id: "analytics", icon: <BarChart2 size={13} />, label: "Analytics", badge: null },
                                    { id: "event", icon: <Calendar size={13} />, label: "Event", badge: null },
                                ].filter(Boolean).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setHostPanelTab(tab.id)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${hostPanelTab === tab.id ? "bg-white text-pink-600 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"}`}>
                                        {tab.icon}{tab.label}
                                        {tab.badge > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-bold">{tab.badge}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                                {/* Attendees tab */}
                                {hostPanelTab === "attendees" && canManageEventTickets(event) && (
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                            Ticket holders ({attendees.length})
                                        </p>
                                        {attendeesLoading && (
                                            <div className="flex items-center justify-center py-10 text-gray-400">
                                                <Loader2 size={20} className="animate-spin" />
                                            </div>
                                        )}
                                        {attendeesError && (
                                            <div className="text-center py-6">
                                                <p className="text-sm text-red-500 mb-3">{attendeesError}</p>
                                                <button onClick={() => { setAttendeesError(null); setAttendeesLoading(true); API.get(`/events/buyers/${eventId}`).then((res) => { setAttendees(res.data || []); setAttendeesLoading(false); }).catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); }); }}
                                                    className="px-4 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600">
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                        {!attendeesLoading && !attendeesError && attendees.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                                <Users size={24} className="mb-2 opacity-40" />
                                                <p className="text-sm">No attendees yet</p>
                                            </div>
                                        )}
                                        {!attendeesLoading && !attendeesError && attendees.length > 0 && (
                                            <div className="space-y-1.5">
                                                {attendees.map((t) => (
                                                    <button key={t._id}
                                                        onClick={() => toProfile(t.buyer)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 border border-gray-100 hover:border-pink-100 transition text-left">
                                                        <UserAvatar user={t.buyer} className="w-8 h-8 rounded-full flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm text-gray-900 truncate">{t.buyer?.username || "Guest"}</p>
                                                            <p className="text-[11px] text-gray-400">{t.ticketType} · {t.quantity} ticket{t.quantity > 1 ? "s" : ""}</p>
                                                        </div>
                                                        <Ticket size={12} className="text-gray-300 flex-shrink-0" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Chat tab */}
                                {hostPanelTab === "chat" && ChatPanel}

                                {/* Analytics tab */}
                                {hostPanelTab === "analytics" && (
                                    <AnalyticsPanel analytics={analytics} viewerCount={viewerCount} isLive={isLive} />
                                )}

                                {/* Event tab */}
                                {hostPanelTab === "event" && (
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400 mb-3">Event details</p>
                                        <div className="space-y-2">
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <p className="font-bold text-sm text-gray-900 mb-2">{event.title}</p>
                                                <div className="space-y-1.5">
                                                    <p className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                    <p className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Ticket size={12} className="text-gray-400" />
                                                        {event.ticketsSold ?? 0} / {event.totalTickets ?? 0} tickets sold
                                                    </p>
                                                    <p className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Users size={12} className="text-gray-400" />
                                                        {viewerCount} current viewers
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Stream type badge */}
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Stream type</p>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold border border-pink-100">
                                                    {isCameraStream ? <><Camera size={11} /> TickiSpot Camera</> : <><Cast size={11} /> External stream</>}
                                                </span>
                                            </div>

                                            {/* Layout controls */}
                                            {isCameraStream && (
                                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Camera layout</p>
                                                    <div className="flex gap-1.5">
                                                        {[
                                                            { mode: LAYOUT_MODES.SINGLE, icon: <Monitor size={13} />, label: "Single" },
                                                            { mode: LAYOUT_MODES.GRID, icon: <Grid size={13} />, label: "Grid" },
                                                            { mode: LAYOUT_MODES.PIP, icon: <PictureInPicture2 size={13} />, label: "PiP" },
                                                        ].map(({ mode, icon, label }) => (
                                                            <button key={mode} onClick={() => setLayoutMode(mode)}
                                                                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition ${layoutMode === mode ? "bg-pink-500 text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-pink-200 hover:text-pink-500"}`}>
                                                                {icon}{label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            {isLive ? (
                                                <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50">
                                                    {endingStream ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
                                                    End stream
                                                </button>
                                            ) : (
                                                <button onClick={handleGoLive} disabled={startingStream}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition disabled:opacity-50">
                                                    {startingStream ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
                                                    Go live
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── VIEWER CHAT PANEL ── */
                        <>
                            <div className="hidden lg:flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 text-[0.6rem] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/80 flex-shrink-0">
                                <MessageCircle size={13} className="text-pink-400" /> Live Chat
                                <span className="ml-auto text-gray-300">{messages.length} messages</span>
                            </div>
                            {ChatPanel}
                        </>
                    )}
                </aside>
            )}

            {/* ── SIDEBAR TOGGLE (desktop) ── */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="hidden lg:flex flex-col items-center justify-center w-10 bg-white border-l border-gray-100 text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition gap-1 flex-shrink-0">
                    <MessageCircle size={16} />
                    {messages.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {Math.min(messages.length, 9)}
                        </span>
                    )}
                </button>
            )}

            {/* ── END STREAM MODAL ── */}
            {isBroadcaster && endStreamConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Radio size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">End stream?</h3>
                                <p className="text-xs text-gray-400">This will disconnect all viewers.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">
                            The stream will end for everyone watching. You can start it again from this page.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setEndStreamConfirm(false)} disabled={endingStream}
                                className="flex-1 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button onClick={handleEndStream} disabled={endingStream}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50">
                                {endingStream ? <Loader2 size={14} className="animate-spin" /> : null}
                                End stream
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOAST ── */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}