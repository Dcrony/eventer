# Trust & Reputation System - Integration Complete

## Summary
The Trust & Reputation System has been fully integrated across TickiSpot's frontend and backend. This document summarizes the implementation and how everything works together.

## What's Been Implemented

### Backend (Complete)
✅ **Rating Model** - Stores reviews, ratings, aspect ratings, and moderation data
✅ **Report Model** - Tracks inappropriate content/organizer reports with admin workflow
✅ **Reputation Service** - Calculates trust scores, aggregates ratings, validates attendance
✅ **Rating Controller** - REST API endpoints for all rating/review operations
✅ **Rating Routes** - Express router with auth/role-based protection
✅ **Server Integration** - Routes mounted at `/api/ratings/*`

### Frontend Components (Complete)
✅ **ReviewForm** - Form to submit event/organizer reviews with star ratings
✅ **RatingStats** - Displays rating summary with distribution breakdown
✅ **ReviewCard** - Individual review display with text, ratings, helpful votes
✅ **CompactOrganizerRating** - Compact rating display for event cards
✅ **OrganizerReputation** - Full reputation profile for organizer pages
✅ **Reputation Utils** - Helper functions for loading reputation data

### Page Integrations (Complete)
✅ **EventCard** - Shows CompactOrganizerRating in organizer section
✅ **EventDetails** - Reviews section with stats, form, and review list
✅ **Profile** - Shows full organizer reputation when viewing organizer profiles

## Features

### For Users (Attendees)
- **Leave Reviews** - Rate events and organizers after attendance (1-5 stars)
- **Aspect Ratings** - For organizers: communication, professionalism, execution, value
- **Report Content** - Flag inappropriate events or organizers with reason and description
- **Vote Helpful** - Mark reviews as helpful for other attendees
- **View Ratings** - See event ratings and organizer trust scores before purchasing

### For Organizers
- **Trust Score** - 0-100 metric based on verification, ratings, activity, history
- **Reputation Metrics** - Average rating, total reviews, rating distribution
- **Aspect Feedback** - Detailed feedback on specific strengths/weaknesses
- **Recent Reviews** - See latest feedback from attendees

### For Admins
- **Report Queue** - Admin panel to review flagged events/organizers
- **Moderation Actions** - Resolve reports with action taken (warning, suspend, ban)
- **Review Management** - Flag inappropriate reviews for hiding
- **Audit Trail** - Complete record of who resolved what and when

## Data Flow

### Review Submission Flow
```
User fills ReviewForm
  ↓
Validates attendance (Ticket record)
  ↓
Checks for duplicate reviews (same user, same target)
  ↓
Calculates rating metrics snapshot
  ↓
Stores in Rating collection
  ↓
Triggers organizer notification
  ↓
Returns success, form clears
```

### Trust Score Calculation
```
Base Score: 50
+ Verification: +30 (if organizer verified)
+ Rating: +20 (based on average rating, capped at 20)
+ Activity: +10 (based on event count, capped at 10)
- Penalties: -10 per report
+ History: +5 (if account > 90 days old)
= Final Trust Score (0-100)
```

### Rating Display Flow
```
Page loads with event/organizer ID
  ↓
Load rating stats via getRatingStats API
  ↓
Load reviews via getReviews API
  ↓
Render RatingStats component with breakdown
  ↓
Display ReviewCard for each review
  ↓
Show ReviewForm for logged-in users (only if attended event)
```

## API Endpoints

### Rating Endpoints
- `GET /api/ratings/stats?targetType=event&targetId=X` - Get event rating stats
- `GET /api/ratings/list?targetType=event&targetId=X&limit=5&skip=0` - Get event reviews
- `POST /api/ratings/submit` - Submit new review (requires auth + attendance)
- `GET /api/ratings/organizer/:id/reputation` - Get organizer full reputation profile
- `POST /api/ratings/:reviewId/helpful` - Mark review helpful (requires auth)

### Report Endpoints
- `POST /api/ratings/report` - Report event/organizer (requires auth)
- `GET /api/ratings/admin/reports?status=open&limit=10` - Get reports (admin only)
- `POST /api/ratings/admin/report/:id/resolve` - Resolve report (admin only)

## Component Props

### ReviewForm
```jsx
<ReviewForm
  targetType="event" // "event" or "organizer"
  targetId={eventId}
  eventId={eventId} // Required for event reviews
  onSubmitSuccess={() => {}} // Callback after submit
  onCancel={() => {}} // Callback to close form
  isOpen={true} // Control visibility
/>
```

