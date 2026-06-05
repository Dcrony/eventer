# Trust & Reputation System - Frontend Integration Guide

## Overview
This guide explains how to integrate the Trust & Reputation System across TickiSpot's frontend.

## Components Created

### 1. **ReviewForm** (`ReviewForm.jsx`)
- Form to submit ratings and reviews for events/organizers
- Star rating selector with optional aspect ratings
- Text review input (max 1000 chars)
- For organizers: Communication, Professionalism, Event Execution, Value for Money

**Usage:**
```jsx
import ReviewForm from "../components/ReviewForm";

<ReviewForm
  targetType="event" // or "organizer"
  targetId={eventId}
  eventId={eventId}
  onSubmitSuccess={() => {
    // Refresh ratings
    loadEventRatings(eventId);
  }}
  onCancel={() => setShowReviewForm(false)}
  isOpen={showReviewForm}
/>
```

### 2. **RatingStats** (`RatingStats.jsx`)
- Displays overall rating summary
- Shows rating distribution (5★, 4★, etc.)
- Compact mode available for cards

**Usage:**
```jsx
import RatingStats from "../components/RatingStats";

const [stats, setStats] = useState(null);

useEffect(() => {
  loadEventRatings(eventId).then(setStats);
}, [eventId]);

<RatingStats stats={stats} compact={false} />
```

### 3. **ReviewCard** (`ReviewCard.jsx`)
- Displays individual reviews
- Shows reviewer avatar, rating, text, aspect ratings
- Helpful voting, reporting

**Usage:**
```jsx
import ReviewCard from "../components/ReviewCard";

{reviews.map(review => (
  <ReviewCard
    key={review._id}
    review={review}
    onReportClick={(reviewId) => handleReportReview(reviewId)}
    onHelpfulClick={(reviewId) => markHelpful(reviewId)}
  />
))}
```

### 4. **OrganizerReputation** (`OrganizerReputation.jsx`)
- Shows complete organizer reputation profile
- Trust score, aspect ratings, recent reviews
- Compact mode for sidebar display

**Usage:**
```jsx
import OrganizerReputation from "../components/OrganizerReputation";

// Compact display (for event cards)
<OrganizerReputation organizerId={organizerId} compact={true} />

// Full display (for profile page)
<OrganizerReputation organizerId={organizerId} compact={false} />
```

### 5. **CompactOrganizerRating** (`CompactOrganizerRating.jsx`)
- Shows rating summary in event listings
- Used next to verified badge

**Usage:**
```jsx
import CompactOrganizerRating from "../components/CompactOrganizerRating";

<CompactOrganizerRating
  organizerId={organizer._id}
  averageRating={stats.averageRating}
  totalRatings={stats.totalRatings}
/>
```

## Integration Points

### EventCard Component
**Where:** `client/src/components/EventCard.jsx` (line ~278)

Add after VerifiedBadge:
```jsx
{organizer && <VerifiedBadge user={organizer} />}
{/* Add this: */}
{organizerRating && (
  <CompactOrganizerRating
    organizerId={organizer._id}
    averageRating={organizerRating.averageRating}
    totalRatings={organizerRating.totalRatings}
  />
)}
```

### EventDetails Page
**Where:** `client/src/pages/EventDetails.jsx`

**Add imports:**
```jsx
import ReviewForm from "../components/ReviewForm";
import RatingStats from "../components/RatingStats";
import ReviewCard from "../components/ReviewCard";
import { loadEventRatings, loadEventReviews } from "../utils/reputationUtils";
```

**Add state:**
```jsx
const [showReviewForm, setShowReviewForm] = useState(false);
const [ratingStats, setRatingStats] = useState(null);
const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
```

**Add effect:**
```jsx
useEffect(() => {
  if (eventId) {
    // Load ratings
    loadEventRatings(eventId).then(setRatingStats);
    // Load reviews
    setReviewsLoading(true);
    loadEventReviews(eventId, 5).then(result => {
      setReviews(result.reviews);
      setReviewsLoading(false);
    });
  }
}, [eventId]);
```

