/**
 * Event Lifecycle Management Utility
 * Handles status calculation, transitions, and validation
 */

const Event = require('../models/Event');

/**
 * Calculate the current event lifecycle status based on:
 * - Draft/Published state
 * - Event dates/times
 * - Cancellation/Suspension state
 * @param {Object} event - Event document
 * @returns {string} - Current lifecycle status
 */
function calculateEventStatus(event) {
  if (!event) return 'Draft';

  // Suspended events stay suspended
  if (event.suspensionDate && event.suspensionReason) {
    return 'Suspended';
  }

  // Cancelled events stay cancelled
  if (event.cancellationDate && event.cancellationReason) {
    return 'Cancelled';
  }

  // Draft events
  if (event.isDraft === true) {
    return 'Draft';
  }

  // Not published yet (auto-approved but not activated)
  if (event.eventLifecycleStatus === 'Pending Approval') {
    return 'Pending Approval';
  }

  // If event is published but not yet in any timeline state
  if (!event.startDate || !event.endDate) {
    return 'Published';
  }

  const now = new Date();
  const startDateTime = combineDateTime(event.startDate, event.startTime);
  const endDateTime = combineDateTime(event.endDate, event.endTime);

  // Event has ended
  if (now >= endDateTime) {
    return 'Ended';
  }

  // Event is currently live
  if (now >= startDateTime && now < endDateTime) {
    return 'Live';
  }

  // Event is upcoming
  if (now < startDateTime) {
    return 'Upcoming';
  }

  return 'Published';
}

/**
 * Combine date and time strings into a Date object
 * @param {Date|string} date - Date object or ISO string
 * @param {string} time - Time string in HH:mm format
 * @returns {Date}
 */
function combineDateTime(date, time) {
  const dateObj = new Date(date);
  
  if (time && typeof time === 'string') {
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours || 0, minutes || 0, 0, 0);
  }
  
  return dateObj;
}

/**
 * Check if ticket sales are currently allowed
 * @param {Object} event - Event document
 * @returns {Object} - { allowed: boolean, reason: string }
 */
function canPurchaseTickets(event) {
  if (!event) {
    return { allowed: false, reason: 'Event not found' };
  }

  const status = event.eventLifecycleStatus || calculateEventStatus(event);

  // Cannot buy if event is cancelled
  if (status === 'Cancelled') {
    return { allowed: false, reason: 'This event has been cancelled.' };
  }

  // Cannot buy if event is suspended
  if (status === 'Suspended') {
    return { allowed: false, reason: 'This event is temporarily unavailable.' };
  }

  // Cannot buy if event has ended
  if (status === 'Ended') {
    return { allowed: false, reason: 'This event has ended.' };
  }

  // Cannot buy if event is still in draft
  if (status === 'Draft') {
    return { allowed: false, reason: 'This event is not yet available for purchase.' };
  }

  // Cannot buy if event is pending approval
  if (status === 'Pending Approval') {
    return { allowed: false, reason: 'This event is pending approval.' };
  }

  // Check if sales deadline has passed (independent of event start time)
  if (event.salesDeadlineDate && event.salesDeadlineTime) {
    const salesDeadline = combineDateTime(event.salesDeadlineDate, event.salesDeadlineTime);
    const now = new Date();
    
    if (now >= salesDeadline) {
      return { allowed: false, reason: 'Ticket sales have closed.' };
    }
  }

  // Check if tickets are sold out
  if (typeof event.totalTickets === 'number' && event.totalTickets <= 0) {
    return { allowed: false, reason: 'All tickets for this event are sold out.' };
  }

  return { allowed: true, reason: null };
}

/**
 * Check if check-in is allowed for an event
 * @param {Object} event - Event document
 * @returns {Object} - { allowed: boolean, reason: string }
 */
function canCheckIn(event) {
  if (!event) {
    return { allowed: false, reason: 'Event not found' };
  }

  const status = event.eventLifecycleStatus || calculateEventStatus(event);

  // Can only check in if event is LIVE
  if (status !== 'Live') {
    if (status === 'Cancelled') {
      return { allowed: false, reason: 'This event has been cancelled.' };
    } else if (status === 'Suspended') {
      return { allowed: false, reason: 'This event is temporarily unavailable.' };
    } else if (status === 'Ended') {
      return { allowed: false, reason: 'This event has ended.' };
    } else if (status === 'Upcoming') {
      return { allowed: false, reason: 'This event has not started yet.' };
    } else {
      return { allowed: false, reason: 'Check-in is not available for this event at this time.' };
    }
  }

  return { allowed: true, reason: null };
}

/**
 * Get display information about an event's status
 * @param {Object} event - Event document
 * @returns {Object} - Status info with badge, display text, color, etc.
 */
