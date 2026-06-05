import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getEventImageUrl, formatEventDate } from "../utils/eventHelpers";

/**
 * FeaturedEventsSection - displays created and collaborator events for organizers
 * Shows on organizer profiles without dashboard controls
 */
export default function FeaturedEventsSection({
  created = [],
  collaborator = [],
  organizerId,
  isLoading = false,
}) {
  const allEvents = [...(created || []), ...(collaborator || [])];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 size={24} className="text-pink-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (allEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900">Featured Events</h3>
        <p className="text-xs text-gray-500 mt-1">Created and collaborated events</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {allEvents.map((event) => (
          <Link
            key={event._id}
            to={`/event/${event._id}`}
            className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-pink-200/40 transition-all duration-200 flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
              {getEventImageUrl(event) ? (
                <img
                  src={getEventImageUrl(event)}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar size={28} className="text-white/20" />
                </div>
              )}

              {/* Role badge */}
              <div className="absolute top-2 right-2">
                {created?.some((e) => e._id === event._id) ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-500 text-white text-[0.65rem] font-bold uppercase tracking-wide shadow-sm">
                    Organizer
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500 text-white text-[0.65rem] font-bold uppercase tracking-wide shadow-sm">
                    Collaborator
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col gap-2">
              <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                {event.title}
              </h4>

              <div className="space-y-1.5 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Calendar size={12} className="text-pink-500 flex-shrink-0" />
                  <span className="truncate">
                    {formatEventDate(event.startDate, event.startTime)}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin size={12} className="text-pink-500 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Users size={12} className="text-pink-500 flex-shrink-0" />
                  <span>{event.ticketsSold || 0}/{event.totalTickets || "∞"}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
