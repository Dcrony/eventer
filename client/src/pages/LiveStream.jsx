import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import {
    Users, Heart, Share2, MessageCircle, Settings as SettingsIcon,
    Maximize, Flag, Info, Mic, MicOff, Video as VideoIcon, VideoOff,
    UserCheck, Calendar, Ticket, Radio, Loader2, Send, X, Monitor,
    Grid, PictureInPicture2, Pin, PinOff, Wifi, WifiOff, BarChart2,
    Eye, Clock, TrendingUp, ChevronDown, Volume2, VolumeX, Camera,
    MoreVertical, AlertCircle, CheckCircle2, Minimize2, Cast, ChevronUp,
    ThumbsUp, Bell, SkipForward, Pause, Play,
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

const LAYOUT_MODES = { SINGLE: "single", GRID: "grid", PIP: "pip" };

/* ─── Analytics hook ─── */
const useStreamAnalytics = (isLive) => {
    const [analytics, setAnalytics] = useState({
        peakViewers: 0, avgWatchTime: 0, chatMessages: 0, dropOffRate: 0,
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

/* ─── Network bars ─── */
function NetworkQuality({ quality }) {
    const bars = [1, 2, 3, 4];
    const level = quality || 3;
    return (
        <div className="flex items-end gap-[2px] h-3.5">
            {bars.map((b) => (
                <div key={b} style={{ height: `${b * 25}%` }}
                    className={`w-[3px] rounded-sm transition-colors ${b <= level ? "bg-green-400" : "bg-white/25"}`} />
            ))}
        </div>
    );
}

/* ─── Toast ─── */
function Toast({ message, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    const bg = { success: "bg-green-500", error: "bg-red-500", info: "bg-gray-800" }[type];
    const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }[type];
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-xl ${bg}`}>
            <Icon size={15} />{message}
        </div>
    );
}

/* ─── Live badge ─── */
function LiveBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
        </span>
    );
}

/* ─── Chat message bubble ─── */
function ChatMsg({ msg }) {
    return (
        <div className="flex items-start gap-2">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.isAdmin ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                {(msg.user || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <span className={`text-xs font-bold mr-1.5 ${msg.isAdmin ? "text-pink-500" : "text-gray-200"}`}>
                    {msg.user}
                    {msg.isAdmin && <span className="ml-1 px-1 py-px rounded-sm bg-pink-500/20 text-pink-400 text-[9px]">HOST</span>}
                </span>
                <span className="text-sm text-gray-100 break-words leading-snug">{msg.text}</span>
            </div>
        </div>
    );
}

/* ─── Sidebar chat input ─── */
function ChatInput({ value, onChange, onSend }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10">
            <input
                type="text"
                placeholder="Chat with viewers…"
                className="flex-1 bg-white/10 text-white placeholder:text-white/40 text-sm rounded-full px-4 py-2 outline-none focus:bg-white/15 transition"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                maxLength={300}
            />
            <button onClick={onSend} disabled={!value.trim()}
                className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition disabled:opacity-40 flex-shrink-0">
                <Send size={13} />
            </button>
        </div>
    );
}

/* ─── Analytics panel ─── */
function AnalyticsPanel({ analytics, viewerCount, isLive }) {
    const stats = [
        { label: "Live viewers", value: viewerCount.toLocaleString(), icon: Eye, color: "text-blue-400" },
        { label: "Peak viewers", value: analytics.peakViewers.toLocaleString(), icon: TrendingUp, color: "text-green-400" },
        { label: "Avg watch time", value: `${analytics.avgWatchTime}m`, icon: Clock, color: "text-yellow-400" },
        { label: "Messages", value: analytics.chatMessages.toLocaleString(), icon: MessageCircle, color: "text-pink-400" },
        { label: "Drop-off rate", value: `${analytics.dropOffRate}%`, icon: BarChart2, color: "text-orange-400" },
    ];
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {isLive ? "Live analytics" : "Offline"}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {stats.map((s) => (
                    <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <s.icon size={13} className={`${s.color} mb-1`} />
                        <p className="text-[10px] text-gray-400 mb-0.5">{s.label}</p>
                        <p className="text-lg font-extrabold text-white">{s.value}</p>
                    </div>
                ))}
            </div>
            {!isLive && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                    <AlertCircle size={13} />Analytics populate when you go live.
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════ MAIN ═══════════════════════ */
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
    const socketRef = useRef();
    const videoContainerRef = useRef();

    const isBroadcaster = useMemo(() => isEventBroadcaster(event, currentUserId), [event, currentUserId]);

    /* UI state */
    const [hostTab, setHostTab] = useState("chat");
    const [sidePanel, setSidePanel] = useState("chat"); // chat | info | attendees | analytics
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [layoutMode, setLayoutMode] = useState(LAYOUT_MODES.SINGLE);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(3);
    const [toast, setToast] = useState(null);
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimerRef = useRef(null);

    /* Mobile chat overlay */
    const [mobileChatOpen, setMobileChatOpen] = useState(true);

    /* Stream control */
    const [attendees, setAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesError, setAttendeesError] = useState(null);
    const [endStreamConfirm, setEndStreamConfirm] = useState(false);
    const [endingStream, setEndingStream] = useState(false);
    const [startingStream, setStartingStream] = useState(false);
    const [isFollowingOrganizer, setIsFollowingOrganizer] = useState(false);
    const [organizerFollowLoading, setOrganizerFollowLoading] = useState(false);
    const [liked, setLiked] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    const isCameraStream = !event?.liveStream?.streamType || event.liveStream.streamType === "Camera";
    const agoraEnabled = Boolean(eventId && isCameraStream && event && (isBroadcaster || event.liveStream?.isLive));

    const {
        localContainerRef, remoteContainerRef,
        isReady: agoraReady, hasRemoteStream,
        isMuted, isVideoOff, mediaError, accessError,
        toggleAudio, toggleVideo, retry: retryAgora,
    } = useAgoraLive({ eventId, isHost: isBroadcaster, enabled: agoraEnabled });

    const analytics = useStreamAnalytics(event?.liveStream?.isLive);
    const showToast = useCallback((message, type = "info") => setToast({ message, type }), []);

    /* Auto-hide controls */
    const resetControlsTimer = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(controlsTimerRef.current);
        if (!isBroadcaster) {
            controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
        }
    }, [isBroadcaster]);

    /* Socket + event load */
    useEffect(() => {
        if (!eventId) return;
        API.get(`/events/${eventId}`).then((res) => {
            const ev = res.data;
            setEvent(ev);
            setIsFollowingOrganizer(Boolean(ev?.createdBy?.isFollowing));
            setLoading(false);
            const defaultTab = canManageEventTickets(ev) ? "attendees" : "chat";
            setHostTab(defaultTab);
            setSidePanel(defaultTab);

            socketRef.current = io(SOCKET_URL, {
                auth: { token: localStorage.getItem("token") },
                transports: ["websocket", "polling"],
                withCredentials: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10,
            });
            socketRef.current.emit("joinRoom", eventId);
            socketRef.current.on("receiveMessage", (msg) => setMessages((p) => [...p, msg]));
            socketRef.current.on("viewerCount", (count) => setViewerCount(count));
            socketRef.current.on("disconnect", () => showToast("Connection lost…", "error"));
            socketRef.current.on("reconnect", () => showToast("Reconnected!", "success"));
        }).catch(() => setLoading(false));
        return () => { socketRef.current?.disconnect(); };
    }, [currentUserId, eventId, showToast]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { analytics.chatMessages = messages.length; }, [messages, analytics]);

    useEffect(() => {
        if (!isBroadcaster || !eventId || !canManageEventTickets(event)) return;
        setAttendeesLoading(true);
        API.get(`/events/buyers/${eventId}`)
            .then((res) => { setAttendees(res.data || []); setAttendeesLoading(false); })
            .catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); });
    }, [isBroadcaster, eventId, event]);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onFsChange);
        return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setNetworkQuality(Math.floor(Math.random() * 2) + 3), 15000);
        return () => clearInterval(t);
    }, []);

    const sendMessage = useCallback(() => {
        if (!chatMessage.trim()) return;
        const msg = { id: Date.now(), user: user?.username || "Guest", text: chatMessage, eventId, isAdmin: isBroadcaster };
        socketRef.current?.emit("sendMessage", msg);
        setChatMessage("");
    }, [chatMessage, user, eventId, isBroadcaster]);

    const toggleFullscreen = useCallback(() => {
        const el = videoContainerRef.current;
        if (!document.fullscreenElement) el?.requestFullscreen?.();
        else document.exitFullscreen?.();
    }, []);

    const handleGoLive = useCallback(() => {
        if (!eventId || startingStream) return;
        setStartingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: true })
            .then(() => { setEvent((p) => ({ ...p, liveStream: { ...(p?.liveStream || {}), isLive: true } })); retryAgora(); showToast("You're live! 🎉", "success"); })
            .catch(() => showToast("Failed to go live.", "error"))
            .finally(() => setStartingStream(false));
    }, [eventId, startingStream, retryAgora, showToast]);

    const handleEndStream = useCallback(() => {
        if (!eventId || !endStreamConfirm) return;
        setEndingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: false })
            .then(() => { setEvent((p) => ({ ...p, liveStream: { ...(p?.liveStream || {}), isLive: false } })); setEndStreamConfirm(false); retryAgora(); showToast("Stream ended", "info"); })
            .catch(() => showToast("Failed to end stream.", "error"))
            .finally(() => setEndingStream(false));
    }, [eventId, endStreamConfirm, retryAgora, showToast]);

    const handleFollowOrganizer = async () => {
        if (!event?.createdBy?._id || organizerFollowLoading) return;
        setOrganizerFollowLoading(true);
        const was = isFollowingOrganizer;
        setIsFollowingOrganizer(!was);
        try {
            await API.post(`/users/${event.createdBy._id}/follow`);
            showToast(!was ? "Following organizer" : "Unfollowed", "success");
        } catch { setIsFollowingOrganizer(was); showToast("Failed to update follow.", "error"); }
        finally { setOrganizerFollowLoading(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0f0f0f]">
            <div className="w-10 h-10 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading stream…</p>
        </div>
    );
    if (!event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f0f0f]">
            <VideoIcon size={48} className="text-gray-700" />
            <h2 className="text-xl font-extrabold text-white">Stream not found</h2>
            <Link to="/live/events" className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600">Browse events</Link>
        </div>
    );

    const isLive = event.liveStream?.isLive;
    const showControls = (isCameraStream && (isBroadcaster ? agoraReady : hasRemoteStream)) || (!isCameraStream && event.liveStream?.streamURL);

    /* ─── Video area ─── */
    const renderVideoArea = () => {
        if (isCameraStream) {
            if (accessError?.code === "TICKET_REQUIRED") return (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                        <Ticket size={28} className="text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Ticket required</h3>
                        <p className="text-sm text-white/50 max-w-sm">{accessError.message}</p>
                    </div>
                    <Link to={`/event/${eventId}`} className="px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition shadow-lg shadow-pink-500/30">
                        Get tickets
                    </Link>
                </div>
            );

            if (accessError?.code === "STREAM_NOT_LIVE") {
                if (isBroadcaster) return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#0f0f0f] text-center p-6">
                        <div ref={localContainerRef} className="absolute inset-0 opacity-0 pointer-events-none [&_video]:w-full [&_video]:h-full [&_video]:object-cover" aria-hidden />
                        <div className="relative z-10 w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <Radio size={32} className="text-pink-400" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-extrabold text-white mb-2">Ready to go live</h3>
                            <p className="text-sm text-white/40 max-w-sm">Your camera preview is active. Viewers can't see you until you start the stream.</p>
                        </div>
                        <button onClick={handleGoLive} disabled={startingStream}
                            className="relative z-10 flex items-center gap-2 px-8 py-3.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-xl shadow-pink-500/30 text-base">
                            {startingStream ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                            {startingStream ? "Going live…" : "Go live now"}
                        </button>
                    </div>
                );
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0f0f] text-white text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Radio size={28} className="text-white/30" />
                        </div>
                        <h3 className="text-lg font-bold">Stream hasn't started yet</h3>
                        <p className="text-sm text-white/40 max-w-sm">The host will go live soon. This page updates automatically.</p>
                    </div>
                );
            }

            if (accessError) return (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0f0f] text-white text-center p-6">
                    <AlertCircle size={40} className="text-red-400" />
                    <p className="text-sm text-white/70">{accessError.message}</p>
                    <button onClick={retryAgora} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition">Try again</button>
                </div>
            );

            if (isBroadcaster && !agoraReady && !accessError) return (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0f0f0f] text-white text-center p-6">
                    <div className="w-12 h-12 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                    <h3 className="text-base font-bold">Connecting broadcast…</h3>
                    <p className="text-sm text-white/40">Allow camera & microphone access when prompted.</p>
                    {mediaError && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle size={14} />{mediaError}
                        </div>
                    )}
                    <button onClick={retryAgora} className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition">Retry</button>
                </div>
            );

            return (
                <>
                    <div ref={isBroadcaster ? localContainerRef : remoteContainerRef}
                        className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                    {!isBroadcaster && !hasRemoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f0f0f] text-white">
                            <div className="w-10 h-10 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                            <p className="text-sm text-white/40">Waiting for broadcaster…</p>
                        </div>
                    )}
                    {/* Preview overlay for host */}
                    {isBroadcaster && agoraReady && !isLive && !accessError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/50 backdrop-blur-sm z-10 text-center p-6">
                            <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider">Preview</span>
                            <p className="text-sm text-white/70 max-w-xs">Viewers can't see you yet.</p>
                            <button onClick={handleGoLive} disabled={startingStream}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-xl shadow-pink-500/30">
                                {startingStream ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                                {startingStream ? "Going live…" : "Go live"}
                            </button>
                        </div>
                    )}
                </>
            );
        }

        if (event.liveStream?.streamURL) return (
            <iframe width="100%" height="100%"
                src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
                title="Live Stream" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen className="w-full h-full border-0" />
        );

        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0f0f0f] text-white">
                <VideoIcon size={40} strokeWidth={1.5} className="text-white/20 mb-4" />
                <h3 className="font-bold mb-1">{isBroadcaster ? "No stream URL configured" : "Stream not available"}</h3>
                <p className="text-sm text-white/30 max-w-xs mb-4">{isBroadcaster ? "Add a YouTube or RTMP URL in event settings." : "This stream hasn't been configured yet."}</p>
                {isBroadcaster && <Link to={`/event/${eventId}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition"><SettingsIcon size={14} /> Event settings</Link>}
            </div>
        );
    };

    /* ─── Sidebar panel content ─── */
    const renderSidePanelContent = () => {
        const panel = isBroadcaster ? hostTab : sidePanel;

        if (panel === "chat") return (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/30">
                            <MessageCircle size={28} className="mb-2" />
                            <p className="text-sm font-medium text-white/40">No messages yet</p>
                            <p className="text-xs text-white/25 mt-0.5">Be the first to say something</p>
                        </div>
                    ) : messages.map((msg) => <ChatMsg key={msg.id} msg={msg} />)}
                    <div ref={chatEndRef} />
                </div>
                <ChatInput value={chatMessage} onChange={setChatMessage} onSend={sendMessage} />
            </div>
        );

        if (panel === "attendees") return (
            <div className="flex-1 overflow-y-auto p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Ticket holders · {attendees.length}</p>
                {attendeesLoading && <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-400" /></div>}
                {attendeesError && (
                    <div className="text-center py-6">
                        <p className="text-sm text-red-400 mb-3">{attendeesError}</p>
                        <button className="px-4 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold" onClick={() => { setAttendeesError(null); setAttendeesLoading(true); API.get(`/events/buyers/${eventId}`).then((r) => { setAttendees(r.data || []); setAttendeesLoading(false); }).catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); }); }}>Retry</button>
                    </div>
                )}
                {!attendeesLoading && !attendeesError && attendees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-white/30">
                        <Users size={24} className="mb-2" />
                        <p className="text-sm">No attendees yet</p>
                    </div>
                )}
                {!attendeesLoading && !attendeesError && attendees.map((t) => (
                    <button key={t._id} onClick={() => toProfile(t.buyer)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/30 transition mb-2 text-left">
                        <UserAvatar user={t.buyer} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{t.buyer?.username || "Guest"}</p>
                            <p className="text-[11px] text-gray-400">{t.ticketType} · {t.quantity} ticket{t.quantity > 1 ? "s" : ""}</p>
                        </div>
                        <Ticket size={12} className="text-gray-500 flex-shrink-0" />
                    </button>
                ))}
            </div>
        );

        if (panel === "analytics") return <AnalyticsPanel analytics={analytics} viewerCount={viewerCount} isLive={isLive} />;

        if (panel === "info") return (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">About this stream</p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <p className="font-bold text-sm text-white">{event.title}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2"><Calendar size={11} />{new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2"><Ticket size={11} />{event.ticketsSold ?? 0} / {event.totalTickets ?? 0} tickets sold</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2"><Users size={11} />{viewerCount} watching now</p>
                </div>
                {!isBroadcaster && event.createdBy && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Organizer</p>
                        <div className="flex items-center justify-between gap-2">
                            <button onClick={() => toProfile(event.createdBy)} className="flex items-center gap-2.5 text-left group">
                                <UserAvatar user={event.createdBy} className="w-9 h-9 rounded-full border border-white/10" />
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-pink-400 transition">{event.createdBy?.username}</p>
                                    <p className="text-[11px] text-gray-400">Event organizer</p>
                                </div>
                            </button>
                            <button onClick={handleFollowOrganizer} disabled={organizerFollowLoading}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${isFollowingOrganizer ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" : "bg-pink-500 text-white hover:bg-pink-600"}`}>
                                {organizerFollowLoading ? <Loader2 size={12} className="animate-spin" /> : <Heart size={12} />}
                                {isFollowingOrganizer ? "Following" : "Follow"}
                            </button>
                        </div>
                    </div>
                )}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{event.description || "Join us for this amazing live event!"}</p>
                </div>
                {isBroadcaster && isCameraStream && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Camera layout</p>
                        <div className="flex gap-1.5">
                            {[
                                { mode: LAYOUT_MODES.SINGLE, icon: Monitor, label: "Single" },
                                { mode: LAYOUT_MODES.GRID, icon: Grid, label: "Grid" },
                                { mode: LAYOUT_MODES.PIP, icon: PictureInPicture2, label: "PiP" },
                            ].map(({ mode, icon: Icon, label }) => (
                                <button key={mode} onClick={() => setLayoutMode(mode)}
                                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition ${layoutMode === mode ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 border border-white/10 hover:border-pink-500/30 hover:text-white"}`}>
                                    <Icon size={13} />{label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /* Tab definitions */
    const broadcasterTabs = [
        canManageEventTickets(event) && { id: "attendees", icon: UserCheck, label: "Attendees" },
        { id: "chat", icon: MessageCircle, label: "Chat" },
        { id: "analytics", icon: BarChart2, label: "Analytics" },
        { id: "info", icon: Info, label: "Info" },
    ].filter(Boolean);

    const viewerTabs = [
        { id: "chat", icon: MessageCircle, label: "Chat" },
        { id: "info", icon: Info, label: "Info" },
    ];

    const tabs = isBroadcaster ? broadcasterTabs : viewerTabs;
    const activeTab = isBroadcaster ? hostTab : sidePanel;
    const setActiveTab = isBroadcaster ? setHostTab : setSidePanel;

    /* ═══════════ RENDER ═══════════ */
    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#0f0f0f] font-geist overflow-hidden">

            {/* ══════════════════════════════
                MOBILE LAYOUT (< lg)
            ══════════════════════════════ */}
            <div className="flex flex-col lg:hidden h-full">

                {/* Mobile video — full width, ~56vw tall */}
                <div ref={videoContainerRef} className="relative bg-black w-full flex-shrink-0"
                    style={{ height: mobileChatOpen ? "56vw" : "calc(100% - 56px)" }}
                    onClick={resetControlsTimer}
                    onTouchStart={resetControlsTimer}>

                    {renderVideoArea()}

                    {/* Mobile top HUD */}
                    <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 z-10 pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {isLive && <LiveBadge />}
                            {isLive && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                                    <Eye size={11} />{viewerCount.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                            {isBroadcaster && agoraReady && (
                                <>
                                    <button onClick={toggleAudio}
                                        className={`p-2 rounded-full text-white text-xs ${isMuted ? "bg-red-500/80" : "bg-black/60 backdrop-blur-sm"}`}>
                                        {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                    </button>
                                    <button onClick={toggleVideo}
                                        className={`p-2 rounded-full text-white ${isVideoOff ? "bg-red-500/80" : "bg-black/60 backdrop-blur-sm"}`}>
                                        {isVideoOff ? <VideoOff size={14} /> : <VideoIcon size={14} />}
                                    </button>
                                </>
                            )}
                            <button onClick={toggleFullscreen} className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white">
                                <Maximize size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between z-10"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
                        <div className="flex items-center gap-2">
                            {isBroadcaster && isLive && (
                                <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                    {endingStream ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}End
                                </button>
                            )}
                            {isBroadcaster && !isLive && agoraReady && (
                                <button onClick={handleGoLive} disabled={startingStream}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold">
                                    {startingStream ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}Go live
                                </button>
                            )}
                        </div>
                        <button onClick={() => setMobileChatOpen((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                            <MessageCircle size={13} />
                            {mobileChatOpen ? "Hide chat" : "Show chat"}
                        </button>
                    </div>
                </div>

                {/* Mobile: tab bar + content area */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden min-h-0">
                    {/* Tab bar */}
                    <div className="flex items-center gap-0.5 px-2 pt-2 pb-0 flex-shrink-0 overflow-x-auto scrollbar-none">
                        {tabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition border-b-2 ${activeTab === tab.id ? "text-pink-400 border-pink-500 bg-white/5" : "text-gray-400 border-transparent hover:text-gray-200"}`}>
                                <tab.icon size={12} />{tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-px bg-white/10 flex-shrink-0" />
                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {renderSidePanelContent()}
                    </div>
                </div>

                {/* Mobile chat overlay — Instagram/TikTok style, floats over video */}
                {mobileChatOpen && (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ bottom: "calc(100% - 56vw)", top: "max(56vw - 180px, 0px)" }}>
                        <div className="absolute inset-0 pointer-events-auto">
                            {/* Frosted gradient chat overlay */}
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
                            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 space-y-2 max-h-[160px] overflow-hidden flex flex-col justify-end">
                                {messages.slice(-6).map((msg) => (
                                    <div key={msg.id} className="flex items-center gap-2 max-w-[85%]">
                                        <span className={`text-[11px] font-bold flex-shrink-0 ${msg.isAdmin ? "text-pink-400" : "text-white/80"}`}>{msg.user}</span>
                                        <span className="text-[12px] text-white/90 leading-snug line-clamp-1">{msg.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════
                DESKTOP LAYOUT (≥ lg)
                YouTube-style: video left, dark sidebar right
            ══════════════════════════════ */}
            <div className="hidden lg:flex flex-row flex-1 h-full overflow-hidden">

                {/* Left column: video + info */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0f0f0f]">

                    {/* Video player */}
                    <div ref={videoContainerRef}
                        className="relative bg-black w-full flex-shrink-0 cursor-pointer"
                        style={{ aspectRatio: "16/9" }}
                        onClick={resetControlsTimer}
                        onMouseMove={resetControlsTimer}>
                        {renderVideoArea()}

                        {/* Top HUD */}
                        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-4 z-10 pointer-events-none"
                            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
                            <div className="flex items-center gap-2.5 pointer-events-auto">
                                {isLive && <LiveBadge />}
                                {isLive && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
                                        <Eye size={11} />{viewerCount.toLocaleString()} watching
                                    </span>
                                )}
                                {isBroadcaster && agoraReady && !isLive && (
                                    <span className="px-2.5 py-1 rounded bg-yellow-500/80 text-white text-xs font-bold">Preview</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pointer-events-auto">
                                {isBroadcaster && agoraReady && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                                        <NetworkQuality quality={networkQuality} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom control bar */}
                        {showControls && (
                            <div
                                className={`absolute bottom-0 left-0 right-0 px-5 py-4 z-10 transition-opacity duration-300 ${controlsVisible || isBroadcaster ? "opacity-100" : "opacity-0"}`}
                                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
                                <div className="flex items-center justify-between gap-3">
                                    {/* Left: host controls */}
                                    <div className="flex items-center gap-2">
                                        {isBroadcaster ? (
                                            <>
                                                <button onClick={toggleAudio} disabled={!agoraReady}
                                                    title={isMuted ? "Unmute" : "Mute"}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition disabled:opacity-40 ${isMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/15 text-white hover:bg-white/25"}`}>
                                                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                                    {isMuted ? "Unmuted" : "Mic on"}
                                                </button>
                                                <button onClick={toggleVideo} disabled={!agoraReady}
                                                    title={isVideoOff ? "Camera on" : "Camera off"}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition disabled:opacity-40 ${isVideoOff ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/15 text-white hover:bg-white/25"}`}>
                                                    {isVideoOff ? <VideoOff size={14} /> : <VideoIcon size={14} />}
                                                    {isVideoOff ? "Camera off" : "Camera"}
                                                </button>
                                                {isLive ? (
                                                    <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-40 shadow-lg shadow-red-500/30">
                                                        {endingStream ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}End live
                                                    </button>
                                                ) : (
                                                    <button onClick={handleGoLive} disabled={startingStream}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition disabled:opacity-40 shadow-lg shadow-pink-500/30">
                                                        {startingStream ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}Go live
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition">
                                                    <Volume2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Right: fullscreen + chat toggle */}
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSidebarOpen((v) => !v)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition">
                                            <MessageCircle size={14} />
                                            {sidebarOpen ? "Hide chat" : "Show chat"}
                                        </button>
                                        <button onClick={toggleFullscreen}
                                            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition">
                                            {isFullscreen ? <Minimize2 size={15} /> : <Maximize size={15} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info section below video */}
                    <div className="px-5 py-4 space-y-4">
                        {/* Title + actions */}
                        <div className="flex items-start gap-4 justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    {isLive && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-red-500 bg-red-500/10 border border-red-500/20">Live now</span>}
                                    <span className="text-[11px] text-gray-500">{event.category}</span>
                                </div>
                                <h1 className="text-lg font-extrabold text-white leading-tight">{event.title}</h1>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                                    {isLive && <span className="flex items-center gap-1"><Users size={11} />{viewerCount.toLocaleString()} watching</span>}
                                </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!isBroadcaster && (
                                    <>
                                        <button onClick={() => setLiked((v) => !v)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${liked ? "bg-pink-500 text-white" : "bg-white/10 text-gray-200 hover:bg-white/15"}`}>
                                            <ThumbsUp size={15} />{liked ? "Liked" : "Like"}
                                        </button>
                                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-gray-200 text-sm font-semibold hover:bg-white/15 transition">
                                            <Share2 size={15} />Share
                                        </button>
                                        <button className="p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/15 transition">
                                            <Flag size={15} />
                                        </button>
                                    </>
                                )}
                                {isBroadcaster && (
                                    <Link to={`/event/${eventId}`}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-gray-200 text-sm font-semibold hover:bg-white/15 transition">
                                        <SettingsIcon size={15} />Settings
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Organizer strip */}
                        <div className="flex items-center justify-between py-3 border-t border-b border-white/10">
                            <button onClick={() => toProfile(event.createdBy)} className="flex items-center gap-3 group">
                                <UserAvatar user={event.createdBy} className="w-10 h-10 rounded-full border border-white/15" />
                                <div>
                                    <p className="font-bold text-sm text-white group-hover:text-pink-400 transition">{event.createdBy?.username || "Organizer"}</p>
                                    <p className="text-xs text-gray-500">Event organizer</p>
                                </div>
                            </button>
                            {!isBroadcaster && (
                                <button onClick={handleFollowOrganizer} disabled={organizerFollowLoading}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition ${isFollowingOrganizer ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" : "bg-white text-gray-900 hover:bg-gray-100"}`}>
                                    {organizerFollowLoading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                                    {isFollowingOrganizer ? "Following" : "Follow"}
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <p className={`text-sm text-gray-300 leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                                {event.description || "Join us for this amazing live event! Interact in the chat and enjoy the show."}
                            </p>
                            {event.description && event.description.length > 150 && (
                                <button onClick={() => setDescExpanded((v) => !v)}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white mt-2 transition">
                                    {descExpanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Show more</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right sidebar — YouTube-style dark panel */}
                {sidebarOpen && (
                    <aside className="w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col bg-[#1a1a1a] border-l border-white/8 overflow-hidden h-full">
                        {/* Tab header */}
                        <div className="flex items-center gap-0.5 px-3 pt-3 pb-0 flex-shrink-0 border-b border-white/10">
                            {tabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 -mb-px ${activeTab === tab.id ? "text-white border-pink-500" : "text-gray-400 border-transparent hover:text-gray-200"}`}>
                                    <tab.icon size={13} />{tab.label}
                                    {tab.id === "attendees" && attendees.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-bold">{attendees.length}</span>
                                    )}
                                    {tab.id === "chat" && messages.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-gray-300 text-[9px] font-bold">{messages.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Panel content */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {renderSidePanelContent()}
                        </div>
                    </aside>
                )}

                {/* Collapsed sidebar toggle */}
                {!sidebarOpen && (
                    <div className="w-10 flex-shrink-0 flex flex-col items-center py-4 gap-3 bg-[#1a1a1a] border-l border-white/8">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                            <MessageCircle size={16} />
                        </button>
                        {messages.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                                {Math.min(messages.length, 9)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════
                END STREAM MODAL
            ══════════════════════════════ */}
            {isBroadcaster && endStreamConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                <Radio size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">End stream?</h3>
                                <p className="text-xs text-gray-400">This will disconnect all viewers.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-5">
                            The stream will end for everyone watching. You can start it again from this page.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setEndStreamConfirm(false)} disabled={endingStream}
                                className="flex-1 py-2.5 rounded-full border border-white/10 bg-white/5 text-gray-200 text-sm font-semibold hover:bg-white/10 transition">
                                Cancel
                            </button>
                            <button onClick={handleEndStream} disabled={endingStream}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50">
                                {endingStream ? <Loader2 size={14} className="animate-spin" /> : null}End stream
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