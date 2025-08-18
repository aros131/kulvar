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

    return res.json(docs); // ← plain array
  } catch (err) {
    console.error('listCoaches error:', err);
    return res.status(500).json({ message: 'Server error listing coaches.' });
  }
}

export async function getCoach(req, res) {
  try {
    const id = req.params.id;
    const doc = await Coach.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err) {
    console.error('getCoach error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
