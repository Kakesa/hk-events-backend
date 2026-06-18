const authService = require('./auth.service');
const User = require('../users/users.model');
const { createAudit } = require('../audit/audit.service');
const { getSubscriptionLimitsStatus } = require('../../utils/subscriptionLimits');

/* =====================================================
   REGISTER
===================================================== */
const register = async (req, res, next) => {
  try {
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
    // DEBUG utile (à supprimer en prod)
    // console.log('LOGIN BODY:', req.body);

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
   ME (CURRENT USER)
===================================================== */
const me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

const getSubscriptionLimits = async (req, res, next) => {
  try {
    const eventId = req.query.eventId || null;
    const data = await getSubscriptionLimitsStatus(req.user, eventId);
    res.status(200).json({ success: true, data });
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
   GET ALL ADMINS (SUPERADMIN ONLY)
===================================================== */
const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ 
      role: { $in: ['admin', 'superadmin'] } 
    }).select('-password');

    res.status(200).json({
      success: true,
      data: admins,
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

    if (!before) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

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
   UPDATE USER (SUPERADMIN)
===================================================== */
const updateUser = async (req, res, next) => {
  try {
    const before = await User.findById(req.params.id).lean();

    if (!before) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    const user = await authService.updateUser(req.params.id, req.body);

    await createAudit({
      req,
      action: 'UPDATE_USER',
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
   IMPERSONATE (SUPERADMIN ONLY)
===================================================== */
const impersonate = async (req, res, next) => {
  try {
    const result = await authService.impersonate(req.params.id);

    await createAudit({
      req,
      action: 'IMPERSONATION_STARTED',
      target: { type: 'User', id: req.params.id },
      details: {
        reason: req.body.reason || 'No reason provided',
      },
    });

    res.status(200).json({
      success: true,
      data: result,
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
        message: 'Vous ne pouvez pas vous supprimer vous-même',
      });
    }

    const before = await User.findById(req.params.id).lean();

    if (!before) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

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
      message: 'Utilisateur supprimé avec succès',
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
  me,
  getSubscriptionLimits,
  getAllUsers,
  getAdmins,
  updatePermissions,
  updateUser,
  impersonate,
  deleteUser,
};
