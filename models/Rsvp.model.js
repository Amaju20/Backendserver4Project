import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Sessions are static frontend data (src/data/sessions.js), not a
    // backend collection, so this is just the session's string id
    // (e.g. "sess-01") rather than a Mongoose ref.
    sessionId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// One RSVP per user per session — also lets us upsert-toggle safely
// without a race between "check if it exists" and "create it".
rsvpSchema.index({ user: 1, sessionId: 1 }, { unique: true });

const Rsvp = mongoose.model('Rsvp', rsvpSchema);

export default Rsvp;
