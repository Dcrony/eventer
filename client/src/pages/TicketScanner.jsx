import { useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { jsPDF } from "jspdf";
import { Link } from "react-router-dom";
import {
  QrCode,
  Camera,
  Square,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Download,
  MapPin,
  Calendar,
  Ticket,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import API from "../api/axios";

export default function TicketScanner() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef(null);
  const scannedBlockRef = useRef(false);

  const playBeep = (file = "./sound/beep.m4a") => {
    const audio = new Audio(file);
    audio.play().catch(() => {});
  };

  const vibrate = (ms = 150) => navigator.vibrate && navigator.vibrate(ms);

  const extractTicketId = (text) => {
    const m = String(text).match(/[0-9a-fA-F]{24}/);
    return m ? m[0] : null;
  };

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (!instance) {
      setIsScanning(false);
      return;
    }
    try {
      await instance.stop();
    } catch (_) {}
    try {
      await instance.clear();
    } catch (_) {}
    setIsScanning(false);
  }, []);

  const startScanner = async () => {
    if (isScanning || isStarting) return;
    setError(null);
    setIsStarting(true);
    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          if (cooldown || scannedBlockRef.current) return;
          const ticketId = extractTicketId(decodedText);
          if (!ticketId) {
            setError("That QR code is not a valid ticket.");
            playBeep("./sound/bbb.wav");
            vibrate(200);
            setCooldown(true);
            setTimeout(() => setCooldown(false), 1200);
            return;
          }

          try {
            const res = await API.get(`/tickets/validate/${ticketId}`);
            setResult(res.data);
            setError(null);

            if (res.data.success) {
              playBeep("./sound/beep-valid.mp3");
              vibrate(200);
              scannedBlockRef.current = true;
              await stopScanner();
            } else {
              playBeep("./sound/bbb.wav");
              vibrate(300);
              setCooldown(true);
              scannedBlockRef.current = true;
              setTimeout(() => {
                scannedBlockRef.current = false;
                setCooldown(false);
              }, 1000);
            }
          } catch (err) {
            const data = err.response?.data;
            const msg = (data && typeof data.message === "string" && data.message) ||
              "Could not validate this ticket.";
            if (data && typeof data === "object") {
              setResult({
                success: Boolean(data.success),
                message: data.message || msg,
                event: data.event,
                ticket: data.ticket,
              });
              setError(null);
            } else {
              setResult(null);
              setError(msg);
            }
            playBeep("./sound/bbb.wav");
            vibrate(300);
            setCooldown(true);
            scannedBlockRef.current = true;
            setTimeout(() => {
              scannedBlockRef.current = false;
              setCooldown(false);
            }, 1000);
          }
        },
        () => {}
      );
      setIsScanning(true);
      scannedBlockRef.current = false;
    } catch (e) {
      setError("Camera could not start. Allow camera access or try HTTPS.");
      scannerRef.current = null;
      setIsScanning(false);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = () => {
    stopScanner();
    scannedBlockRef.current = false;
  };

  const clearOutcome = () => {
    setResult(null);
    setError(null);
    scannedBlockRef.current = false;
  };

  const formatEventWhen = (ev) => {
    if (!ev) return "—";
    const raw = ev.startDate ?? ev.date;
    if (!raw) return "—";
    try {
      return new Date(raw).toLocaleString("en-NG", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(raw);
    }
  };

  const downloadReceipt = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Ticket check-in receipt", 20, 20);
    doc.setFontSize(12);
    doc.text(`Message: ${result.message || ""}`, 20, 36);
    if (result.event) {
      const ev = result.event;
      doc.text(`Event: ${ev.title || ""}`, 20, 52);
      doc.text(`When: ${formatEventWhen(ev)}`, 20, 62);
      doc.text(`Location: ${ev.location || ""}`, 20, 72);
    }
    doc.text(`Status: ${result.success ? "Valid — checked in" : "Not valid"}`, 20, 90);
    doc.save("ticket-check-in.pdf");
  };

  const event = result?.event;
  const showErrorBanner = Boolean(error) && !result;

  return (
    <div className="min-h-screen bg-gray-50 font-geist pt-8 lg:pl-[var(--sidebar-width,0px)] pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-pink-500 transition-colors mb-2">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
              Ticket Scanner
            </h1>
            <p className="text-sm text-gray-500 max-w-md">
              Check guests in at the door. Scan their QR code; valid tickets are marked used automatically.
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500">
            <QrCode size={24} strokeWidth={1.75} />
          </div>
        </div>

        {/* Error Banner */}
        {showErrorBanner && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-5">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Scanner Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="relative bg-gray-900 min-h-[320px]">
              <div id="reader" className="w-full" />
              <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none z-10" />
            </div>

            <div className="flex flex-wrap items-center gap-3 p-4 border-t border-gray-200 bg-gray-50/50">
              {!isScanning ? (
                <button
                  onClick={startScanner}
                  disabled={isStarting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white text-sm font-semibold transition-all duration-200 hover:bg-pink-600 disabled:opacity-50"
                >
                  <Camera size={16} />
                  {isStarting ? "Starting camera…" : "Start camera"}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors"
                >
                  <Square size={14} />
                  Stop camera
                </button>
              )}
              {result && (
                <button
                  onClick={clearOutcome}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:border-pink-300 hover:text-pink-500 transition-colors"
                >
                  <ScanLine size={16} />
                  Scan another
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 p-4 pt-0">
              Use the back camera when possible. Hold the QR steady inside the frame until you hear the tone.
            </p>
          </div>

          {/* Result Panel */}
          {result && (
            <div className={`rounded-xl border shadow-sm overflow-hidden ${
              result.success
                ? "bg-green-50/50 border-green-200"
                : "bg-red-50/50 border-red-200"
            }`}>
              <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  result.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {result.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <h2 className="text-base font-bold text-gray-900">{result.message}</h2>
              </div>

              <div className="p-4 space-y-3">
                {event && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-sm">
                      <Ticket size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 w-16">Event</span>
                      <span className="font-semibold text-gray-900 flex-1">{event.title}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 w-16">When</span>
                      <span className="font-semibold text-gray-900 flex-1">{formatEventWhen(event)}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 w-16">Where</span>
                      <span className="font-semibold text-gray-900 flex-1">{event.location || "—"}</span>
                    </div>
                    {result.ticket?.quantity != null && (
                      <div className="flex items-start gap-3 text-sm">
                        <QrCode size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 w-16">Passes</span>
                        <span className="font-semibold text-gray-900 flex-1">{result.ticket.quantity}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={downloadReceipt}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold transition-all duration-200 hover:bg-gray-800"
                >
                  <Download size={16} />
                  Save PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}