# Trust & Reputation System - Testing Guide

## End-to-End Testing Scenarios

### Scenario 1: User Submits Event Review
**Steps:**
1. Log in as an attendee who has a ticket for an event
2. Navigate to event details page
3. Scroll to "Reviews" section
4. Click "Leave a Review" button
5. Select 1-5 star rating
6. Optionally enter review text (max 1000 chars)
7. Click "Submit Review"

**Expected Results:**
- Form disappears
- Loading toast appears briefly
- Success notification shows
- Page refreshes reviews
- New review appears in reviews list
- Rating stats update to show new average and count

---

### Scenario 2: User Submits Organizer Review
**Steps:**
1. User who attended an event by this organizer
2. Go to event details
3. Fill review form with aspects:
   - Communication (1-5)
   - Professionalism (1-5)
   - Event Execution (1-5)
   - Value for Money (1-5)
4. Submit

**Expected Results:**
- Aspect ratings stored with review
- Organizer aspect ratings update on profile
- Average for each aspect recalculated

---

### Scenario 3: View Event Card with Organizer Rating
**Steps:**
1. Navigate to event listings page
2. Look at event cards
3. Check organizer section

**Expected Results:**
- Organizer avatar shown
- Organizer name shown
- Verified badge (if applicable)
- **NEW: Compact rating display** (if organizer has reviews)
  - Stars: ★★★★★ (filled yellow for rating)
  - Rating: "4.8"
  - Count: "(47 reviews)"

---

### Scenario 4: View Event Details with Full Review Section
**Steps:**
1. Click on event card to open details
2. Scroll to "Reviews" section

**Expected Results:**
- Section header: "Reviews" with star icon
- **Rating Stats Box** showing:
  - Large average rating (e.g., "4.8")
  - Total reviews (e.g., "47 reviews")
  - Rating breakdown:
    - 5 stars: ████████░ 85% (40 reviews)
    - 4 stars: ██░░░░░░░ 10% (5 reviews)
    - 3 stars: █░░░░░░░░ 3% (2 reviews)
    - 2 stars: ░░░░░░░░░ 0%
    - 1 stars: ░░░░░░░░░ 0%
- **Leave a Review Button** (if user not event creator)
- **Recent Reviews** section showing:
  - Reviewer avatar
  - Reviewer name
  - 5-star rating
  - Review text excerpt
  - "2 days ago" timestamp
  - "Helpful" button with count
  - "Report" button

---

### Scenario 5: View Organizer Profile with Reputation
**Steps:**
1. Navigate to organizer's profile
2. Look below profile header, above tab bar

**Expected Results:**
- **Organizer Reputation card** showing:
  - **Trust Score**: "85/100" with progress bar
    - Color: green if > 80, blue if > 60, yellow if > 40, gray if < 40
  - **Overall Rating**: "4.7" with 5 stars
    - Count: "150 reviews"
  - **Rating Breakdown** (same as event details)
  - **Aspect Ratings**:
    - Communication: ★★★★★ 4.8
    - Professionalism: ★★★★☆ 4.6
    - Event Execution: ★★★★★ 4.9
    - Value for Money: ★★★★☆ 4.5
  - **Recent Reviews** (last 5 reviews)

---

### Scenario 6: Mark Review as Helpful
**Steps:**
1. On event details or organizer profile
2. Click "Helpful" button under a review

**Expected Results:**
- Button highlights in blue
- Count increments by 1
- Success notification shows

---

### Scenario 7: Report Inappropriate Event
**Steps:**
1. On event details page
2. Click "Report" button (near review list or event header)
3. Select reason:
   - Spam
   - Inappropriate content
   - Fraud
   - Unsafe event
   - False information
   - Copyright
   - Harassment
   - Other
4. Add description
5. Submit

**Expected Results:**
- Report created with "open" status
- Confirmation message shown
- User can see they reported it (button state changes)
- Prevents duplicate reports from same user

---

### Scenario 8: Report Inappropriate Organizer
**Steps:**
1. On organizer profile
2. Click "Report Organizer" button
3. Select reason
4. Add description
5. Submit

**Expected Results:**
- Same as Scenario 7

---

### Scenario 9: Admin Review Reports Queue
**Steps:**
1. Log in as admin/moderator
2. Navigate to admin panel (likely at `/admin/reports` or similar)
3. See pending reports

**Expected Results:**
- List of open/investigating reports
- Filter by status (open, investigating, resolved)
- Each report shows:
  - Target (event or organizer)
  - Reason
  - Reporter name
  - Report count (how many reported)
  - Status
  - Created date

---

### Scenario 10: Admin Resolve Report
**Steps:**
1. In reports queue
2. Click on a report to open
3. Review reason and description
4. Select action:
   - Warning (send user message)
   - Content Removed (hide event/profile)
   - Account Suspended (temporary ban)
   - Account Banned (permanent)
