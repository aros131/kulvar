import { computeCoachAnalytics } from '../services/coachAnalytics.js';

export const getAnalytics = async (req, res) => {
  try {
    const data = await computeCoachAnalytics(req.user._id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};
