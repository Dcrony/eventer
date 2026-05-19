import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import API from "../api/axios";

const TOKEN_ERROR_CODES = new Set([
  "TICKET_REQUIRED",
  "STREAM_NOT_LIVE",
  "AGORA_NOT_CONFIGURED",
]);

export default function useAgoraLive({ eventId, isHost, enabled }) {
  const [isReady, setIsReady] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [accessError, setAccessError] = useState(null);

  const clientRef = useRef(null);
  const localAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteContainerRef = useRef(null);
  const localContainerRef = useRef(null);
  const [joinAttempt, setJoinAttempt] = useState(0);

  const cleanup = useCallback(async () => {
    [localAudioRef, localVideoRef].forEach((ref) => {
      if (ref.current) {
        ref.current.stop();
        ref.current.close();
        ref.current = null;
      }
    });

    const client = clientRef.current;
    if (client) {
      try {
        await client.leave();
      } catch {
        // ignore leave errors during teardown
      }
      client.removeAllListeners();
      clientRef.current = null;
    }

    setIsReady(false);
    setHasRemoteStream(false);
  }, []);

  useEffect(() => {
    if (!enabled || !eventId) {
      cleanup();
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      setMediaError(null);
      setAccessError(null);
      setIsReady(false);
      setHasRemoteStream(false);

      // ── Pre-flight: verify camera/mic permissions before touching Agora ──
      if (isHost) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          // Release the test tracks immediately — Agora will re-acquire them
          stream.getTracks().forEach((t) => t.stop());
        } catch (err) {
          if (cancelled) return;

          const isPermissionDenied =
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError" ||
            err.message?.toLowerCase().includes("permission denied") ||
            err.message?.toLowerCase().includes("notallowederror");

          const isNotFound =
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError";

          if (isPermissionDenied) {
            setMediaError(
              "Camera and microphone access was denied. Click the camera icon in your browser's address bar, allow access, then try again."
            );
          } else if (isNotFound) {
            setMediaError(
              "No camera or microphone was found. Please connect a device and try again."
            );
          } else {
            setMediaError(
              err.message || "Failed to access camera or microphone."
            );
          }
          return;
        }
      }

      try {
        const role = isHost ? "publisher" : "subscriber";
        const { data } = await API.get(`/live-stream/${eventId}/token`, {
          params: { role },
        });

        if (cancelled) return;

        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        clientRef.current = client;

        if (isHost) {
          await client.setClientRole("host");
        } else {
          await client.setClientRole("audience");
        }

        await client.join(data.appId, data.channel, data.token, data.uid);

        if (cancelled) {
          await client.leave();
          return;
        }

        // ── Host: acquire tracks ──────────────────────────────────────────
        if (isHost) {
          let audioTrack, videoTrack;

          try {
            [audioTrack, videoTrack] =
              await AgoraRTC.createMicrophoneAndCameraTracks();
          } catch (err) {
            if (cancelled) return;

            const isPermissionDenied =
              err.code === "PERMISSION_DENIED" ||
              err.name === "NotAllowedError" ||
              err.message?.toLowerCase().includes("permission denied") ||
              err.message?.toLowerCase().includes("notallowederror");

            const isNotFound =
              err.name === "NotFoundError" ||
              err.code === "DEVICE_NOT_FOUND";

            if (isPermissionDenied) {
              setMediaError(
                "Camera and microphone access was denied. Click the camera icon in your browser's address bar, allow access, then try again."
              );
            } else if (isNotFound) {
              setMediaError(
                "No camera or microphone was found. Please connect a device and try again."
              );
            } else {
              setMediaError(
                err.message || "Failed to access camera or microphone."
              );
            }

            // Leave the Agora channel cleanly before bailing out
            try {
              await client.leave();
            } catch {
              // ignore
            }
            client.removeAllListeners();
            clientRef.current = null;
            return;
          }

          if (cancelled) {
            audioTrack.stop();
            audioTrack.close();
            videoTrack.stop();
            videoTrack.close();
            await client.leave();
            return;
          }

          localAudioRef.current = audioTrack;
          localVideoRef.current = videoTrack;

          await client.publish([audioTrack, videoTrack]);

          if (localContainerRef.current) {
            videoTrack.play(localContainerRef.current);
          }

          setIsReady(true);
          setIsMuted(!audioTrack.enabled);
          setIsVideoOff(!videoTrack.enabled);
          return;
        }

        // ── Audience: subscribe to remote tracks ──────────────────────────
        client.on("user-published", async (user, mediaType) => {
          if (cancelled) return;
          await client.subscribe(user, mediaType);
          if (
            mediaType === "video" &&
            user.videoTrack &&
            remoteContainerRef.current
          ) {
            user.videoTrack.play(remoteContainerRef.current);
            setHasRemoteStream(true);
          }
          if (mediaType === "audio" && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on("user-unpublished", () => {
          setHasRemoteStream(false);
        });

        setIsReady(true);
      } catch (err) {
        if (cancelled) return;

        const code = err.response?.data?.code;
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to connect to live stream.";

        if (TOKEN_ERROR_CODES.has(code) || err.response?.status === 403) {
          setAccessError({ code, message });
        } else {
          setMediaError(message);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cleanup, enabled, eventId, isHost, joinAttempt]);

  // Host preview: re-attach video when the container mounts after async join.
  useEffect(() => {
    if (!enabled || !isHost || !isReady) return undefined;
    const videoTrack = localVideoRef.current;
    const container = localContainerRef.current;
    if (!videoTrack || !container) return undefined;

    try {
      videoTrack.play(container);
    } catch {
      // already playing on this container
    }
    return undefined;
  }, [enabled, isHost, isReady, joinAttempt]);

  const toggleAudio = useCallback(() => {
    const audioTrack = localAudioRef.current;
    if (!audioTrack) return;
    const next = !audioTrack.enabled;
    audioTrack.setEnabled(next);
    setIsMuted(!next);
  }, []);

  const toggleVideo = useCallback(() => {
    const videoTrack = localVideoRef.current;
    if (!videoTrack) return;
    const next = !videoTrack.enabled;
    videoTrack.setEnabled(next);
    setIsVideoOff(!next);
  }, []);

  const retry = useCallback(() => {
    setAccessError(null);
    setMediaError(null);
    setJoinAttempt((n) => n + 1);
  }, []);

  return {
    localContainerRef,
    remoteContainerRef,
    isReady,
    hasRemoteStream,
    isMuted,
    isVideoOff,
    mediaError,
    accessError,
    toggleAudio,
    toggleVideo,
    retry,
  };
}