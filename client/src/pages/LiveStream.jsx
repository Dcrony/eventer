import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import {
    Users,
    Heart,
    Share2,
    MessageCircle,
    Settings as SettingsIcon,
    Maximize,
    Flag,
    Info,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    Activity,
    UserCheck,
    Calendar,
    Ticket,
    Radio,
    Loader2,
    Send,
    ChevronRight,
    X
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

    const isBroadcaster = useMemo(
        () => isEventBroadcaster(event, currentUserId),
        [event, currentUserId]
    );

    // Host panel state
    const [hostPanelTab, setHostPanelTab] = useState("chat");
    const [attendees, setAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesError, setAttendeesError] = useState(null);
    const [endStreamConfirm, setEndStreamConfirm] = useState(false);
    const [endingStream, setEndingStream] = useState(false);
    const [startingStream, setStartingStream] = useState(false);

    const socketRef = useRef();
    const videoContainerRef = useRef();

    const isCameraStream =
        !event?.liveStream?.streamType || event.liveStream.streamType === "Camera";
    const agoraEnabled =
        Boolean(eventId && isCameraStream && event && (isBroadcaster || event.liveStream?.isLive));

    const {
        localContainerRef,
        remoteContainerRef,
        isReady: agoraReady,
        hasRemoteStream,
        isMuted,
        isVideoOff,
        mediaError,
        accessError,
        toggleAudio,
        toggleVideo,
        retry: retryAgora,
    } = useAgoraLive({
        eventId,
        isHost: isBroadcaster,
        enabled: agoraEnabled,
    });

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
                });
                socketRef.current.emit("joinRoom", eventId);

                socketRef.current.on("receiveMessage", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });
                socketRef.current.on("viewerCount", (count) => {
                    setViewerCount(count);
                });
            })
            .catch(() => setLoading(false));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [currentUserId, eventId]);
    const sendMessage = (e) => {
        if (e.key === "Enter" || e.type === "click") {
            if (!chatMessage.trim()) return;
            const msg = {
                id: Date.now(),
                user: user?.username || "Guest",
                text: chatMessage,
                eventId,
                isAdmin: isBroadcaster
            };
            socketRef.current.emit("sendMessage", msg);
            setChatMessage("");
        }
    };

    const toggleFullscreen = () => {
        const el = videoContainerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    useEffect(() => {
        if (!isBroadcaster || !eventId || !canManageEventTickets(event)) return;
        setAttendeesLoading(true);
        setAttendeesError(null);
        API.get(`/events/buyers/${eventId}`)
            .then((res) => {
                setAttendees(res.data || []);
                setAttendeesLoading(false);
            })
            .catch(() => {
                setAttendeesError("Could not load attendees.");
                setAttendeesLoading(false);
            });
    }, [isBroadcaster, eventId, event]);

    const handleEndStream = () => {
        if (!eventId || !endStreamConfirm) return;
        setEndingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: false })
            .then(() => {
                setEvent((prev) => ({
                    ...prev,
                    liveStream: { ...(prev?.liveStream || {}), isLive: false },
                }));
                setEndStreamConfirm(false);
                retryAgora();
            })
            .catch(() => {
                alert("Failed to end stream. Please try again.");
            })
            .finally(() => setEndingStream(false));
    };

    const handleGoLive = () => {
        if (!eventId || startingStream) return;
        setStartingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: true })
            .then(() => {
                setEvent((prev) => ({
                    ...prev,
                    liveStream: { ...(prev?.liveStream || {}), isLive: true },
                }));
                retryAgora();
            })
            .catch(() => {
                alert("Failed to go live. Please try again.");
            })
            .finally(() => setStartingStream(false));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 font-geist">
                <div className="w-10 h-10 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading stream…</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 font-geist">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Stream not found</h2>
                <Link to="/live/events" className="text-pink-500 font-semibold hover:underline">Return to Live</Link>
            </div>
        );
    }

    const renderVideoContent = () => {
        // ... your existing renderVideoContent logic
        if (isCameraStream) {
            if (accessError?.code === "TICKET_REQUIRED") {
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 text-white p-6 text-center">
                        <Ticket size={40} className="text-pink-400" />
                        <h3 className="text-lg font-bold">Ticket required</h3>
                        <p className="text-sm text-white/60 max-w-sm">{accessError.message}</p>
                        <Link
                            to={`/event/${eventId}`}
                            className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                        >
                            Get tickets
                        </Link>
                    </div>
                );
            }

            if (accessError?.code === "STREAM_NOT_LIVE") {
                if (isBroadcaster) {
                    return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 text-white p-6 text-center">
                            <div
                                ref={localContainerRef}
                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                                aria-hidden
                            />
                            <Radio size={40} className="text-pink-400 relative z-10" />
                            <h3 className="text-lg font-bold relative z-10">Ready to go live</h3>
                            <p className="text-sm text-white/60 max-w-sm relative z-10">
                                Start your broadcast when you are ready. Viewers will see you once you go live.
                            </p>
                            <button
                                type="button"
                                onClick={handleGoLive}
                                disabled={startingStream}
                                className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50"
                            >
                                {startingStream ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Radio size={18} />
                                )}
                                {startingStream ? "Going live…" : "Go live"}
                            </button>
                        </div>
                    );
                }
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-white p-6 text-center">
                        <Radio size={40} className="text-white/40" />
                        <h3 className="text-lg font-bold">Stream not live yet</h3>
                        <p className="text-sm text-white/60 max-w-sm">Check back when the host goes live.</p>
                    </div>
                );
            }

            if (accessError) {
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-white p-6 text-center">
                        <p className="text-sm text-white/70">{accessError.message}</p>
                        <button
                            type="button"
                            onClick={retryAgora}
                            className="px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30"
                        >
                            Retry
                        </button>
                    </div>
                );
            }

            if (isBroadcaster) {
                return (
                    <div
                        ref={localContainerRef}
                        className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                    />
                );
            }
            return (
                <>
                    <div
                        ref={remoteContainerRef}
                        className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                    />
                    {!hasRemoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-white">
                            <div className="w-9 h-9 border-3 border-pink-400/30 border-t-pink-500 rounded-full animate-spin" />
                            <p className="text-sm text-white/60">Waiting for broadcaster…</p>
                        </div>
                    )}
                </>
            );
        }
        if (event.liveStream?.streamURL) {
            return (
                <iframe
                    width="100%"
                    height="100%"
                    src={event.liveStream.streamURL.replace("watch?v=", "embed/")}
                    title="Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                />
            );
        }
        return (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-900 to-gray-950 text-white ${isBroadcaster ? "has-url" : ""}`}>
                <div className="w-18 h-18 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <VideoIcon size={48} strokeWidth={1.5} className="text-white/40" />
                </div>
                <h3 className="text-base font-bold mb-1">
                    {isBroadcaster ? "No stream URL set" : "Stream not available"}
                </h3>
                <p className="text-sm text-white/50 max-w-xs mb-4">
                    {isBroadcaster
                        ? "Add a YouTube or custom stream URL in your event settings to go live here."
                        : `This ${event.liveStream?.streamType || "stream"} hasn't been configured yet.`}
                </p>
                    {isBroadcaster && (
                    <Link to={`/event/${eventId}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 transition-all shadow-md">
                        <SettingsIcon size={16} /> Open event
                    </Link>
                    )}
            </div>
        );
    };

    const showControls = (isCameraStream && (isBroadcaster ? agoraReady : hasRemoteStream)) ||
        (!isCameraStream && event.liveStream?.streamURL);

    // Return the JSX (same as your existing component)
    return (
        <div className={`flex min-h-screen h-screen bg-gray-50 overflow-hidden font-geist ${isBroadcaster ? "host" : "viewer"}`}>
             {/* Main Stream Area */}
            <section className="flex-1 flex flex-col overflow-y-auto min-w-0">
                <div className="w-full aspect-video max-h-[calc(100vh-340px)] bg-black relative flex-shrink-0 border-b border-gray-200" ref={videoContainerRef}>
                    <div className="relative w-full h-full bg-black">
                        {renderVideoContent()}

                        {/* Pre-live: host preview before viewers can join */}
                        {isBroadcaster && isCameraStream && agoraReady && !event.liveStream?.isLive && !accessError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-[2px] z-15 p-6 text-center">
                                <p className="text-sm text-white/80 max-w-sm">
                                    Preview mode — viewers cannot see you until you go live.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleGoLive}
                                    disabled={startingStream}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-lg shadow-pink-500/30"
                                >
                                    {startingStream ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Radio size={18} />
                                    )}
                                    {startingStream ? "Going live…" : "Go live"}
                                </button>
                            </div>
                        )}

                        {/* Device Status for Host */}
                        {isBroadcaster && isCameraStream && agoraReady && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                        agoraReady && !isVideoOff ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}>
                                        <VideoIcon size={12} /> {agoraReady && !isVideoOff ? "Camera on" : "Camera off"}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                        agoraReady && !isMuted ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}>
                                        <Mic size={12} /> {agoraReady && !isMuted ? "Mic on" : "Mic muted"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Camera Request Overlay for Host */}
                        {isBroadcaster && isCameraStream && !agoraReady && !accessError && (
                            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
                                <div className="text-center max-w-sm p-6">
                                    <VideoIcon size={48} className="mx-auto mb-4 text-white/40" />
                                    <h3 className="text-lg font-bold text-white mb-2">Connecting broadcast…</h3>
                                    <p className="text-sm text-white/60 mb-4">Allow camera and microphone when prompted.</p>
                                    {mediaError && <p className="text-sm text-red-400 mb-3">{mediaError}</p>}
                                    <button type="button" onClick={retryAgora} className="px-5 py-2.5 rounded-full bg-pink-500 text-white font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/30">
                                        Retry connection
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live Indicator */}
                        {event.liveStream?.isLive && (
                            <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-extrabold uppercase tracking-wide shadow-lg shadow-red-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    LIVE
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
                                    <Users size={12} /> {viewerCount.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {/* Video Controls */}
                        {showControls && (
                            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-200 ${isBroadcaster ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isBroadcaster ? (
                                            <>
                                                <button onClick={toggleAudio} disabled={!agoraReady} className={`flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold transition-all hover:bg-white/25 disabled:opacity-40 ${isMuted ? "bg-red-500/80 hover:bg-red-600" : ""}`}>
                                                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                                                    <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mic"}</span>
                                                </button>
                                                <button onClick={toggleVideo} disabled={!agoraReady} className={`flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold transition-all hover:bg-white/25 disabled:opacity-40 ${isVideoOff ? "bg-red-500/80 hover:bg-red-600" : ""}`}>
                                                    {isVideoOff ? <VideoOff size={16} /> : <VideoIcon size={16} />}
                                                    <span className="hidden sm:inline">{isVideoOff ? "Start camera" : "Camera"}</span>
                                                </button>
                                                {event.liveStream?.isLive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEndStreamConfirm(true)}
                                                        disabled={endingStream}
                                                        className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-500/90 text-white text-xs font-semibold transition-all hover:bg-red-600 disabled:opacity-40"
                                                    >
                                                        {endingStream ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                                                        <span className="hidden sm:inline">End live</span>
                                                    </button>
                                                )}
                                            </>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={toggleFullscreen} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold transition-all hover:bg-white/25">
                                            <Maximize size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stream Info Area */}
                <div className="flex-1 p-5 bg-gray-50 space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                <span className="inline-flex items-center gap-1"><Info size={12} /> {event.category || "Event"}</span>
                                <span>·</span>
                                <span>{isBroadcaster ? "You are broadcasting" : `Started ${new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</span>
                            </div>
                        </div>
                        {isBroadcaster ? (
                            <div className="flex flex-wrap gap-2">
                                {event.liveStream?.isLive ? (
                                    <button
                                        type="button"
                                        onClick={() => setEndStreamConfirm(true)}
                                        disabled={endingStream}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-bold transition-all hover:bg-red-600 disabled:opacity-50 shadow-md shadow-red-500/25"
                                    >
                                        {endingStream ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Radio size={14} />
                                        )}
                                        End live
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleGoLive}
                                        disabled={startingStream}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all hover:bg-pink-600 disabled:opacity-50 shadow-md shadow-pink-500/25"
                                    >
                                        {startingStream ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Radio size={14} />
                                        )}
                                        Go live
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-pink-300 hover:text-pink-500">
                                    <Share2 size={14} /> Share
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 text-sm font-semibold transition-all hover:border-pink-300 hover:text-pink-500">
                                    <Flag size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Creator Strip - Viewers Only */}
                    {!isBroadcaster && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <div
                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                onClick={() => toProfile(event.createdBy)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toProfile(event.createdBy); } }}
                            >
                                <UserAvatar user={event.createdBy} className="w-12 h-12 rounded-xl border-2 border-pink-200" />
                                <div>
                                    <h4 className="font-bold text-gray-900">{event.createdBy?.username || "Organizer"}</h4>
                                    <p className="text-xs text-gray-400">1.2K followers</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all hover:bg-pink-600 shadow-md shadow-pink-500/25">
                                <Heart size={16} /> Follow
                            </button>
                        </div>
                    )}

                    {/* Description */}
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {event.description || "Join us for this amazing live event! Don't forget to interact in the chat."}
                        </p>
                    </div>
                </div>
            </section>

            {/* Host Panel or Chat Sidebar */}
            {isBroadcaster ? (
                <aside className="relative w-[360px] min-w-[300px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
                    {/* Tabs */}
                    <div className="flex p-1.5 gap-1 border-b border-gray-200 bg-gray-50/80">
                        {canManageEventTickets(event) && (
                        <button
                            onClick={() => setHostPanelTab("attendees")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${hostPanelTab === "attendees" ? "bg-pink-50 text-pink-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <UserCheck size={14} /> Attendees
                            {attendees.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[0.6rem] font-bold">{attendees.length}</span>}
                        </button>
                        )}
                        <button onClick={() => setHostPanelTab("event")} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${hostPanelTab === "event" ? "bg-pink-50 text-pink-600" : "text-gray-400 hover:text-gray-600"}`}>
                            <Calendar size={14} /> Event
                        </button>
                        <button onClick={() => setHostPanelTab("chat")} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${hostPanelTab === "chat" ? "bg-pink-50 text-pink-600" : "text-gray-400 hover:text-gray-600"}`}>
                            <MessageCircle size={14} /> Chat
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Attendees Panel */}
                        {hostPanelTab === "attendees" && canManageEventTickets(event) && (
                            <div className="flex-1 overflow-y-auto p-4">
                                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-3">Ticket holders ({attendees.length})</h3>
                                {attendeesLoading && (
                                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-sm">Loading attendees…</span>
                                    </div>
                                )}
                                {attendeesError && (
                                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                                        <p className="text-sm text-red-500">{attendeesError}</p>
                                        <button onClick={() => { setAttendeesError(null); setAttendeesLoading(true); API.get(`/events/buyers/${eventId}`).then((res) => { setAttendees(res.data || []); setAttendeesLoading(false); }).catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); }); }} className="px-4 py-1.5 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600">
                                            Retry
                                        </button>
                                    </div>
                                )}
                                {!attendeesLoading && !attendeesError && attendees.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm">No attendees yet</div>
                                )}
                                {!attendeesLoading && !attendeesError && attendees.length > 0 && (
                                    <div className="space-y-2">
                                        {attendees.map((t) => (
                                            <div key={t._id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:bg-pink-50 hover:border-pink-200 transition" onClick={() => toProfile(t.buyer)} role="button" tabIndex={0}>
                                                <UserAvatar user={t.buyer} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-900">{t.buyer?.username || "Guest"}</span>
                                                    <p className="text-xs text-gray-400">{t.ticketType} · {t.quantity} ticket{t.quantity > 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Event Panel */}
                        {hostPanelTab === "event" && (
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                                <h3 className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-3">Event summary</h3>
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    <p className="font-bold text-sm text-gray-900 mb-2">{event.title}</p>
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                        <Calendar size={12} /> {new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Ticket size={12} /> Tickets sold: {event.ticketsSold ?? 0} / {event.totalTickets ?? 0}
                                    </p>
                                </div>
                                <div className="mt-auto pt-4">
                                    <button onClick={() => setEndStreamConfirm(true)} disabled={endingStream} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold transition-all hover:bg-red-600 disabled:opacity-50">
                                        {endingStream ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                                        End stream
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chat Panel */}
                        {hostPanelTab === "chat" && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {messages.length === 0 && (
                                        <div className="text-center py-6 text-gray-400">
                                            <div className="text-2xl mb-1">👋</div>
                                            <p className="text-sm">Welcome to the chat! Say hello.</p>
                                        </div>
                                    )}
                                    {messages.map((msg) => (
                                        <div key={msg.id}>
                                            <span className={`font-semibold text-sm ${msg.isAdmin ? "text-pink-600" : "text-gray-800"}`}>{msg.user}: </span>
                                            <span className="text-sm text-gray-600">{msg.text}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-pink-50 border border-pink-200 text-xs text-gray-500 mt-2">
                                        <MessageCircle size={14} className="text-pink-500 flex-shrink-0 mt-0.5" />
                                        <span>Keep the community safe and friendly!</span>
                                    </div>
                                </div>
                                <div className="p-3 border-t border-gray-200">
                                    <div className="relative">
                                        <input type="text" placeholder="Send a message..." className="w-full px-3 py-2 pr-10 rounded-full border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-100" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={sendMessage} />
                                        <button onClick={sendMessage} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all hover:bg-pink-600">
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                </aside>
            ) : (
                <aside className="w-[360px] min-w-[300px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <MessageCircle size={14} /> Live Chat
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.length === 0 && (
                            <div className="text-center py-6 text-gray-400">
                                <div className="text-2xl mb-1">👋</div>
                                <p className="text-sm">Welcome to the chat! Say hello.</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                <span className={`font-semibold text-sm ${msg.isAdmin ? "text-pink-600" : "text-gray-800"}`}>{msg.user}: </span>
                                <span className="text-sm text-gray-600">{msg.text}</span>
                            </div>
                        ))}
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-pink-50 border border-pink-200 text-xs text-gray-500 mt-2">
                            <MessageCircle size={14} className="text-pink-500 flex-shrink-0 mt-0.5" />
                            <span>Keep the community safe and friendly!</span>
                        </div>
                    </div>
                    <div className="p-3 border-t border-gray-200">
                        <div className="relative">
                            <input type="text" placeholder="Send a message..." className="w-full px-3 py-2 pr-10 rounded-full border-2 border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-100" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={sendMessage} />
                            <button onClick={sendMessage} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all hover:bg-pink-600">
                                <Send size={12} />
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {isBroadcaster && endStreamConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-xs w-full shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-2">End stream?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            This will end the stream for everyone. You can start it again from this page with Go live.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setEndStreamConfirm(false)}
                                disabled={endingStream}
                                className="flex-1 py-2 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-sm font-semibold hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleEndStream}
                                disabled={endingStream}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50"
                            >
                                {endingStream ? <Loader2 size={14} className="animate-spin" /> : null}
                                End stream
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
