import User from '../models/User.js';
import Program from '../models/Program.js';

export const getClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    const user = await User.findOne({ _id: clientId, role: "user" }).select("_id name email profilePicture createdAt").lean();
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    // Find coach's programs where this client is assigned
    const programs = await Program.find({
      coachId: req.user._id,
      assignedClients: clientId,
    }).select("_id name duration difficulty fitnessGoal progressTracking").lean();

    const programsWithProgress = programs.map((p) => {
      const track = (p.progressTracking || []).find(
        (t) => t.user?.toString() === clientId
      );
      return {
        _id: p._id,
        name: p.name,
        duration: p.duration,
        difficulty: p.difficulty,
        fitnessGoal: p.fitnessGoal,
        progressPercentage: track?.progressPercentage ?? 0,
        completedSessions: track?.completedSessions ?? 0,
      };
    });

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
