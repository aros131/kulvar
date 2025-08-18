// controllers/coachController.js
import User from '../models/User.js';

export async function listCoaches(req, res) {
  try {
    const { specialization } = req.query || {};
    const where = { role: 'coach' };

    // case-insensitive exact match if provided
    if (specialization && specialization !== 'all') {
      where.specialization = new RegExp(`^${specialization}$`, 'i');
    }

    const coaches = await User.find(where)
      .select('_id name email role specialization profilePicture') // EXCLUDE password
      .collation({ locale: 'tr', strength: 1 })
      .sort({ name: 1 })
      .lean();

    return res.json(coaches); // plain array for your frontend
  } catch (err) {
    console.error('listCoaches error:', err);
    return res.status(500).json({ message: 'Server error listing coaches.' });
  }
}

export async function getCoach(req, res) {
  try {
    const { id } = req.params;
    const coach = await User.findOne({ _id: id, role: 'coach' })
      .select('_id name email role specialization profilePicture')
      .lean();

    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    return res.json(coach);
  } catch (err) {
    console.error('getCoach error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
