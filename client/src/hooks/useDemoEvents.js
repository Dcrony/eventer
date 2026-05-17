/**
 * Hook: useDemoEvents
 * Provides fallback demo events if API is empty or fails
 * Useful for development and initial data display
 */

import { useState, useEffect } from "react";
import DEMO_EVENTS from "../utils/demoEvents";

export const useDemoEvents = (events = [], hasError = false) => {
  const [displayEvents, setDisplayEvents] = useState(events);

  useEffect(() => {
    const allowDemo =
      import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_EVENTS !== "false";
    if (allowDemo && (!events || events.length === 0 || hasError)) {
      setDisplayEvents(DEMO_EVENTS);
    } else {
      setDisplayEvents(events || []);
    }
  }, [events, hasError]);

  return displayEvents;
};

export default useDemoEvents;
