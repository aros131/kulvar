const roleMiddleware = (allowedRoles) => (req, res, next) => {
  console.log('User Role:', req.user?.role); // Add logging for debugging
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
  }
  next();
};

module.exports = roleMiddleware;
