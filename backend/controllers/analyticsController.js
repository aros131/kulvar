import Program from '../models/Program.js';
import User from '../models/User.js';

export const getAnalytics = async (req, res) => {
  try {
    const totalPrograms = await Program.countDocuments({ coachId: req.user.id });
    const totalClients = await User.countDocuments({ assignedCoach: req.user.id });
    res.status(200).json({ totalPrograms, totalClients });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving analytics", error: error.message });
  }
};
