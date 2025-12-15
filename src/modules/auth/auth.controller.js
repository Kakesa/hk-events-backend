const authService = require('./auth.service');
const User = require('../users/users.model');
const { createAudit } = require('../audit/audit.service');

/* =====================================================
   REGISTER
===================================================== */
const register = async (req, res, next) => {
  try {
    // Le service retourne { token, user }
    const { token, user } = await authService.register(req.body);

    res.status(201).json({
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

/* =====================================================
   LOGIN
===================================================== */
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

/* =====================================================
   GET ALL USERS (ADMIN)
===================================================== */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // Tout est géré par le service
    const result = await authService.getAllUsers(page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE PERMISSIONS
===================================================== */
const updatePermissions = async (req, res, next) => {
  try {
    const before = await User.findById(req.params.id).lean();

    const user = await authService.updatePermissions(
      req.params.id,
      req.body.permissions
    );

    await createAudit({
      req,
      action: 'UPDATE_PERMISSIONS',
      target: { type: 'User', id: user._id },
      before,
      after: user,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (req, res, next) => {
  try {
    // 🚫 Empêcher un admin de se supprimer lui-même
    if (req.user && req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas vous supprimer',
      });
    }

    const before = await User.findById(req.params.id).lean();

    await authService.deleteUser(req.params.id);

    await createAudit({
      req,
      action: 'DELETE_USER',
      target: { type: 'User', id: req.params.id },
      before,
      after: null,
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé',
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
