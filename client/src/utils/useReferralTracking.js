/**
 * useReferralTracking.js
 *
 * Automatically detects ?ref= in the URL, decodes it, and records the click.
 * Also exposes a function to record a conversion (called after ticket purchase).
 *
 * Usage:
 *   // In event detail page or App.jsx:
 *   const { referrerId } = useReferralTracking(eventId);
 *
 *   // After successful ticket purchase:
 *   useReferralTracking(eventId).recordConversion({ ticketCount: 2, revenue: 10000 });
 */

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/axios";
import { decodeReferralCode } from "./whatsappEngine";

const SESSION_KEY = (eventId) => `ref_tracked_${eventId}`;

export default function useReferralTracking(eventId) {
  const location   = useLocation();
  const referrerRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;

    const params = new URLSearchParams(location.search);
    const refCode = params.get("ref");
    if (!refCode) return;

    // Don't double-track in the same session
    if (sessionStorage.getItem(SESSION_KEY(eventId))) return;

    const decoded = decodeReferralCode(refCode);
    if (decoded?.userId) {
      referrerRef.current = decoded.userId;
    } else {
      referrerRef.current = refCode; // treat raw code as referrer ID
    }

    // Fire and forget — non-blocking
    API.post("/referrals/track", {
      eventId,
      referrerId: referrerRef.current,
      source: "whatsapp",
    }).then(() => {
      sessionStorage.setItem(SESSION_KEY(eventId), "1");
    }).catch(() => { /* non-fatal */ });
  }, [eventId, location.search]);

  const recordConversion = useCallback(({ ticketCount = 1, revenue = 0 } = {}) => {
    if (!eventId || !referrerRef.current) return;
    API.post("/referrals/convert", {
      eventId,
      referrerId: referrerRef.current,
      ticketCount,
      revenue,
    }).catch(() => { /* non-fatal */ });
  }, [eventId]);

  return { referrerId: referrerRef.current, recordConversion };
}