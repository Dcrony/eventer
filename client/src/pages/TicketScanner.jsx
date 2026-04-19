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
import "./CSS/TicketScanner.css";

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
    } catch (_) {
      /* already stopped */
    }
    try {
      await instance.clear();
    } catch (_) {
      /* dom may be gone */
    }
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
            console.error(err);
            const data = err.response?.data;
            const msg =
              (data && typeof data.message === "string" && data.message) ||
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
      console.error(e);
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
    <div className="scanner-page">
      <div className="scanner-shell">
        <header className="scanner-top">
          <div>
            <Link to="/dashboard" className="scanner-back">
              <ArrowLeft size={16} strokeWidth={2.25} />
              Dashboard
            </Link>
            <h1 className="scanner-title">Ticket scanner</h1>
            <p className="scanner-lede">
              Check guests in at the door. Scan their QR code; valid tickets are marked used
              automatically.
            </p>
          </div>
          <div className="scanner-top-icon" aria-hidden>
            <QrCode size={28} strokeWidth={1.75} />
          </div>
        </header>

        <div className="scanner-layout">
          {showErrorBanner && (
            <div className="scanner-error-banner" role="alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <section className="scanner-panel" aria-label="Camera scanner">
            <div className="scanner-viewport-wrap">
              <div id="reader" />
            </div>
            <div className="scanner-controls">
              {!isScanning ? (
                <button
                  type="button"
                  className="scanner-btn scanner-btn--start"
                  onClick={startScanner}
                  disabled={isStarting}
                >
                  <Camera size={18} />
                  {isStarting ? "Starting camera…" : "Start camera"}
                </button>
              ) : (
                <button type="button" className="scanner-btn scanner-btn--stop" onClick={handleStop}>
                  <Square size={16} />
                  Stop camera
                </button>
              )}
              {result && (
                <button type="button" className="scanner-btn scanner-btn--ghost" onClick={clearOutcome}>
                  <ScanLine size={18} />
                  Scan another
                </button>
              )}
            </div>
            <p className="scanner-hint">
              Use the back camera when possible. Hold the QR steady inside the frame until you hear the
              tone.
            </p>
          </section>

          {result && (
            <aside
              className={`scanner-result ${result.success ? "scanner-result--ok" : "scanner-result--bad"}`}
              aria-live="polite"
            >
              <div className="scanner-result-head">
                <div className="scanner-result-icon">
                  {result.success ? <CheckCircle size={22} /> : <XCircle size={22} />}
                </div>
                <h2 className="scanner-result-title">{result.message}</h2>
              </div>
              <div className="scanner-result-body">
                {event ? (
                  <div className="scanner-result-meta">
                    <div className="scanner-meta-row">
                      <Ticket size={16} />
                      <span className="scanner-meta-label">Event</span>
                      <span className="scanner-meta-value">{event.title}</span>
                    </div>
                    <div className="scanner-meta-row">
                      <Calendar size={16} />
                      <span className="scanner-meta-label">When</span>
                      <span className="scanner-meta-value">{formatEventWhen(event)}</span>
                    </div>
                    <div className="scanner-meta-row">
                      <MapPin size={16} />
                      <span className="scanner-meta-label">Where</span>
                      <span className="scanner-meta-value">{event.location || "—"}</span>
                    </div>
                    {result.ticket?.quantity != null && (
                      <div className="scanner-meta-row">
                        <QrCode size={16} />
                        <span className="scanner-meta-label">Passes</span>
                        <span className="scanner-meta-value">{result.ticket.quantity}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  !result.success && <p className="scanner-meta-value">{result.message}</p>
                )}
                <div className="scanner-result-actions">
                  <button type="button" className="scanner-btn scanner-btn--download" onClick={downloadReceipt}>
                    <Download size={18} />
                    Save PDF
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
