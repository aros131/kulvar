const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in the database
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user; // Attach user to request object
      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.error("No token provided");
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

module.exports = protect;
