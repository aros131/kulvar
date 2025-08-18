// controllers/coachController.js
import Coach from '../models/Coach.js';

export async function listCoaches(req, res) {
  try {
    const { specialization } = req.query || {};
    const where = { role: 'coach' };
    if (specialization && specialization !== 'all') where.specialization = specialization;
    const docs = await Coach.find(where)
      .select('_id name email role specialization profilePicture rating priceFrom isOnline isVerified languages')
      .collation({ locale: 'tr', strength: 1 })
      .sort({ name: 1 })
      .lean();
    res.json(docs);
  } catch (err) {
    console.error('listCoaches error:', err);
    res.status(500).json({ message: err.message });
  }
}
