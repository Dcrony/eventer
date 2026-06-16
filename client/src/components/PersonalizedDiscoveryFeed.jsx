import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, TrendingUp, MapPin, ChevronLeft, ChevronRight, Calendar, ArrowUpRight } from "lucide-react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { getEventImageUrl, formatEventDate, formatEventPrice } from "../utils/eventHelpers";

/**
 * PersonalizedDiscoveryFeed – full-bleed image slider, hover-reveal overlays.
 * No likes/comments. Pure discovery.
 */
export default function PersonalizedDiscoveryFeed({ limit = 10 }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const trackRef = useRef(null);
  const autoRef = useRef(null);
  const navigate = useNavigate();

  const VISIBLE = 4; // cards visible at once on wide screens

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          const { data } = await API.get("/discovery/trending", { params: { limit } });
          setEvents(data.events || []);
          setSource("trending");
          return;
        }

        const { data } = await API.get("/discovery/feed", {
          params: { limit },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setSource("personalized");
        } else {
          const { data: td } = await API.get("/discovery/trending", { params: { limit } });
          setEvents(td.events || []);
          setSource("trending");
        }
      } catch {
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [limit]);

  const maxIndex = Math.max(0, events.length - VISIBLE);

  const prev = useCallback(() => setActiveIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setActiveIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex]);

  // Auto-advance
  useEffect(() => {
    if (events.length <= VISIBLE) return;
    autoRef.current = setInterval(() => {
      setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [events.length, maxIndex]);

  const pauseAuto = () => clearInterval(autoRef.current);

  // Drag/swipe
  const onPointerDown = (e) => {
    setIsDragging(false);
    setDragStart(e.clientX);
    pauseAuto();
  };
  const onPointerUp = (e) => {
    if (dragStart === null) return;
    const delta = dragStart - e.clientX;
    if (Math.abs(delta) > 40) {
      setIsDragging(true);
      delta > 0 ? next() : prev();
    }
    setDragStart(null);
  };

  const badgeMeta = {
    personalized: { icon: Sparkles, label: "Just For You", cls: "text-pink-600 bg-pink-50 border-pink-200" },
    trending:     { icon: TrendingUp, label: "Trending Now", cls: "text-orange-600 bg-orange-50 border-orange-200" },
    nearby:       { icon: MapPin, label: "Nearby", cls: "text-blue-600 bg-blue-50 border-blue-200" },
    featured:     { icon: Sparkles, label: "Featured", cls: "text-pink-600 bg-pink-50 border-pink-200" },
  };
  const badge = badgeMeta[source] || badgeMeta.featured;
  const BadgeIcon = badge.icon;

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-5 w-36 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !events.length) return null;

  return (
    <section
      className="mb-14"
      onMouseEnter={pauseAuto}
      onMouseLeave={() => {
        autoRef.current = setInterval(() => {
          setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1));
        }, 5000);
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${badge.cls}`}
          >
            <BadgeIcon size={12} />
            {badge.label}
          </span>
        </div>

        {events.length > VISIBLE && (
          <div className="flex items-center gap-2">
            {/* Dot indicators */}
            <div className="hidden sm:flex items-center gap-1 mr-3">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-6 h-2 bg-pink-500" : "w-2 h-2 bg-gray-300 hover:bg-pink-300"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={prev}
              disabled={activeIndex === 0}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-pink-300 hover:text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              disabled={activeIndex >= maxIndex}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-pink-300 hover:text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Slider track */}
      <div className="overflow-hidden" ref={trackRef}>
        <div
          className="flex gap-4 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(calc(-${activeIndex} * (25% + 4px)))` }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setDragStart(null)}
        >
          {events.map((event, idx) => (
            <SliderCard
              key={event._id || idx}
              event={event}
              onClick={() => !isDragging && navigate(`/event/${event._id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SliderCard({ event, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = getEventImageUrl(event);
  const showPlaceholder = !imageUrl || imgFailed;

  return (
    <article
      onClick={onClick}
      className="group relative flex-shrink-0 w-[calc(25%-12px)] min-w-[200px] aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ minWidth: "calc(25% - 12px)" }}
    >
      {/* Background image */}
      {showPlaceholder ? (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
      ) : (
        <img
          src={imageUrl}
          alt={event.title}
          draggable={false}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      )}

      {/* Permanent bottom gradient for date */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Category chip – always visible */}
      {event.category && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[0.6rem] font-bold text-white uppercase tracking-widest">
            {event.category}
          </span>
        </div>
      )}

      {/* Price chip */}
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-0.5 rounded-full bg-pink-500 text-[0.6rem] font-bold text-white">
          {formatEventPrice(event)}
        </span>
      </div>

      {/* Always-visible: date at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4 pt-8">
        <div className="flex items-center gap-1.5 text-[0.65rem] text-white/70 mb-1.5">
          <Calendar size={10} className="text-pink-400 flex-shrink-0" />
          <span>{formatEventDate(event.startDate || event.date)}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
          {event.title}
        </h3>
      </div>

      {/* Hover overlay – description + CTA */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 pb-4 pt-12">
        <div className="flex items-center gap-1.5 text-[0.65rem] text-white/70 mb-1.5">
          <Calendar size={10} className="text-pink-400 flex-shrink-0" />
          <span>{formatEventDate(event.startDate || event.date)}</span>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug mb-1.5">
          {event.title}
        </h3>
        {event.location && (
          <div className="flex items-center gap-1 text-[0.6rem] text-white/60 mb-2">
            <MapPin size={9} />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.description && (
          <p className="text-[0.65rem] text-white/60 leading-relaxed line-clamp-3 mb-3">
            {event.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 group-hover:text-pink-300 transition-colors">
          View event <ArrowUpRight size={13} />
        </div>
      </div>
    </article>
  );
}