5. Add notes
6. Submit

**Expected Results:**
- Report status changes to "resolved"
- Action recorded with date/admin name
- Appropriate action taken on target
- Report moved to "resolved" section

---

## Visual Layout Guide

### Event Card Layout
```
┌─────────────────────────────────┐
│ [Event Image]                   │
├─────────────────────────────────┤
│ Event Title                     │
│                                 │
│ [Avatar] Username ✓             │ ← Organizer section
│ Organizer                       │
│ ★★★★★ 4.8 (47)                │ ← NEW: Compact rating
│                                 │
│ [Like] [Comment] [Share]       │
└─────────────────────────────────┘
```

### Event Details - Reviews Section
```
Reviews
────────────────────────────────────

Rating Summary:
┌──────────────────────────────┐
│ Average: 4.8/5 (47 reviews)  │
│ ★★★★★                        │
│                              │
│ 5★ ████████░ 85% (40)        │
│ 4★ ██░░░░░░░ 10% (5)         │
│ 3★ █░░░░░░░░ 3% (2)          │
│ 2★ ░░░░░░░░░ 0% (0)          │
│ 1★ ░░░░░░░░░ 0% (0)          │
└──────────────────────────────┘

[ Leave a Review ]

Recent Reviews:
┌──────────────────────────────────┐
│ [Avatar] John Doe     ★★★★★ 5   │
│ "Best event ever!"              │
│ Great venue, wonderful people   │
│ Communication: ★★★★★ 5          │
│ Professionalism: ★★★★☆ 4        │
│ 2 days ago                       │
│ [👍 Helpful (3)] [🚩 Report]    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ [Avatar] Jane Smith   ★★★★☆ 4   │
│ "Good event but too crowded"    │
│ 5 days ago                       │
│ [👍 Helpful (1)] [🚩 Report]    │
└──────────────────────────────────┘
```

### Organizer Profile - Reputation Section
```
Organizer Reputation
────────────────────────────────────

Trust Score                Overall Rating
┌──────────────┐          ┌──────────────┐
│   85/100     │          │  4.7★        │
│ ████████░░░  │          │ ★★★★★        │
│ out of 100   │          │ (150 reviews)│
└──────────────┘          └──────────────┘

Rating Distribution:
5★ ████████░ 85% (127)
4★ ██░░░░░░░ 10% (15)
3★ █░░░░░░░░ 3% (5)
2★ █░░░░░░░░ 2% (3)
1★ ░░░░░░░░░ 0% (0)

Aspect Ratings:
Communication       ★★★★★ 4.8
Professionalism     ★★★★☆ 4.6
Event Execution     ★★★★★ 4.9
Value for Money     ★★★★☆ 4.5

Recent Reviews:
[5 most recent reviews listed]
```

---

## Common Edge Cases to Test

1. **No Reviews Yet**
   - Empty state message: "No reviews yet. Be the first to share!"
   - No stats box shown
   - No aspect ratings shown

2. **Duplicate Review Attempt**
   - User tries to review same event twice
   - API returns 400 with message "You have already reviewed this event"
   - Toast error shown

3. **Non-Attendee Review Attempt**
   - User without ticket tries to submit review
   - API returns 403 with message "Only attendees can review events"
   - Form disabled or hidden

4. **Not Logged In**
   - "Leave a Review" button prompts login
   - Redirect to login page
   - Return to event details after login

5. **Event Creator Viewing Own Event**
   - Review form not shown
   - Cannot rate own event

---

## Performance Testing

1. **Load Time**: Event details with 100+ reviews should load quickly
   - Uses pagination (loads only 5 initially)
   - API returns aggregated stats efficiently

2. **Rating Updates**: After submitting review, stats update immediately
   - Average rating changes
   - Total count increases
   - Distribution percentages recalculate

3. **Organizer Card Display**: Compact rating loads without blocking event card
   - Card appears instantly
   - Rating loads asynchronously
   - Gracefully skips if API fails

---

## Browser Compatibility

Test on:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Mobile (iOS Safari, Chrome Android)

Expected behavior:
- Responsive layout on mobile
- Touch-friendly buttons/forms
- Accessible color contrast
- Readable font sizes

---

## Accessibility Testing

Check:
- Form labels clearly associated
- Star ratings keyboard accessible
- Error messages announced
- Loading states indicated
- Color not sole indicator (ratings also show numbers)
- Proper heading hierarchy

---

## Success Criteria

✅ All scenarios above work without errors
✅ Ratings appear on event cards and details
✅ Trust scores appear on organizer profiles
✅ Reports submitted and viewable by admin
✅ Review form validation works
✅ Loading states show appropriate feedback
✅ No console errors
✅ Mobile layout responsive
✅ Accessibility standards met
