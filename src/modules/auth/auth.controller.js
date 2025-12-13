const authService = require('./auth.service');

// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    console.log("📩 Données reçues :", req.body);

    const organizer = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: organizer,
    });
  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { token, organizer } = await authService.login(req.body);

    res.status(200).json({
      success: true,
      data: {
        token,
        organizer,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
