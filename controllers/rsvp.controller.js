import Rsvp from '../models/Rsvp.model.js';

// GET /api/rsvps — every session id the logged-in user has RSVP'd to.
export const listMyRsvps = async (req, res, next) => {
  try {
    const rsvps = await Rsvp.find({ user: req.user._id }).select('sessionId -_id');
    res.status(200).json({ sessionIds: rsvps.map((r) => r.sessionId) });
  } catch (error) {
    next(error);
  }
};

// POST /api/rsvps/:sessionId — toggle: creates the RSVP if it doesn't
// exist, removes it if it does. Returns the resulting attending state
// plus the full up-to-date list, so the frontend can't drift out of sync.
export const toggleRsvp = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const existing = await Rsvp.findOne({ user: req.user._id, sessionId });

    if (existing) {
      await existing.deleteOne();
    } else {
      try {
        await Rsvp.create({ user: req.user._id, sessionId });
      } catch (error) {
        // A duplicate-key error here means two toggle requests raced each
        // other (e.g. a double click) — treat it as "already RSVP'd"
        // rather than surfacing a 500.
        if (error.code !== 11000) throw error;
      }
    }

    const rsvps = await Rsvp.find({ user: req.user._id }).select('sessionId -_id');
    res.status(200).json({
      attending: !existing,
      sessionIds: rsvps.map((r) => r.sessionId),
    });
  } catch (error) {
    next(error);
  }
};
