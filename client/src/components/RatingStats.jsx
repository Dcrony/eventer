import React from "react";
import { Star } from "lucide-react";

/**
 * RatingStats component - displays overall rating summary
 */
export default function RatingStats({ stats, compact = false }) {
    if (!stats) return null;

    const { averageRating = 0, totalRatings = 0, ratingCounts = {} } = stats;

    const ratingPercentages = {
        5: totalRatings > 0 ? Math.round(((ratingCounts[5] || 0) / totalRatings) * 100) : 0,
        4: totalRatings > 0 ? Math.round(((ratingCounts[4] || 0) / totalRatings) * 100) : 0,
        3: totalRatings > 0 ? Math.round(((ratingCounts[3] || 0) / totalRatings) * 100) : 0,
        2: totalRatings > 0 ? Math.round(((ratingCounts[2] || 0) / totalRatings) * 100) : 0,
        1: totalRatings > 0 ? Math.round(((ratingCounts[1] || 0) / totalRatings) * 100) : 0,
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={14}
                            className={i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                    ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({totalRatings} reviews)</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Overall rating */}
            <div className="mb-6">
                <div className="flex items-end gap-4 mb-4">
                    <div>
                        <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                        <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        Based on <span className="font-semibold">{totalRatings}</span> reviews
                    </div>
                </div>
            </div>

            {/* Rating breakdown */}
            <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-8">
                            {Array.from({ length: rating }).map((_, i) => (
                                <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - rating }).map((_, i) => (
                                <Star key={i} size={12} className="text-gray-300" />
                            ))}
                        </div>
                        <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-yellow-400 h-full"
                                style={{ width: `${ratingPercentages[rating]}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-600 w-12">{ratingPercentages[rating]}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
