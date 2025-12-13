const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const organizer = await authService.register(req.body);
    res.status(201).json({
      message: 'Inscription réussie',
      organizer
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({
      message: 'Connexion réussie',
      ...data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
