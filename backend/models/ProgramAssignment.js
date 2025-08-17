// backend/models/ProgramAssignment.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * ProgramAssignment
 * - Records when a user starts a program (per-user start)
 * - Stores timezone and default time-of-day used to place sessions on the calendar
 * - Useful for regenerating, pausing, or auditing a specific "run"
 *
 * NOTE: This does not enforce uniqueness per user+program; a user may restart
 * the same program later (create a new assignment). Use the most recent "active"
 * assignment in your app logic if needed.
 */
const ProgramAssignmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },

    /** The local date from which Day 1 is scheduled. */
    startDate: { type: Date, required: true },

    /** IANA timezone, e.g. "Europe/Istanbul" */
    timezone: { type: String, default: 'Europe/Istanbul' },

    /** Default "HH:mm" when a session has no explicit timeOfDay */
    defaultTimeOfDay: {
      type: String,
      default: '18:00',
      validate: {
        validator: (v) => !v || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v),
        message: 'defaultTimeOfDay must be in "HH:mm" format',
      },
    },

    /** Lifecycle for this run */
    status: {
      type: String,
      enum: ['active', 'paused', 'canceled', 'completed'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

/** Helpful indexes */
ProgramAssignmentSchema.index({ userId: 1, programId: 1, createdAt: -1 });
ProgramAssignmentSchema.index({ userId: 1, programId: 1, status: 1 });

/** Optional: simple virtual id getter for cleaner JSON (if you like) */
ProgramAssignmentSchema.virtual('id').get(function () {
  return this._id?.toString();
});
ProgramAssignmentSchema.set('toJSON', { virtuals: true });
ProgramAssignmentSchema.set('toObject', { virtuals: true });

const ProgramAssignment = mongoose.model('ProgramAssignment', ProgramAssignmentSchema);
export default ProgramAssignment;
export { ProgramAssignmentSchema };
