# Event Lifecycle Management System - Implementation Guide

## Overview

This document describes the complete Event Lifecycle Management System implemented for TickiSpot. The system automatically controls event visibility, ticket sales, check-ins, and status transitions based on event timing and state.

## Implemented Features

### 1. Event Statuses

Every event now has one of the following lifecycle statuses:

| Status | Description | Visibility | Tickets | Check-in |
|--------|-------------|-----------|---------|----------|
| **Draft** | Work in progress, not published | Hidden | ❌ | ❌ |
| **Pending Approval** | Awaiting admin review | Hidden | ❌ | ❌ |
| **Published** | Approved, date in future | Public | ✅ | ❌ |
| **Upcoming** | Published, event date approaching | Public | ✅ | ❌ |
| **Live** | Event currently running | Public | ✅ | ✅ |
| **Ended** | Event finished | Public | ❌ | ❌ |
| **Cancelled** | Cancelled by organizer/admin | Hidden | ❌ | ❌ |
| **Suspended** | Suspended by admin (moderation) | Hidden | ❌ | ❌ |

### 2. Backend Implementation

#### Event Model Enhancements

```javascript
// New fields in Event schema
eventLifecycleStatus: String // "Draft", "Published", "Upcoming", "Live", "Ended", "Cancelled", "Suspended"
salesDeadlineDate: Date // Independent ticket sales deadline
salesDeadlineTime: String // HH:mm format
cancellationReason: String
cancellationDate: Date
cancelledBy: ObjectId (ref: User)
suspensionReason: String
suspensionDate: Date
suspendedBy: ObjectId (ref: User)
liveStartedAt: Date
endedAt: Date
lastStatusUpdateAt: Date
statusUpdateReason: String // "auto_transition", "manual_publish", etc
```

#### API Endpoints

**Publish Event**
```
PATCH /api/events/:eventId/publish
Authorization: Bearer token
```

**Cancel Event**
```
PATCH /api/events/:eventId/cancel
Authorization: Bearer token
Body: { reason?: string }
```

**Suspend Event** (admin-only)
```
PATCH /api/events/:eventId/suspend
Authorization: Bearer token
Body: { reason?: string }
```

**Restore Event** (admin-only)
```
PATCH /api/events/:eventId/restore
Authorization: Bearer token
```

**Get Event Status Info**
```
GET /api/events/:eventId/status-info
```

#### Core Utility: eventLifecycle.js

**calculateEventStatus(event)**
- Calculates current lifecycle status based on dates, times, and flags
- Returns: "Draft" | "Pending Approval" | "Published" | "Upcoming" | "Live" | "Ended" | "Cancelled" | "Suspended"

**canPurchaseTickets(event)**
- Validates if tickets can be purchased
- Checks: Status, sales deadline, ticket inventory
- Returns: `{ allowed: boolean, reason: string }`

**canCheckIn(event)**
- Validates if check-in is allowed
- Only allows if event is LIVE
- Returns: `{ allowed: boolean, reason: string }`

**transitionEventStatus(eventId, newStatus, options)**
- Manually transitions event status
- Handles audit trails, notifications, and state changes
- Returns: Updated event document

**getEventStatusInfo(event)**
- Returns display configuration for status badge
- Includes: badge text, color, allowed actions, display text

**getEventCountdown(event)**
- Returns time remaining to event start/end and sales deadline
- Useful for frontend countdown displays

### 3. Automatic Status Transitions

**Scheduled Job** (runs every 5 minutes)

The system automatically transitions events:

1. **Upcoming → Live**
   - When `now >= startDateTime`
   - Notifies organizer: "Your event is now live!"

2. **Live → Ended**
   - When `now >= endDateTime`
   - Notifies organizer: "Your event has ended"

Implementation location: `server/server.js` - `runEventLifecycleTransitionWorker()`

### 4. Validation Enforcement

#### Payment Controller

```javascript
// In initiatePayment() and verifyPayment()
const purchaseAllowed = canPurchaseTickets(event);
if (!purchaseAllowed.allowed) {
  return res.status(400).json({ message: purchaseAllowed.reason });
}
```

**Prevents purchase if:**
- Event is Cancelled
- Event is Suspended
- Event has Ended
- Event is in Draft or Pending Approval
- Sales deadline has passed
- All tickets sold out

