const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const organizer = await authService.register(req.body);
    res.status(201).json({ message: 'Inscription réussie', organizer });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ message: 'Connexion réussie', ...data });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
