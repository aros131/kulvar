exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      res.json({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  