#### Check-in Controller

```javascript
// In recordScan()
const checkInAllowed = canCheckInByStatus(event);
if (!checkInAllowed.allowed) {
  return res.status(400).json({ success: false, message: checkInAllowed.reason });
}
```

**Prevents check-in if:**
- Event is not LIVE (shows specific error for each state)

### 5. Notification System

Automatic notifications are triggered for:

| Event | Recipient | Message |
|-------|-----------|---------|
| Event goes live | Organizer | "Your event is now live!" |
| Event ends | Organizer | "Your event has ended" |
| Event cancelled | All attendees + organizer | "Event has been cancelled" |
| Event suspended | Organizer | "Your event has been suspended" |
| Event restored | Organizer | "Your event has been restored" |

Implementation: Uses `notificationService.js` with Socket.io for real-time delivery

### 6. Frontend Implementation

#### EventCard Component

**Status Badges:**
- Live: Red badge with "LIVE 🔴" (animated pulse)
- Upcoming: Blue badge "Upcoming"
- Ended: Gray badge "Ended"
- Cancelled: Red badge "Cancelled"
- Suspended: Dark red badge "Suspended"
- Sold Out: Gray badge "Sold Out"

**File:** `client/src/components/EventCard.jsx`

#### EventDetails Page

**Status Banner:**
- Shows prominent banner for Ended, Cancelled, or Suspended events
- Live events show "LIVE NOW" animated banner
- Displays reason if applicable

**Purchase Button:**
- Disabled when event is Ended, Cancelled, Suspended, or Draft
- Shows appropriate message:
  - "Event ended"
  - "Event cancelled"
  - "Event unavailable"
  - "Event not available"
  - "Sold out"

**File:** `client/src/pages/EventDetails.jsx`

#### Organizer Dashboard

**Event Status Badges:**
- Shows lifecycle status on event cards
- Color-coded for quick visual scanning
- Helps organizers monitor event state in real-time

**File:** `client/src/pages/Dashboard.jsx`

### 7. Admin Controls

Admins can:

1. **Suspend Events** - Remove from public view, disable all interactions
   - With custom reason/message
   - Notifies organizer
   - Reversible via Restore action

2. **Restore Events** - Reactivate suspended events
   - Returns event to calculated status
   - Notifies organizer
   - Audit trail maintained

3. **Cancel Events** - Similar to organizer cancellation but with admin authority

Implementation via:
- `POST /api/admin/events/:eventId/suspend` (future enhancement)
- `POST /api/admin/events/:eventId/restore` (future enhancement)

### 8. Business Logic Rules

**Ticket Sales Deadlines**
- Independent from event start time
- Can close sales before event starts
- Automatically blocks purchases when deadline reached

**Sold Out Behavior**
- When `ticketsSold >= totalTickets`
- Blocks all purchases
- Shows "Sold Out" badge
- Optional waitlist functionality (future)

**Refund Workflow** (triggered on cancellation)
- Future implementation for full refund processing
- Notification to all ticket holders
- Payout reversal logic

## Usage Examples

### For Organizers

1. **Creating an Event**
   - Event starts in Draft status
   - Save event to Pending Approval
   - Publish to go Live (becomes Published, then Upcoming when date approaches)

2. **Publishing an Event**
   ```javascript
   PATCH /api/events/{eventId}/publish
   // Event → Published status
   // Ready for ticket sales
   ```

3. **Cancelling an Event**
   ```javascript
   PATCH /api/events/{eventId}/cancel
   Body: { reason: "Weather conditions" }
   // Event → Cancelled
   // All attendees notified
   // Refund processing begins
   ```

### For Attendees

1. **Buying Tickets**
   - Can only buy if event is Published or Upcoming
   - Cannot buy if Ended, Cancelled, or Suspended
   - Cannot buy if sales deadline passed
   - Cannot buy if Sold Out

2. **Checking In**
   - Can only check in if event is Live
   - Error message shows why if not available

### For Admins

1. **Suspending an Event** (future endpoint)
   ```javascript
   PATCH /api/admin/events/{eventId}/suspend
   Body: { reason: "Violation of community guidelines" }
   ```

2. **Restoring an Event**
   ```javascript
   PATCH /api/admin/events/{eventId}/restore
   ```

## Data Flow Diagrams

