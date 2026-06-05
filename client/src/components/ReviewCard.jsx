import React, { useState } from "react";
import { Star, ThumbsUp, Flag } from "lucide-react";
import Avatar from "./ui/avatar";
import { getProfileImageUrl } from "../utils/eventHelpers";

/**
 * ReviewCard component - displays a single review/rating
 */
export default function ReviewCard({ review, onReportClick, onHelpfulClick }) {
    const [isHelpful, setIsHelpful] = useState(false);

    const handleHelpful = () => {
        setIsHelpful(true);
        onHelpfulClick?.(review._id, true);
    };

    const handleReport = () => {
        onReportClick?.(review._id, review.reviewer?._id);
    };

    const ratingStars = Array.from({ length: 5 }).map((_, i) => (
        <Star
            key={i}
            size={14}
            className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
    ));

    return (
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
            {/* Header: Avatar, Name, Rating */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                    <Avatar size="sm" src={getProfileImageUrl(review.reviewer?.profilePic)} />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                            {review.reviewer?.name || "Anonymous"}
                        </p>
                        <div className="flex items-center gap-1">{ratingStars}</div>
                    </div>
                </div>
                <button
                    onClick={handleReport}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Report this review"
                >
                    <Flag size={16} />
                </button>
            </div>

            {/* Review text */}
            {review.review && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{review.review}</p>
            )}

            {/* Aspect ratings if available */}
            {review.organizerAspects && Object.values(review.organizerAspects).some(v => v) && (
                <div className="mb-3 text-xs grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded">
                    {review.organizerAspects.communication && (
                        <div>Communication: <span className="font-semibold">{review.organizerAspects.communication}★</span></div>
                    )}
                    {review.organizerAspects.professionalism && (
                        <div>Professionalism: <span className="font-semibold">{review.organizerAspects.professionalism}★</span></div>
                    )}
                    {review.organizerAspects.eventExecution && (
                        <div>Execution: <span className="font-semibold">{review.organizerAspects.eventExecution}★</span></div>
                    )}
                    {review.organizerAspects.valueForMoney && (
                        <div>Value: <span className="font-semibold">{review.organizerAspects.valueForMoney}★</span></div>
                    )}
                </div>
            )}

            {/* Helpful & Date */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                    onClick={handleHelpful}
                    disabled={isHelpful}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${isHelpful
                            ? "bg-blue-100 text-blue-600"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                >
                    <ThumbsUp size={12} />
                    Helpful ({review.helpful || 0})
                </button>
                <span>
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            </div>
        </div>
    );
}
