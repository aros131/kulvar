const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Add user info to request object
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token', error });
  }
};

module.exports = authMiddleware;
