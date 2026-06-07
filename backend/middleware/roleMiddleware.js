// Role-based access control middleware factory
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route is restricted to: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
