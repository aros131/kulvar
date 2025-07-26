import User from '../models/User.js';

export const getCoaches = async (req, res) => {
  const specialization = req.query.specialization;

  try {
    const query = { role: "coach" };

    if (specialization && specialization !== "all") {
      query.specialization = { $regex: `^${specialization}$`, $options: "i" };
    }

    console.log("Coach Query:", query);

    const coaches = await User.find(query);
    res.json(coaches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