function getEventStatusInfo(event) {
  const status = event.eventLifecycleStatus || calculateEventStatus(event);

  const statusInfo = {
    Draft: {
      badge: 'Draft',
      displayText: 'Draft - Not Published',
      color: 'gray',
      showPublic: false,
      allowPurchase: false,
      allowCheckIn: false,
      allowEditing: true,
    },
    'Pending Approval': {
      badge: 'Pending',
      displayText: 'Pending Approval',
      color: 'yellow',
      showPublic: false,
      allowPurchase: false,
      allowCheckIn: false,
      allowEditing: true,
    },
    Published: {
      badge: 'Published',
      displayText: 'Published',
      color: 'blue',
      showPublic: true,
      allowPurchase: true,
      allowCheckIn: false,
      allowEditing: true,
    },
    Upcoming: {
      badge: 'Upcoming',
      displayText: 'Upcoming',
      color: 'blue',
      showPublic: true,
      allowPurchase: true,
      allowCheckIn: false,
      allowEditing: true,
    },
    Live: {
      badge: 'LIVE',
      displayText: 'Live Now',
      color: 'red',
      showPublic: true,
      allowPurchase: true,
      allowCheckIn: true,
      allowEditing: false,
    },
    Ended: {
      badge: 'Ended',
      displayText: 'Event Ended',
      color: 'gray',
      showPublic: true,
      allowPurchase: false,
      allowCheckIn: false,
      allowEditing: false,
    },
    Cancelled: {
      badge: 'Cancelled',
      displayText: 'Event Cancelled',
      color: 'red',
      showPublic: false,
      allowPurchase: false,
      allowCheckIn: false,
      allowEditing: false,
      reason: event.cancellationReason || '',
    },
    Suspended: {
      badge: 'Suspended',
      displayText: 'Event Suspended',
      color: 'red',
      showPublic: false,
      allowPurchase: false,
      allowCheckIn: false,
      allowEditing: false,
      reason: event.suspensionReason || '',
    },
  };

  return statusInfo[status] || statusInfo.Published;
}

/**
 * Transition event from one status to another
 * @param {string} eventId - Event ID
 * @param {string} newStatus - New lifecycle status
 * @param {Object} options - { reason, cancelledBy, suspendedBy, userId }
 * @returns {Promise<Object>} - Updated event
 */
async function transitionEventStatus(eventId, newStatus, options = {}) {
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  const oldStatus = event.eventLifecycleStatus;
  const now = new Date();

  // Update based on new status
  switch (newStatus) {
    case 'Published':
      event.eventLifecycleStatus = 'Published';
      event.isDraft = false;
      event.statusUpdateReason = options.reason || 'manual_publish';
      break;

    case 'Cancelled':
      if (!options.cancelledBy) {
        throw new Error('cancelledBy user ID is required');
      }
      event.eventLifecycleStatus = 'Cancelled';
      event.cancellationDate = now;
      event.cancellationReason = options.reason || '';
      event.cancelledBy = options.cancelledBy;
      event.statusUpdateReason = 'manual_cancellation';
      break;

    case 'Suspended':
      if (!options.suspendedBy) {
        throw new Error('suspendedBy user ID is required');
      }
      event.eventLifecycleStatus = 'Suspended';
      event.suspensionDate = now;
      event.suspensionReason = options.reason || '';
      event.suspendedBy = options.suspendedBy;
      event.statusUpdateReason = 'manual_suspension';
      break;

    case 'Restored':
      // Restore from Suspended state
      if (oldStatus !== 'Suspended') {
        throw new Error('Can only restore suspended events');
      }
      event.eventLifecycleStatus = calculateEventStatus({
        ...event.toObject(),
        suspensionDate: null,
        suspensionReason: '',
      });
      event.statusUpdateReason = 'manual_restore';
      // Keep original suspension dates for audit trail but they're now cleared
      break;

    case 'Live':
      event.eventLifecycleStatus = 'Live';
      event.liveStartedAt = now;
      event.statusUpdateReason = options.reason || 'auto_transition';
      break;

    case 'Ended':
      event.eventLifecycleStatus = 'Ended';
      event.endedAt = now;
      event.statusUpdateReason = options.reason || 'auto_transition';
      break;

    default:
      throw new Error(`Invalid status transition: ${newStatus}`);
  }

  event.lastStatusUpdateAt = now;
  return await event.save();
}

/**
 * Get countdown information for an event
 * @param {Object} event - Event document
 * @returns {Object} - Countdown info
 */
function getEventCountdown(event) {
  if (!event.startDate || !event.endDate) {
    return {
      toStart: null,
      toEnd: null,
      toSalesClose: null,
      status: 'unknown',
    };
  }

  const now = new Date();
  const startDateTime = combineDateTime(event.startDate, event.startTime);
  const endDateTime = combineDateTime(event.endDate, event.endTime);
  
  const toStart = startDateTime - now;
  const toEnd = endDateTime - now;

  let toSalesClose = null;
  if (event.salesDeadlineDate && event.salesDeadlineTime) {
    const salesDeadline = combineDateTime(event.salesDeadlineDate, event.salesDeadlineTime);
    toSalesClose = salesDeadline - now;
  }

  return {
    toStart: toStart > 0 ? toStart : null,
    toEnd: toEnd > 0 ? toEnd : null,
    toSalesClose: toSalesClose && toSalesClose > 0 ? toSalesClose : null,
    status: toStart > 0 ? 'upcoming' : (toEnd > 0 ? 'live' : 'ended'),
  };
}

/**
 * Get attendee count for an event (for LIVE badge display)
 * @param {string} eventId - Event ID
 * @returns {Promise<number>}
 */
async function getLiveAttendeeCount(eventId) {
  const Ticket = require('../models/Ticket');
  
  const count = await Ticket.countDocuments({
    event: eventId,
    status: 'checked-in',
  });

  return count;
}

/**
 * Check if event is sold out
 * @param {Object} event - Event document
 * @returns {boolean}
 */
function isSoldOut(event) {
  if (!event.totalTickets) return false;
  return event.ticketsSold >= event.totalTickets;
}

/**
 * Get available tickets count
 * @param {Object} event - Event document
 * @returns {number}
 */
function getAvailableTickets(event) {
  if (!event.totalTickets) return 0;
  return Math.max(0, event.totalTickets - event.ticketsSold);
}

module.exports = {
  calculateEventStatus,
  combineDateTime,
  canPurchaseTickets,
  canCheckIn,
  getEventStatusInfo,
  transitionEventStatus,
  getEventCountdown,
  getLiveAttendeeCount,
  isSoldOut,
  getAvailableTickets,
};
