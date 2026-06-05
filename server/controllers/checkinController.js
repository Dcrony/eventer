const CheckinLog = require('../models/CheckinLog');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authorizeEventAction, getEventAccessForUser, canCheckIn } = require('../utils/eventPermissions');

/**
 * Record a single scan/check-in for an event.
 * POST /tickets/event/:eventId/scan
 * body: { ticketId, type?, name?, meta? }
 */
exports.recordScan = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ticketId, type = 'checked-in', name, meta = {} } = req.body;

    if (!eventId) return res.status(400).json({ message: 'Invalid event ID' });

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: 'canCheckIn',
      deniedMessage: 'You do not have permission to record scans for this event',
    });

    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let ticket = null;
    if (ticketId) {
      ticket = await Ticket.findById(ticketId).populate('buyer', 'name email');
      if (!ticket) {
        // still create a failed log for auditing
        const log = new CheckinLog({
          event: eventId,
          staff: req.user.id,
          type: 'failed',
          name: name || null,
          ticketType: null,
          meta: { ...meta, reason: 'ticket not found', providedTicketId: ticketId },
        });
        await log.save();
        const io = req.app.get('io');
        if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }

      // ensure ticket belongs to event
      if (String(ticket.event) !== String(eventId)) {
        const log = new CheckinLog({
          event: eventId,
          ticket: ticket._id,
          staff: req.user.id,
          type: 'failed',
          name: ticket.buyer?.name || name || null,
          ticketType: ticket.ticketType || null,
          meta: { ...meta, reason: 'ticket-event-mismatch' },
        });
        await log.save();
        const io = req.app.get('io');
        if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
        return res.status(400).json({ success: false, message: 'Ticket does not belong to this event' });
      }

      // already used -> duplicate
      if (ticket.used || ticket.status === 'checked-in') {
        const log = new CheckinLog({
          event: eventId,
          ticket: ticket._id,
          staff: req.user.id,
          type: 'duplicate',
          name: ticket.buyer?.name || name || null,
          ticketType: ticket.ticketType || null,
          meta: { ...meta, note: 'already-checked-in' },
        });
        await log.save();
        const io = req.app.get('io');
        if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
        return res.json({ success: false, message: 'Ticket already used' });
      }

      // mark used
      ticket.used = true;
      ticket.status = 'checked-in';
      ticket.usedAt = new Date();
      await ticket.save();

      const log = new CheckinLog({
        event: eventId,
        ticket: ticket._id,
        staff: req.user.id,
        type: type === 'manual' ? 'manual' : 'checked-in',
        name: ticket.buyer?.name || name || null,
        ticketType: ticket.ticketType || null,
        meta: { ...meta },
      });
      await log.save();

      const io = req.app.get('io');
      if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());

      return res.json({ success: true, message: 'Ticket checked in', ticket: { id: ticket._id } });
    }

    // No ticketId provided — create a failed log
    const log = new CheckinLog({
      event: eventId,
      staff: req.user.id,
      type: 'failed',
      name: name || null,
      ticketType: null,
      meta: { ...meta, reason: 'no_ticket_provided' },
    });
    await log.save();
    const io = req.app.get('io');
    if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
    return res.status(400).json({ success: false, message: 'No ticket provided' });
  } catch (err) {
    console.error('recordScan error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Bulk sync offline check-ins
 * POST /tickets/event/:eventId/sync
 * body: { checks: [ { ticketId, clientId?, type?, name?, meta? } ] }
 */
exports.syncCheckins = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { checks } = req.body;

    if (!eventId) return res.status(400).json({ message: 'Invalid event ID' });
    if (!Array.isArray(checks)) return res.status(400).json({ message: 'checks array required' });

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: 'canCheckIn',
      deniedMessage: 'You do not have permission to sync check-ins for this event',
    });

    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const results = [];
    for (const item of checks.slice(0, 500)) {
      try {
        const { ticketId, clientId, type = 'checked-in', name, meta = {} } = item;
        if (!ticketId) {
          const log = new CheckinLog({
            event: eventId,
            staff: req.user.id,
            type: 'failed',
            name: name || null,
            meta: { ...meta, reason: 'no_ticket_provided', clientId },
          });
          await log.save();
          const io = req.app.get('io');
          if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
          results.push({ ticketId: null, success: false, reason: 'no_ticket_provided' });
          continue;
        }

        const ticket = await Ticket.findById(ticketId).populate('buyer', 'name email');
        if (!ticket) {
          const log = new CheckinLog({
            event: eventId,
            staff: req.user.id,
            type: 'failed',
            name: name || null,
            meta: { ...meta, reason: 'ticket_not_found', clientId, providedTicketId: ticketId },
          });
          await log.save();
          const io = req.app.get('io');
          if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
          results.push({ ticketId, success: false, reason: 'ticket_not_found' });
          continue;
        }

        if (String(ticket.event) !== String(eventId)) {
          const log = new CheckinLog({
            event: eventId,
            ticket: ticket._id,
            staff: req.user.id,
            type: 'failed',
            name: ticket.buyer?.name || name || null,
            ticketType: ticket.ticketType || null,
            meta: { ...meta, reason: 'ticket-event-mismatch', clientId },
          });
          await log.save();
          const io = req.app.get('io');
          if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
          results.push({ ticketId, success: false, reason: 'ticket-event-mismatch' });
          continue;
        }

        if (ticket.used || ticket.status === 'checked-in') {
          const log = new CheckinLog({
            event: eventId,
            ticket: ticket._id,
            staff: req.user.id,
            type: 'duplicate',
            name: ticket.buyer?.name || name || null,
            ticketType: ticket.ticketType || null,
            meta: { ...meta, clientId },
          });
          await log.save();
          const io = req.app.get('io');
          if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
          results.push({ ticketId, success: false, reason: 'already_checked_in' });
          continue;
        }

        ticket.used = true;
        ticket.status = 'checked-in';
        ticket.usedAt = new Date();
        await ticket.save();

        const log = new CheckinLog({
          event: eventId,
          ticket: ticket._id,
          staff: req.user.id,
          type: type === 'manual' ? 'manual' : 'checked-in',
          name: ticket.buyer?.name || name || null,
          ticketType: ticket.ticketType || null,
          meta: { ...meta, clientId },
        });
        await log.save();
        const io = req.app.get('io');
        if (io) io.to(String(eventId)).emit('scan_activity', log.toJSON());
        results.push({ ticketId, success: true });
      } catch (err) {
        console.error('sync item error:', err);
        results.push({ ticketId: item.ticketId || null, success: false, reason: 'server_error' });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error('syncCheckins error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Fetch recent scan activity for an event
 * GET /tickets/event/:eventId/scan-activity
 */
exports.getActivity = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 50));

    if (!eventId) return res.status(400).json({ message: 'Invalid event ID' });

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: 'canCheckIn',
      deniedMessage: 'You do not have permission to view scan activity for this event',
    });

    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const query = { event: eventId };
    const total = await CheckinLog.countDocuments(query);
    const items = await CheckinLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('staff', 'name username')
      .populate('ticket', 'ticketType buyer');

    res.json({ success: true, page, limit, total, items });
  } catch (err) {
    console.error('getActivity error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