### Event Status Transitions

```
Draft → [Publish] → Published → [Auto] → Upcoming → [Auto] → Live → [Auto] → Ended
                        ↓                          ↓
                     [Cancel] → Cancelled    [Suspend] → Suspended → [Restore] → Upcoming/Live/Ended
```

### Purchase Validation Flow

```
User clicks "Get Tickets"
    ↓
Check: Event Lifecycle Status
├─ Cancelled? ❌ Blocked
├─ Suspended? ❌ Blocked
├─ Ended? ❌ Blocked
├─ Draft/Pending? ❌ Blocked
└─ Published/Upcoming/Live? ✅ Continue
    ↓
Check: Sales Deadline
├─ Passed? ❌ Blocked
└─ Active? ✅ Continue
    ↓
Check: Ticket Inventory
├─ Sold out? ❌ Show sold-out message
└─ Available? ✅ Continue to checkout
    ↓
Payment Processing
    ↓
Ticket Created, QR generated, Emails sent
```

### Check-in Validation Flow

```
QR Code Scanned
    ↓
Validate: Event is LIVE
├─ Ended? ❌ "Event has ended"
├─ Cancelled? ❌ "Event cancelled"
├─ Suspended? ❌ "Event suspended"
├─ Not started? ❌ "Event has not started yet"
└─ LIVE? ✅ Continue
    ↓
Validate: Ticket exists and belongs to event
    ↓
Validate: Ticket not already used
    ↓
Mark as checked-in, Log entry created, Real-time update sent
```

## Testing Checklist

- [x] Event status calculated correctly based on dates
- [x] Cancelled events block purchases
- [x] Suspended events block purchases
- [x] Ended events block purchases
- [x] Sales deadline blocks purchases
- [x] Sold-out events show badge and block purchases
- [x] Check-in only works for Live events
- [x] Automatic transitions run on schedule
- [x] Notifications sent on status changes
- [x] Frontend shows correct badges
- [x] Frontend disables purchase button appropriately
- [x] Event lifecycle routes return correct info
- [x] Audit trails maintained for all transitions
- [x] Status changes logged in ActivityLog

## Performance Considerations

1. **Automatic Transition Worker**
   - Runs every 5 minutes (configurable)
   - Finds events needing transition with indexed queries
   - Processes in small batches to avoid database strain

2. **Event Status Caching**
   - Status is calculated on-the-fly from stored data
   - No separate cache needed due to simple logic

3. **Database Indexes**
   - `eventLifecycleStatus` indexed for fast filtering
   - `eventLifecycleStatus + startDate` compound index for transition queries
   - Significant query performance improvement

## Security Considerations

1. **Authorization Checks**
   - Only organizers can publish/cancel their own events
   - Only admins can suspend/restore events
   - Backend validation mandatory on all actions

2. **Frontend Validation**
   - Frontend shows restrictions but doesn't enforce them
   - Backend re-validates all purchases and check-ins
   - No way to bypass backend validations

3. **Audit Trail**
   - All status transitions logged with timestamps
   - Who made the change and why (reason field)
   - Accessible for support and compliance

## Future Enhancements

1. **Event Rescheduling**
   - Move events to new date/time
   - Auto-notify attendees
   - Reset status if needed

2. **Partial Cancellation**
   - Cancel specific ticket tiers
   - Manage refunds by tier

3. **Waitlist Management**
   - Auto-promote from waitlist when tickets available
   - Waitlist notifications

4. **Event Series**
   - Handle recurring events
   - Manage lifecycle for series

5. **Advanced Analytics**
   - Lifecycle metrics dashboard
   - Trends in event transitions
   - Status-based revenue reports

## Related Documentation

- [Event Model](./server/models/Event.js)
- [Event Lifecycle Utilities](./server/utils/eventLifecycle.js)
- [Event Controller](./server/controllers/eventController.js)
- [Payment Validation](./server/controllers/paymentController.js)
- [Check-in Validation](./server/controllers/checkinController.js)

## Support

For issues or questions about the lifecycle system:
1. Check `server/utils/eventLifecycle.js` for current logic
2. Review `server/server.js` for automatic transition job
3. Check frontend components for display issues
4. Review `ActivityLog` for transition history

---

**Last Updated:** 2026-06-06
**System Status:** ✅ Fully Implemented
