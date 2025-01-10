const jwt = require('jsonwebtoken');

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};

// Role-Based Access Middleware
const verifyRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Access Forbidden: Insufficient Role' });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
