const authService = require('./auth.service');

// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { token, user } = await authService.login(req.body);

    res.status(200).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= GET ALL USERS =================
const getAllUsers = async (req, res, next) => {
  try {
    const users = await authService.getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE PERMISSIONS =================
const updatePermissions = async (req, res, next) => {
  try {
    const user = await authService.updatePermissions(
      req.params.id,
      req.body.permissions
    );

    await logAction({
      actor: req.user._id,
      action: 'UPDATE_PERMISSIONS',
      targetUser: user._id,
      details: { permissions: req.body.permissions },
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ================= DELETE USER =================
const deleteUser = async (req, res, next) => {
  try {
    await authService.deleteUser(req.params.id);

    await logAction({
      actor: req.user._id,
      action: 'DELETE_USER',
      targetUser: req.params.id,
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Utilisateur supprimé' });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  register,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
