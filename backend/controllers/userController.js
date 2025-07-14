exports.searchClients = async (req, res) => {
  const query = req.query.q;
  try {
    const users = await User.find({
      role: "user",
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("_id name email");

    res.status(200).json({ clients: users });
  } catch (err) {
    res.status(500).json({ message: "Client search failed", error: err.message });
  }
};
