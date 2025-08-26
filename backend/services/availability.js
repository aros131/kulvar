// ESM module
// Return per-coach availability config. Fill from DB later if needed.
export async function getCoachAvailabilityConfig(coachId) {
  // sensible defaults so bookings don’t fail
  return {
    leadTimeMin: 120, // require booking at least 2h in advance
    bufferMin: 0,     // not used yet; reserved for padding
  };
}
