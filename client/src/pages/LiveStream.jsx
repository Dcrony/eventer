import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useProfileNavigation from "../hooks/useProfileNavigation";
import {
    Users,
    Heart,
    Share2,
    MessageCircle,
    Play,
    Pause,
    Volume2,
    VolumeX,
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
    Loader2
} from "lucide-react";
import io from "socket.io-client";
import Peer from "simple-peer";
import API from "../api/axios";
import { getEventImageUrl } from "../utils/eventHelpers";
import { UserAvatar } from "../components/ui/avatar";
import "./CSS/LiveStream.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, "");
const PORT_URL = SERVER_URL;
const SOCKET_URL = SERVER_URL;

export default function LiveStream() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewerCount, setViewerCount] = useState(0);
    const [chatMessage, setChatMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const currentUserId = user?.id || user?._id;
    const { toProfile } = useProfileNavigation();

    // Host panel state
    const [hostPanelTab, setHostPanelTab] = useState("attendees");
    const [attendees, setAttendees] = useState([]);
    const [attendeesLoading, setAttendeesLoading] = useState(false);
    const [attendeesError, setAttendeesError] = useState(null);
    const [endStreamConfirm, setEndStreamConfirm] = useState(false);
    const [endingStream, setEndingStream] = useState(false);

    // WebRTC & Socket States
    const [stream, setStream] = useState(null);
    const [isBroadcaster, setIsBroadcaster] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mediaError, setMediaError] = useState(null); // getUserMedia failed
    const [viewerMuted, setViewerMuted] = useState(false);
    const [viewerPaused, setViewerPaused] = useState(false);
    const socketRef = useRef();
    const myVideo = useRef();
    const remoteVideo = useRef();
    const videoContainerRef = useRef();
    const streamRef = useRef(null);
    const peersRef = useRef([]); // For broadcaster: [{peerId, peer}]

    const requestCameraAndMic = useCallback(() => {
        setMediaError(null);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                // Stop any previous local stream before replacing.
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }
                streamRef.current = currentStream;
                setStream(currentStream);
                if (myVideo.current) myVideo.current.srcObject = currentStream;
                const socket = socketRef.current;
                if (socket) {
                    socket.off("userJoined");
                    socket.on("userJoined", (userId) => {
                        const peer = createPeer(userId, socket.id, currentStream);
                        peersRef.current.push({ peerId: userId, peer });
                    });

                    socket.off("userLeft");
                    socket.on("userLeft", (userId) => {
                        const peerObj = peersRef.current.find(p => p.peerId === userId);
                        if (peerObj) {
                            peerObj.peer.destroy();
                        }
                        const peers = peersRef.current.filter(p => p.peerId !== userId);
                        peersRef.current = peers;
                    });
                }
            })
            .catch((err) => {
                setMediaError(err?.message || "Camera or microphone access denied.");
            });
    }, []);

    useEffect(() => {
        if (!eventId) return;

        // 1. Fetch Event Info
        API.get(`/events/${eventId}`)
            .then((res) => {
                const eventData = res.data;
                setEvent(eventData);
                setLoading(false);

                // Check if the current user is the owner/organizer
                const createdById =
                    typeof eventData.createdBy === "string"
                        ? eventData.createdBy
                        : eventData.createdBy?._id || eventData.createdBy?.id;
                const isOwner = !!currentUserId && createdById === currentUserId;
                setIsBroadcaster(isOwner);

                // 2. Initialize Socket Connection
                socketRef.current = io(SOCKET_URL, {
                    auth: {
                        token: localStorage.getItem("token"),
                    },
                    transports: ["websocket", "polling"],
                    withCredentials: true,
                });
                socketRef.current.emit("joinRoom", eventId);

                if (isOwner) {
                    // BROADCASTER LOGIC
                    if (eventData.liveStream?.streamType === "Camera") {
                        requestCameraAndMic();
                    }
                } else {
                    // VIEWER LOGIC
                    if (eventData.liveStream?.streamType === "Camera") {
                        socketRef.current.on("signal", (data) => {
                            addPeer(data.signal, data.from);
                        });
                    }
                }

                // Handle Chat
                socketRef.current.on("receiveMessage", (msg) => {
                    setMessages((prev) => [...prev, msg]);
                });

                // Handle Real Viewer Count
                socketRef.current.on("viewerCount", (count) => {
                    setViewerCount(count);
                });
            })
            .catch((err) => {
                setLoading(false);
            });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, [currentUserId, eventId, requestCameraAndMic]);

    // Keep local camera stream attached to host preview.
    // This prevents a blank self-view when getUserMedia resolves before the video ref is ready.
    useEffect(() => {
        if (isBroadcaster && myVideo.current && stream) {
            myVideo.current.srcObject = stream;
        }
    }, [isBroadcaster, stream]);

    // Broadcaster Helper: Create a new peer for a viewer
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
        });

        return peer;
    }

    // Viewer Helper: Join a stream from a broadcaster
    function addPeer(incomingSignal, callerID) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
        });

        peer.on("signal", (signal) => {
            socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
        });

        peer.on("stream", (incomingStream) => {
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = incomingStream;
            }
            setHasRemoteStream(true);
        });

        peer.signal(incomingSignal);
        return peer;
    }

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

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) return;
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) return;
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
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

    const toggleViewerPlayPause = () => {
        const video = remoteVideo.current;
        if (!video) return;
        if (video.paused) {
            video.play();
            setViewerPaused(false);
        } else {
            video.pause();
            setViewerPaused(true);
        }
    };

    const toggleViewerMute = () => {
        const video = remoteVideo.current;
        if (!video) return;
        video.muted = !video.muted;
        setViewerMuted(video.muted);
    };

    // Fetch attendees (ticket holders) when host
    useEffect(() => {
        if (!isBroadcaster || !eventId) return;
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
    }, [isBroadcaster, eventId]);

    const handleEndStream = () => {
        if (!eventId || !endStreamConfirm) return;
        setEndingStream(true);
        API.patch("/events/toggle-live", { eventId, isLive: false })
            .then(() => {
                navigate("/dashboard");
            })
            .catch(() => {
                setEndingStream(false);
                alert("Failed to end stream. Please try again.");
            });
    };

    if (loading) {
        return (
            <div className="live-stream-loading">
                <div className="live-stream-loading-spinner" />
                <p className="live-stream-loading-text">Loading stream…</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="live-stream-notfound">
                <h2>Stream not found</h2>
                <Link to="/live/events">Return to Live</Link>
            </div>
        );
    }

    const renderVideoContent = () => {
        if (event.liveStream?.streamType === "Camera") {
            if (isBroadcaster) {
                return <video ref={myVideo} autoPlay muted playsInline />;
            }
            return (
                <>
                    <video
                        ref={remoteVideo}
                        autoPlay
                        playsInline
                        poster={getEventImageUrl(event) || undefined}
                        onPlay={() => setViewerPaused(false)}
                        onPause={() => setViewerPaused(true)}
                    />
                    {!hasRemoteStream && (
                        <div className="stream-waiting-overlay">
                            <div className="stream-waiting-spinner" />
                            <p className="stream-waiting-text">Waiting for broadcaster…</p>
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
                />
            );
        }
        return (
            <div className={`stream-empty-state ${isBroadcaster ? "has-url" : ""}`}>
                <div className="stream-empty-icon-wrap">
                    <VideoIcon size={40} strokeWidth={1.5} />
                </div>
                <h3 className="stream-empty-title">
                    {isBroadcaster ? "No stream URL set" : "Stream not available"}
                </h3>
                <p className="stream-empty-desc">
                    {isBroadcaster
                        ? "Add a YouTube or custom stream URL in your event settings to go live here."
                        : `This ${event.liveStream?.streamType || "stream"} hasn't been configured yet.`}
                </p>
                {isBroadcaster && (
                    <Link to="/dashboard" className="stream-empty-cta">
                        <SettingsIcon size={18} />
                        Go to Dashboard to set stream URL
                    </Link>
                )}
            </div>
        );
    };

    const showControls =
        (event.liveStream?.streamType === "Camera" && (isBroadcaster || hasRemoteStream)) ||
        (event.liveStream?.streamType !== "Camera" && event.liveStream?.streamURL);

    return (
        <div className={`live-stream-container ${isBroadcaster ? "host" : "viewer"}`}>
            {/* Main Stream Area */}
            <section className="main-stream-area">
                <div className="video-container" ref={videoContainerRef}>
                    <div className="video-placeholder">
                        {renderVideoContent()}

                        <div className="stream-session-status">
                            {isBroadcaster && event.liveStream?.streamType === "Camera" && (
                                <div className="stream-device-status">
                                    <span className={`device-chip ${stream && !isVideoOff ? "ok" : "off"}`}>
                                        <VideoIcon size={14} />
                                        {stream && !isVideoOff ? "Camera on" : "Camera off"}
                                    </span>
                                    <span className={`device-chip ${stream && !isMuted ? "ok" : "off"}`}>
                                        <Mic size={14} />
                                        {stream && !isMuted ? "Mic on" : "Mic muted"}
                                    </span>
                                    {!stream && (
                                        <button
                                            type="button"
                                            className="device-retry-btn"
                                            onClick={requestCameraAndMic}
                                        >
                                            Enable devices
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {isBroadcaster && event.liveStream?.streamType === "Camera" && !stream && (
                            <div className="stream-start-camera-overlay">
                                <div className="stream-start-camera-box">
                                    <VideoIcon size={48} className="stream-start-camera-icon" />
                                    <h3 className="stream-start-camera-title">Camera & microphone</h3>
                                    <p className="stream-start-camera-desc">
                                        Enable camera and voice so viewers can see and hear you.
                                    </p>
                                    {mediaError && (
                                        <p className="stream-start-camera-error" role="alert">{mediaError}</p>
                                    )}
                                    <button
                                        type="button"
                                        className="stream-start-camera-btn"
                                        onClick={requestCameraAndMic}
                                    >
                                        Enable camera & microphone
                                    </button>
                                </div>
                            </div>
                        )}

                        {event.liveStream?.isLive && (
                            <>
                                <div className="stream-overlay">
                                    <span className="live-indicator">
                                        <span className="live-indicator-dot" aria-hidden />
                                        LIVE
                                    </span>
                                    <span className="viewer-count">
                                        <Users size={14} />
                                        {viewerCount.toLocaleString()}
                                    </span>
                                </div>
                            </>
                        )}

                        {showControls ? (
                            <div className={`stream-controls-bar ${isBroadcaster ? "stream-controls-bar--always" : ""}`}>
                                <div className="stream-controls-inner">
                                    <div className="stream-controls-left">
                                        {isBroadcaster ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={toggleAudio}
                                                    disabled={!stream}
                                                    className={`stream-control-btn ${isMuted ? "muted" : ""}`}
                                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                                    title={isMuted ? "Unmute" : "Mute microphone"}
                                                >
                                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                                    <span className="stream-control-label">{isMuted ? "Unmute" : "Mic"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={toggleVideo}
                                                    disabled={!stream}
                                                    className={`stream-control-btn ${isVideoOff ? "off" : ""}`}
                                                    aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
                                                    title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                                                >
                                                    {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                                                    <span className="stream-control-label">{isVideoOff ? "Start camera" : "Camera"}</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className="stream-control-btn"
                                                    aria-label={viewerPaused ? "Play" : "Pause"}
                                                    onClick={toggleViewerPlayPause}
                                                    title={viewerPaused ? "Play" : "Pause"}
                                                >
                                                    {viewerPaused ? <Play size={20} /> : <Pause size={20} />}
                                                    <span className="stream-control-label">{viewerPaused ? "Play" : "Pause"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`stream-control-btn ${viewerMuted ? "muted" : ""}`}
                                                    aria-label={viewerMuted ? "Unmute" : "Mute"}
                                                    onClick={toggleViewerMute}
                                                    title={viewerMuted ? "Unmute" : "Mute"}
                                                >
                                                    {viewerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                                    <span className="stream-control-label">{viewerMuted ? "Unmute" : "Volume"}</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="stream-controls-right">
                                        <button type="button" className="stream-control-btn" aria-label="Fullscreen" onClick={toggleFullscreen} title="Fullscreen">
                                            <Maximize size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Stream Info Area */}
                <div className="stream-info-bar">
                    <div className="stream-info-header">
                        <div className="stream-info-title-block">
                            <h1 className="stream-title">{event.title}</h1>
                            <div className="stream-meta-line">
                                <span><Info size={14} /> {event.category || "Event"}</span>
                                <span>·</span>
                                <span>{isBroadcaster ? "You are broadcasting" : `Started ${new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</span>
                            </div>
                        </div>
                        <div className="stream-actions">
                            {!isBroadcaster && (
                                <>
                                    <button type="button" className="btn-stream btn-share">
                                        <Share2 size={18} /> Share
                                    </button>
                                    <button type="button" className="btn-stream btn-flag" aria-label="Report">
                                        <Flag size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {!isBroadcaster && (
                        <div className="creator-strip">
                            <div
                                className="creator-info-left"
                                role="button"
                                tabIndex={0}
                                onClick={() => toProfile(event.createdBy)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        toProfile(event.createdBy);
                                    }
                                }}
                            >
                                <UserAvatar
                                    user={event.createdBy}
                                    className="creator-avatar-large"
                                />
                                <div className="creator-details">
                                    <h4>{event.createdBy?.username || "Organizer"}</h4>
                                    <p className="follower-count">1.2K followers</p>
                                </div>
                            </div>
                            <button type="button" className="btn-stream btn-follow">
                                <Heart size={18} /> Follow
                            </button>
                        </div>
                    )}

                    <div className="stream-description-block">
                        <p>{event.description || "Join us for this amazing live event! Don't forget to interact in the chat."}</p>
                    </div>
                </div>
            </section>

            {/* Host panel (host only) or Chat sidebar (viewer / ticket purchasers) */}
            {isBroadcaster ? (
                <aside className="stream-host-panel">
                    <div className="host-panel-tabs">
                        <button
                            type="button"
                            className={`host-panel-tab ${hostPanelTab === "attendees" ? "active" : ""}`}
                            onClick={() => setHostPanelTab("attendees")}
                        >
                            <UserCheck size={16} />
                            Attendees
                            {attendees.length > 0 && (
                                <span className="host-panel-tab-badge">{attendees.length}</span>
                            )}
                        </button>
                        <button
                            type="button"
                            className={`host-panel-tab ${hostPanelTab === "event" ? "active" : ""}`}
                            onClick={() => setHostPanelTab("event")}
                        >
                            <Calendar size={16} />
                            Event
                        </button>
                        <button
                            type="button"
                            className={`host-panel-tab ${hostPanelTab === "chat" ? "active" : ""}`}
                            onClick={() => setHostPanelTab("chat")}
                        >
                            <MessageCircle size={16} />
                            Chat
                        </button>
                    </div>

                    <div className="host-panel-content">
                        {hostPanelTab === "attendees" && (
                            <div className="host-attendees">
                                <h3 className="host-section-title">
                                    Ticket holders ({attendees.length})
                                </h3>
                                {attendeesLoading && (
                                    <div className="host-attendees-loading">
                                        <Loader2 size={24} className="host-spinner" />
                                        <span>Loading attendees…</span>
                                    </div>
                                )}
                                {attendeesError && (
                                    <div className="host-attendees-error">
                                        <p>{attendeesError}</p>
                                        <button
                                            type="button"
                                            className="host-retry-btn"
                                            onClick={() => {
                                                setAttendeesError(null);
                                                setAttendeesLoading(true);
                                                API.get(`/events/buyers/${eventId}`)
                                                    .then((res) => { setAttendees(res.data || []); setAttendeesLoading(false); })
                                                    .catch(() => { setAttendeesError("Could not load attendees."); setAttendeesLoading(false); });
                                            }}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}
                                {!attendeesLoading && !attendeesError && attendees.length === 0 && (
                                    <div className="host-attendees-empty">No attendees yet</div>
                                )}
                                {!attendeesLoading && !attendeesError && attendees.length > 0 && (
                                    <ul className="host-attendees-list">
                                        {attendees.map((t) => (
                                            <li
                                                key={t._id}
                                                className="host-attendee-item"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toProfile(t.buyer)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toProfile(t.buyer);
                                                    }
                                                }}
                                            >
                                                <UserAvatar user={t.buyer} className="host-attendee-avatar" />
                                                <div className="host-attendee-info">
                                                    <span className="host-attendee-name">
                                                        {t.buyer?.username || "Guest"}
                                                    </span>
                                                    <span className="host-attendee-meta">
                                                        {t.ticketType} · {t.quantity} ticket{t.quantity > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {hostPanelTab === "event" && (
                            <div className="host-event-summary">
                                <h3 className="host-section-title">Event summary</h3>
                                <div className="host-event-card">
                                    <p className="host-event-name">{event.title}</p>
                                    <p className="host-event-meta">
                                        <Calendar size={14} />
                                        {new Date(event.startDate).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                    <p className="host-event-tickets">
                                        <Ticket size={14} />
                                        Tickets sold: {event.ticketsSold ?? 0} / {event.totalTickets ?? 0}
                                    </p>
                                </div>
                                <div className="host-end-stream-section">
                                    <button
                                        type="button"
                                        className="host-end-stream-btn"
                                        onClick={() => setEndStreamConfirm(true)}
                                        disabled={endingStream}
                                    >
                                        {endingStream ? (
                                            <Loader2 size={18} className="host-spinner" />
                                        ) : (
                                            <Radio size={18} />
                                        )}
                                        End stream
                                    </button>
                                </div>
                            </div>
                        )}

                        {hostPanelTab === "chat" && (
                            <>
                                <div className="host-chat-messages scrollbar-hide">
                                    {messages.length === 0 && (
                                        <div className="chat-welcome">
                                            <span className="chat-welcome-icon">👋</span>
                                            Welcome to the chat! Say hello.
                                        </div>
                                    )}
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="mock-message">
                                            <span className={`mock-user ${msg.isAdmin ? "broadcaster" : ""}`}>
                                                {msg.user}:
                                            </span>
                                            <span className="mock-text">{msg.text}</span>
                                        </div>
                                    ))}
                                    <div className="chat-community-note">
                                        <MessageCircle size={14} />
                                        <span>Keep the community safe and friendly!</span>
                                    </div>
                                </div>
                                <div className="chat-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Send a message..."
                                        className="chat-input-field"
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyDown={sendMessage}
                                        aria-label="Chat message"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {endStreamConfirm && (
                        <div className="host-end-stream-modal">
                            <div className="host-end-stream-modal-inner">
                                <h3>End stream?</h3>
                                <p>This will end the stream for everyone. You can go live again later from your dashboard.</p>
                                <div className="host-end-stream-modal-actions">
                                    <button
                                        type="button"
                                        className="host-btn-cancel"
                                        onClick={() => setEndStreamConfirm(false)}
                                        disabled={endingStream}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="host-btn-end"
                                        onClick={handleEndStream}
                                        disabled={endingStream}
                                    >
                                        {endingStream ? <Loader2 size={18} className="host-spinner" /> : null}
                                        End stream for everyone
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            ) : (
                <aside className="stream-chat-sidebar">
                    <div className="chat-header">
                        <MessageCircle size={16} />
                        Live Chat
                    </div>
                    <div className="chat-messages-container scrollbar-hide">
                        {messages.length === 0 && (
                            <div className="chat-welcome">
                                <span className="chat-welcome-icon">👋</span>
                                Welcome to the chat! Say hello.
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="mock-message">
                                <span className={`mock-user ${msg.isAdmin ? "broadcaster" : ""}`}>
                                    {msg.user}:
                                </span>
                                <span className="mock-text">{msg.text}</span>
                            </div>
                        ))}
                        <div className="chat-community-note">
                            <MessageCircle size={14} />
                            <span>Keep the community safe and friendly!</span>
                        </div>
                    </div>
                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            placeholder="Send a message..."
                            className="chat-input-field"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={sendMessage}
                            aria-label="Chat message"
                        />
                    </div>
                </aside>
            )}
        </div>
    );
}

