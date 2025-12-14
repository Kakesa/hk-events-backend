const jwt = require('jsonwebtoken');
const Organizer = require('../modules/users/users.model');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifie l'en-tête Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Non autorisé, token manquant' });
    }

    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupère l'utilisateur depuis le token
    const organizer = await Organizer.findById(decoded.id);
    if (!organizer) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Ajoute les infos utilisateur à la requête
    req.user = {
      id: organizer._id,
      role: organizer.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
