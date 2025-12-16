const checkPermission = (module, action) => {
  return (req, res, next) => {

    // 🔥 ADMIN = accès total
    if (req.user.role === 'admin') {
      return next();
    }

    const permission = req.user.permissions?.find(
      (p) => p.module === module
    );

    if (!permission || permission[action] !== true) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé (droits insuffisants)',
      });
    }

    next();
  };
};

module.exports = { checkPermission };
