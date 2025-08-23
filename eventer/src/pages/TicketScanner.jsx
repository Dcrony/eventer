import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { jsPDF } from "jspdf";
import API from "../api/axios";
import "./CSS/home.css";

export default function TicketScanner() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const scannerRef = useRef(null);
  const [scanned, setScanned] = useState(false);


  const playBeep = (file = "/beep.m4a") => {
    const audio = new Audio(file);
    audio.play().catch(() => {});
  };
  const vibrate = (ms = 150) => navigator.vibrate && navigator.vibrate(ms);

  const extractTicketId = (text) => {
    // Accepts formats like "TICKET:<id>:<buyer>" or just "<id>"
    // Fallback: find the first 24-hex substring anywhere in the string.
    const m = String(text).match(/[0-9a-fA-F]{24}/);
    return m ? m[0] : null;
  };

  const startScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }
    scannerRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (cooldown || scanned) return;
        const ticketId = extractTicketId(decodedText);
        if (!ticketId) {
          setError("Invalid QR format");
          playBeep("/bbb.wav");
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
            playBeep("/beep-valid.mp3");
            vibrate(200);
            stopScanner(); // stop on success
          } else {
            playBeep("/bbb.wav");
            vibrate(300);
            setCooldown(true);
            setScanned(true);
            setTimeout(() => setScanned(false), 1000);

          }
        } catch (err) {
          console.error(err);
          setError("Failed to validate ticket.");
          playBeep("/bbb.wav");
          vibrate(300);
          setCooldown(true);
          setScanned(true);
          setTimeout(() => setScanned(false), 1000);
        }
      },
      (scanError) => {
        // Normal: frames without a QR will land here repeatedly
        console.warn("QR Scan error:", scanError);
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => (scannerRef.current = null));
    }
  };

  const downloadReceipt = () => {
    if (!result) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("🎫 Ticket Receipt", 20, 20);

    doc.setFontSize(12);
    doc.text(`Message: ${result.message}`, 20, 40);

    if (result.event) {
      doc.text(`Event: ${result.event.title}`, 20, 60);
      doc.text(`Date: ${result.event.date}`, 20, 70);
      doc.text(`Location: ${result.event.location}`, 20, 80);
    }

    doc.text(`Status: ${result.success ? "✅ Valid" : "❌ Invalid"}`, 20, 100);

    doc.save("ticket-receipt.pdf");
  };

  return (
    <div className="home" style={{ textAlign: "center" }}>
      <h2>🎫 Ticket Scanner</h2>

      <div id="reader" style={{ width: 320, margin: "auto" }} />

      <div style={{ marginTop: 16 }}>
        {!scannerRef.current ? (
          <button
            onClick={startScanner}
            style={{
              padding: "10px 20px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanner}
            style={{
              padding: "10px 20px",
              background: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Stop Scanning
          </button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.success ? (
            <div style={{ color: "green" }}>
              <h3>✅ {result.message}</h3>
              <p>
                <strong>Event:</strong> {result.event?.title}
              </p>
              <p>
                <strong>Date:</strong> {result.event?.date}
              </p>
              <p>
                <strong>Location:</strong> {result.event?.location}
              </p>
            </div>
          ) : (
            <div style={{ color: "red" }}>
              <h3>❌ {result.message}</h3>
            </div>
          )}
          {/* Download button */}
          <button
            onClick={downloadReceipt}
            style={{
              marginTop: "15px",
              padding: "10px 20px",
              background: "#2196f3",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ⬇ Download Receipt
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
