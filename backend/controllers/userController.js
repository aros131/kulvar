import User from '../models/User.js';

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
