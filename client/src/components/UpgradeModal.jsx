import { useState, useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContexts";
import { X } from "lucide-react";

export default function UpgradeModal({ isOpen, onClose }) {
  const { darkMode } = useContext(ThemeContext);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${darkMode ? "dark-mode" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "500px",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <button
          onClick={onClose}
          className="modal-close"
          style={{ position: "absolute", top: "1rem", right: "1rem" }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginBottom: "1rem", color: "#ec4899" }}>
          Upgrade Your Plan
        </h2>
        <p style={{ marginBottom: "1.5rem" }}>
          You're currently on the Free plan. Upgrade to unlock premium features like unlimited events, advanced analytics, and priority support.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button
            onClick={onClose}
            className="form-btn-secondary"
            style={{ flex: 1 }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // Navigate to pricing
              window.location.href = "/pricing";
            }}
            className="form-btn"
            style={{ flex: 1 }}
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}