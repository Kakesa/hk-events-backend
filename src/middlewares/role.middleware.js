const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Sécurité
    if (!req.user) {
      return res.status(401).json({
        message: 'Non authentifié',
      });
    }

    // 🔥 SUPERADMIN: Accès total sans restriction
    if (req.user.role === 'superadmin') {
      return next();
    }

    // 🔥 ADMIN: Pas de restriction
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérification rôle classique
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès refusé (droits insuffisants)',
      });
    }

    next();
  };
};

module.exports = { restrictTo };
