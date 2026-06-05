import React, { useState } from "react";
import { Star, Send, X } from "lucide-react";
import Button from "./ui/button";
import { submitReview } from "../services/api/ratings";

/**
 * ReviewForm component - form to submit event/organizer reviews
 */
export default function ReviewForm({
    targetType,
    targetId,
    eventId,
    onSubmitSuccess,
    onCancel,
    isOpen = true,
}) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // For organizer reviews
    const [aspects, setAspects] = useState({
        communication: 0,
        professionalism: 0,
        eventExecution: 0,
        valueForMoney: 0,
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) {
            setError("Please select a rating");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const payload = {
                targetType,
                targetId,
                rating,
                review: review.trim(),
                eventId: eventId || undefined,
            };

            if (targetType === "organizer") {
                payload.organizerAspects = {
                    communication: aspects.communication || null,
                    professionalism: aspects.professionalism || null,
                    eventExecution: aspects.eventExecution || null,
                    valueForMoney: aspects.valueForMoney || null,
                };
            }

            await submitReview(payload);
            onSubmitSuccess?.();
            setRating(0);
            setReview("");
            setAspects({
                communication: 0,
                professionalism: 0,
                eventExecution: 0,
                valueForMoney: 0,
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                    {targetType === "event" ? "Rate this Event" : "Rate this Organizer"}
                </h3>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Your Rating
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    size={32}
                                    className={
                                        star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                    }
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {rating} out of 5 stars selected
                        </p>
                    )}
                </div>

                {/* Aspect ratings for organizer */}
                {targetType === "organizer" && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <p className="text-xs font-semibold text-gray-900">
                            Rate the organizer on these aspects (optional):
                        </p>
                        {Object.keys(aspects).map((aspect) => (
                            <div key={aspect} className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-700 capitalize">
                                    {aspect.replace(/([A-Z])/g, " $1").toLowerCase()}
                                </label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() =>
                                                setAspects((prev) => ({
                                                    ...prev,
                                                    [aspect]: aspects[aspect] === star ? 0 : star,
                                                }))
                                            }
                                            className="transition-transform"
                                        >
                                            <Star
                                                size={16}
                                                className={
                                                    star <= aspects[aspect]
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Review text */}
                <div>
                    <label htmlFor="review" className="block text-sm font-semibold text-gray-900 mb-2">
                        Your Review (optional)
                    </label>
                    <textarea
                        id="review"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience..."
                        maxLength={1000}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {review.length}/1000 characters
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Submit button */}
                <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <Send size={16} />
                    {submitting ? "Submitting..." : "Submit Review"}
                </Button>
            </form>
        </div>
    );
}