**Add section after Team section (around line 450):**
```jsx
{/* Reviews Section */}
<section>
  <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-pink-500 mb-3">
    <Star size={14} /> Reviews
  </span>
  
  {ratingStats && <RatingStats stats={ratingStats} />}
  
  {currentUser && currentUser._id !== event.createdBy._id && (
    <ReviewForm
      targetType="event"
      targetId={eventId}
      eventId={eventId}
      onSubmitSuccess={() => {
        loadEventRatings(eventId).then(setRatingStats);
        loadEventReviews(eventId, 5).then(r => setReviews(r.reviews));
        setShowReviewForm(false);
      }}
      onCancel={() => setShowReviewForm(false)}
      isOpen={showReviewForm}
    />
  )}
  
  {!showReviewForm && currentUser && currentUser._id !== event.createdBy._id && (
    <button
      onClick={() => setShowReviewForm(true)}
      className="mt-4 w-full py-2 px-4 rounded-lg bg-pink-500 text-white text-sm font-bold"
    >
      Leave a Review
    </button>
  )}
  
  <div className="mt-4 space-y-3">
    {reviewsLoading ? (
      <p className="text-gray-500 text-sm">Loading reviews...</p>
    ) : reviews.length ? (
      reviews.map(review => (
        <ReviewCard key={review._id} review={review} />
      ))
    ) : (
      <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
    )}
  </div>
</section>
```

### Profile Page
**Where:** `client/src/pages/Profile.jsx`

**Add imports:**
```jsx
import OrganizerReputation from "../components/OrganizerReputation";
import { loadOrganizerReputation } from "../utils/reputationUtils";
```

**Add section after organizer info (recommended placement: after "What to expect" section):**
```jsx
{/* Organizer Reputation (if viewing organizer profile) */}
{profile?.role === "organizer" && isOwnProfile && (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
    <OrganizerReputation organizerId={profile._id} compact={false} />
  </div>
)}
```

### Post-Event Review Prompt
**Where:** Event completion/attendance confirmation page

**Implementation:**
```jsx
import ReviewForm from "../components/ReviewForm";

function PostEventReviewPrompt({ event, onReviewComplete }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          How was {event.title}?
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Share your experience to help the organizer improve future events
        </p>
        
        <ReviewForm
          targetType="event"
          targetId={event._id}
          eventId={event._id}
          onSubmitSuccess={onReviewComplete}
          isOpen={true}
        />
      </div>
    </div>
  );
}
```

## API Endpoints Reference

### Rating Operations
- `POST /api/ratings/submit` - Submit a review
- `GET /api/ratings/list?targetType=event&targetId=X` - Get reviews
- `GET /api/ratings/stats?targetType=organizer&targetId=X` - Get rating stats
- `GET /api/ratings/organizer/:id/reputation` - Get organizer full reputation

### Report Operations
- `POST /api/ratings/report` - Report event/organizer
- `GET /api/ratings/admin/reports?status=open` - Admin: list reports
- `POST /api/ratings/admin/report/:id/resolve` - Admin: resolve report

### Helpful Voting
- `POST /api/ratings/:reviewId/helpful` - Mark review as helpful

## State Management Pattern

```javascript
// Generic pattern for loading ratings/reviews
const [ratingStats, setRatingStats] = useState(null);
const [reviews, setReviews] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const stats = await loadEventRatings(targetId);
    const { reviews: fetchedReviews } = await loadEventReviews(targetId, 5);
    setRatingStats(stats);
    setReviews(fetchedReviews);
    setLoading(false);
  };
  
  loadData();
}, [targetId]);
```

## CSS Classes Used

- Tailwind classes are used throughout
- No custom CSS required
- Consistent pink/gray color scheme with TickiSpot branding

## Notes

1. **Permissions:** Only allow review submission to users who attended the event (validated server-side)
2. **Moderation:** Reviews can be flagged/hidden by admins
3. **Privacy:** Review author names are visible but detailed profile links depend on privacy settings
4. **Caching:** Consider caching rating stats (they don't change frequently)
5. **Pagination:** Reviews support pagination - load more on scroll if needed
