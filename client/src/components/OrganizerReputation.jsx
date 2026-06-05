import React, { useEffect, useState } from "react";
import { Star, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import RatingStats from "./RatingStats";
import ReviewCard from "./ReviewCard";
import { getOrganizerReputation, submitReport } from "../services/api/ratings";

/**
 * OrganizerReputation - displays organizer's trust score, ratings, and reviews
 */
export default function OrganizerReputation({ organizerId, compact = false }) {
    const [reputation, setReputation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");

    useEffect(() => {
        const fetchReputation = async () => {
            try {
                setLoading(true);
                const { data } = await getOrganizerReputation(organizerId);
                setReputation(data.reputation);
            } catch (err) {
                console.error("Error fetching reputation:", err);
                setError("Could not load organizer reputation");
            } finally {
                setLoading(false);
            }
        };

        if (organizerId) {
            fetchReputation();
        }
    }, [organizerId]);

    if (!organizerId || loading) {
        return null;
    }

    if (error) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">{error}</p>
            </div>
        );
    }

    if (!reputation) {
        return null;
    }

    const { trustScore, ratingStats, aspectRatings, recentReviews } = reputation;

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <span className="text-xs font-semibold text-gray-900">Trust Score:</span>
                    <span className="text-sm font-bold text-blue-600">{trustScore}/100</span>
                </div>
                {ratingStats?.totalRatings > 0 && (
                    <>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    className={i < Math.round(ratingStats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                />
                            ))}
                            <span className="text-xs font-semibold ml-1">{ratingStats.averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-600">({ratingStats.totalRatings})</span>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Organizer Reputation</h3>

                {/* Trust Score */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            <span className="text-xs font-semibold uppercase text-blue-700">Trust Score</span>
                        </div>
                        <div className="text-4xl font-bold text-blue-600">{trustScore}</div>
                        <p className="text-xs text-gray-600 mt-1">out of 100</p>
                        <div className="w-full bg-blue-200 h-1 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full"
                                style={{ width: `${trustScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Overall Rating */}
                    {ratingStats?.totalRatings > 0 && (
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={18} className="text-yellow-600 fill-yellow-600" />
                                <span className="text-xs font-semibold uppercase text-yellow-700">Overall Rating</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-4xl font-bold text-yellow-600">
                                    {ratingStats.averageRating.toFixed(1)}
                                </div>
                                <span className="text-sm text-gray-600 mb-1">({ratingStats.totalRatings} reviews)</span>
                            </div>
                            <div className="flex items-center gap-1 mt-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        className={i < Math.round(ratingStats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Rating Breakdown */}
                {ratingStats?.totalRatings > 0 && (
                    <div className="mb-6">
                        <RatingStats stats={ratingStats} compact={false} />
                    </div>
                )}

                {/* Aspect Ratings */}
                {aspectRatings && Object.values(aspectRatings).some(v => v) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Aspect Ratings</h4>
                        <div className="space-y-2">
                            {aspectRatings.communication && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Communication</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < Math.round(aspectRatings.communication) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                        <span className="text-xs font-semibold ml-1">{aspectRatings.communication.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                            {aspectRatings.professionalism && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Professionalism</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < Math.round(aspectRatings.professionalism) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                        <span className="text-xs font-semibold ml-1">{aspectRatings.professionalism.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                            {aspectRatings.eventExecution && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Event Execution</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < Math.round(aspectRatings.eventExecution) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                        <span className="text-xs font-semibold ml-1">{aspectRatings.eventExecution.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                            {aspectRatings.valueForMoney && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Value for Money</span>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={12}
                                                className={i < Math.round(aspectRatings.valueForMoney) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                        <span className="text-xs font-semibold ml-1">{aspectRatings.valueForMoney.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Reviews */}
            {recentReviews && recentReviews.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Recent Reviews</h4>
                    <div className="space-y-3">
                        {recentReviews.map((review) => (
                            <ReviewCard key={review._id} review={review} />
                        ))}
                    </div>
                </div>
            )}

            {!ratingStats?.totalRatings && (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No reviews yet. Be the first to review this organizer!</p>
                </div>
            )}
        </div>
    );
}
