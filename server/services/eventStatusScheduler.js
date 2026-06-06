/**
 * Event Status Scheduler Service
 * Automatically transitions events based on timing
 * - Upcoming → Live when startTime is reached
 * - Live → Ended when endTime is reached
 */

const Event = require('../models/Event');
const { transitionEventStatus } = require('../utils/eventLifecycle');

/**
 * Process automatic event status transitions
 * Should be called periodically (e.g., every minute via cron or interval)
 */
async function processEventTransitions() {
  try {
    const now = new Date();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. Transition Upcoming → Live
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Find events that should go live now
    const upcomingEvents = await Event.find({
      eventLifecycleStatus: 'Upcoming',
      isDraft: false,
      startDate: { $exists: true, $lte: now },
    }).exec();

    for (const event of upcomingEvents) {
      // Verify event hasn't passed end time
      const endTime = combineDateTime(event.endDate, event.endTime);
      if (now < endTime) {
        try {
          await transitionEventStatus(String(event._id), 'Live', {
            reason: 'auto_transition',
          });
          console.log(`✅ Event ${event._id} transitioned to LIVE`);
        } catch (error) {
          console.error(`❌ Failed to transition event ${event._id} to LIVE:`, error.message);
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. Transition Live → Ended
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Find events that should end now
    const liveEvents = await Event.find({
      eventLifecycleStatus: 'Live',
      isDraft: false,
      endDate: { $exists: true, $lte: now },
    }).exec();

    for (const event of liveEvents) {
      try {
        await transitionEventStatus(String(event._id), 'Ended', {
          reason: 'auto_transition',
        });
        console.log(`✅ Event ${event._id} transitioned to ENDED`);
      } catch (error) {
        console.error(`❌ Failed to transition event ${event._id} to ENDED:`, error.message);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. Handle Published → Upcoming transition
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Find published events that now have a start date in the future
    const publishedEvents = await Event.find({
      eventLifecycleStatus: 'Published',
      isDraft: false,
      startDate: { $exists: true, $gt: now },
    }).exec();

    // Note: These should ideally be transitioned to "Upcoming" for better UX
    // But we leave them as "Published" for now - consider implementing if desired

    console.log(`✅ Event status scheduler completed - Processed ${upcomingEvents.length} upcoming + ${liveEvents.length} live events`);
  } catch (error) {
    console.error('❌ Event status scheduler error:', error.message);
  }
}

/**
 * Combine date and time into a single Date object
 * @param {Date|string} date
 * @param {string} time - HH:mm format
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
 * Start the event status scheduler
 * @param {number} intervalMs - Interval in milliseconds (default: 60000 = 1 minute)
 * @returns {NodeJS.Timeout} - Interval ID for later clearing if needed
 */
function startEventStatusScheduler(intervalMs = 60000) {
  console.log(`🚀 Starting Event Status Scheduler (interval: ${intervalMs}ms)`);

  // Run immediately on start
  processEventTransitions();

  // Then run at specified interval
  const intervalId = setInterval(processEventTransitions, intervalMs);

  return intervalId;
}

/**
 * Stop the event status scheduler
 * @param {NodeJS.Timeout} intervalId
 */
function stopEventStatusScheduler(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Event Status Scheduler stopped');
  }
}

module.exports = {
  processEventTransitions,
  startEventStatusScheduler,
  stopEventStatusScheduler,
};
