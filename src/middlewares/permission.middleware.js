const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();

    const allowed =
      req.user.permissions?.[module]?.[action];

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Permission refusée',
      });
    }

    next();
  };
};

module.exports = { checkPermission };
