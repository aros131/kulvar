// controllers/coachController.js
import Coach from '../models/Coach.js';

export async function listCoaches(req, res) {
  try {
    const { specialization } = req.query;

    const where = { role: 'coach' };
    if (specialization && specialization !== 'all') {
      where.specialization = specialization;
    }

    const docs = await Coach.find(where)
      .select('_id name email role specialization profilePicture rating priceFrom isOnline isVerified languages')
      .collation({ locale: 'tr', strength: 1 }) // proper A–Z in Turkish
      .sort({ name: 1 })
      .lean();

    // IMPORTANT: return a plain array (frontend maps Array.isArray(data) ? data : [])
    return res.json(docs);
  } catch (err) {
    console.error('listCoaches error:', err);
    return res.status(500).json({ message: 'Server error listing coaches.' });
  }
}
