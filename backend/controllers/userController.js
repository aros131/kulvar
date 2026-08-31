import User from '../models/User.js';
import Program from '../models/Program.js';
import Progress from '../models/Progress.js';

export const getClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    const user = await User.findOne({ _id: clientId, role: "user" }).select("_id name email profilePicture createdAt").lean();
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    const programs = await Program.find({
      coachId: req.user._id,
      assignedClients: clientId,
    }).select("_id name duration difficulty fitnessGoal").lean();

    const programsWithProgress = await Promise.all(
      programs.map(async (p) => {
        const progress = await Progress.findOne({ programId: p._id, userId: clientId }).lean();
        return {
          _id: p._id,
          name: p.name,
          duration: p.duration,
          difficulty: p.difficulty,
          fitnessGoal: p.fitnessGoal,
          progressPercentage: progress?.progressPercentage ?? 0,
          completedSessions: Array.isArray(progress?.completedSessions) ? progress.completedSessions.length : 0,
        };
      })
    );

    res.json({ user, programs: programsWithProgress });
  } catch (err) {
    res.status(500).json({ message: "Sunucu hatası", error: err.message });
  }
};

export const searchClients = async (req, res) => {
  const query = req.query.q?.trim();
  try {
    const filter = { role: "user" };
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }
    const users = await User.find(filter).select("_id name email").limit(100);
    res.status(200).json({ clients: users });
  } catch (err) {
    res.status(500).json({ message: "Client search failed", error: err.message });
  }
};
