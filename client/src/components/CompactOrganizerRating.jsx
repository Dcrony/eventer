import React from "react";
import { Star } from "lucide-react";

/**
 * CompactOrganizerRating - shows organizer rating in event cards/listings
 */
export default function CompactOrganizerRating({ organizerId, averageRating = 0, totalRatings = 0, className = "" }) {
    if (!organizerId || totalRatings === 0) return null;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({totalRatings})</span>
        </div>
    );
}
