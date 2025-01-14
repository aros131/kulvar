const jwt = require('jsonwebtoken'); // Import JSON Web Token library

// Middleware to authenticate requests
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided in the request');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log('Received Token:', token);
    console.log('Decoded Token:', decoded);

    next();
  } catch (err) {
    console.error('Error verifying token:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: err.message });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token', error: err.message });
    }

    return res.status(500).json({ message: 'Token validation failed', error: err.message });
  }
};

module.exports = authMiddleware;

