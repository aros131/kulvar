const jwt = require('jsonwebtoken'); // Import the JSON Web Token library

// Middleware to authenticate requests
const authMiddleware = (req, res, next) => {
  // Extract the Bearer token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  // If no token is provided, return an unauthorized error
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // If token verification fails, return a forbidden error
    return res.status(403).json({ message: 'Invalid token', error });
  }
};

module.exports = authMiddleware; // Export the middleware for use in routes