### RatingStats
```jsx
<RatingStats
  stats={{
    averageRating: 4.5,
    totalRatings: 120,
    ratingCounts: { 5: 80, 4: 30, 3: 8, 2: 2, 1: 0 }
  }}
  compact={false} // true for card display
/>
```

### ReviewCard
```jsx
<ReviewCard
  review={{
    _id: "...",
    rating: 5,
    review: "Great event!",
    reviewer: { name: "John", avatar: "..." },
    aspectRatings: { communication: 5, professionalism: 4 },
    createdAt: "2024-01-20"
  }}
/>
```

### CompactOrganizerRating
```jsx
<CompactOrganizerRating
  organizerId={orgId}
  averageRating={4.8}
  totalRatings={150}
/>
```

### OrganizerReputation
```jsx
<OrganizerReputation
  organizerId={orgId}
  compact={false} // true for sidebar display
/>
```

## Error Handling

All components gracefully handle:
- Loading states (spinners/skeleton)
- API errors (toast notifications)
- Missing data (empty states)
- Permission errors (auth checks)
- Duplicate reviews (validation)
- Non-attendance (attendance check)

## Styling

- **Colors**: Pink/gray TickiSpot theme
- **Icons**: Lucide React icons
- **Layout**: Tailwind CSS with responsive design
- **Consistency**: Matches existing TickiSpot UI patterns

## Performance Optimizations

1. **Lazy Loading** - Organizer reputation loads on mount
2. **Caching** - Rating stats cached during session
3. **Pagination** - Reviews support limit/skip for pagination
4. **Aggregation** - MongoDB aggregation pipeline for stats calculation
5. **Selective Population** - Only populate necessary fields

## Testing Checklist

- [ ] Submit event review as attendee
- [ ] Submit organizer review with aspect ratings
- [ ] Verify trust score updates on profile
- [ ] View rating distribution breakdown
- [ ] Mark review as helpful
- [ ] Report inappropriate event/organizer
- [ ] Verify report appears in admin queue
- [ ] Admin resolve report with action
- [ ] Verify compactorganizer rating shows in event cards
- [ ] Verify reviews appear in EventDetails and organizer profile
- [ ] Test with no reviews (empty states)
- [ ] Test pagination on reviews (load more)

## Future Enhancements

1. **Review Responses** - Organizers respond to reviews
2. **Review Moderation** - Community voting to hide unhelpful reviews
3. **Verification Badges** - "Verified Attendee" badge on reviews
4. **Review Filters** - Filter by rating, aspect, date
5. **Review Highlights** - AI-powered summary of reviews
6. **Media in Reviews** - Photos/videos with reviews
7. **Review Analytics** - Organizer dashboard showing review trends
8. **Smart Reporting** - Automated detection of fake/spam reviews
9. **Review Prompts** - Post-event email with review link
10. **Reputation Graph** - Trust score over time visualization

## File Locations

**Backend:**
- `/server/models/Rating.js` - Review/rating model
- `/server/models/Report.js` - Report model
- `/server/services/reputationService.js` - Business logic
- `/server/controllers/ratingController.js` - API handlers
- `/server/routes/ratingRoutes.js` - Route definitions

**Frontend Components:**
- `/client/src/components/ReviewForm.jsx` - Review form
- `/client/src/components/RatingStats.jsx` - Stats display
- `/client/src/components/ReviewCard.jsx` - Review display
- `/client/src/components/CompactOrganizerRating.jsx` - Compact rating
- `/client/src/components/OrganizerReputation.jsx` - Reputation profile

**Frontend Utils:**
- `/client/src/services/api/ratings.js` - API wrapper
- `/client/src/utils/reputationUtils.js` - Helper functions

**Frontend Pages (Modified):**
- `/client/src/components/EventCard.jsx` - Added rating display
- `/client/src/pages/EventDetails.jsx` - Added reviews section
- `/client/src/pages/Profile.jsx` - Added organizer reputation

**Documentation:**
- `/TRUST_REPUTATION_INTEGRATION.md` - This file
- `/INTEGRATION_REPORT.md` - Original integration analysis

## Support

For issues or questions about the Trust & Reputation System, refer to:
1. Component prop documentation above
2. Integration guide comments in page files
3. API endpoint definitions in controller
4. Error messages and console logs
