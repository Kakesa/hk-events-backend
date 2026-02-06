const User = require('../users/users.model');
const jwt = require('jsonwebtoken');

/* =====================================================
   HELPERS
===================================================== */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non défini');
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

/* =====================================================
   REGISTER
===================================================== */
const register = async (data) => {
  const {
    name,
    email,
    phone,
    password,
    role = 'user',
    permissions,
  } = data;

  // 🔒 Sécurité : validation minimale (en plus d’express-validator)
  if (!name || !email || !password) {
    throw new Error('Champs obligatoires manquants');
  }

  const emailNormalized = normalizeEmail(email);

  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) {
    throw new Error('Email déjà utilisé');
  }

  // 🔐 Sécurité : on force les rôles autorisés
  const safeRole = role === 'admin' ? 'admin' : 'user';

  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password, // hash géré par le model (pre save)
    role: safeRole,
    permissions: Array.isArray(permissions) ? permissions : [],
  });

  await user.save();

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  };
};

/* =====================================================
   LOGIN
===================================================== */
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email et mot de passe requis');
  }

  const emailNormalized = normalizeEmail(email);

  const user = await User.findOne({ email: emailNormalized })
    .select('+password');

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  };
};

/* =====================================================
   GET ALL USERS (ADMIN)
===================================================== */
const getAllUsers = async (page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find()
      .select('-password')
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

/* =====================================================
   UPDATE PERMISSIONS
===================================================== */
const updatePermissions = async (userId, permissions) => {
  if (!Array.isArray(permissions)) {
    throw new Error('Permissions invalides');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { permissions },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  return user;
};

/* =====================================================
   UPDATE USER (GENERAL)
===================================================== */
const updateUser = async (userId, updateData) => {
  // 🔒 Sécurité : ne pas permettre de changer le mot de passe ici
  delete updateData.password;
  
  if (updateData.email) {
    updateData.email = normalizeEmail(updateData.email);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  return user;
};

/* =====================================================
   IMPERSONATE (SUPERADMIN ONLY)
===================================================== */
const impersonate = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 🔒 On ne peut pas usurper un autre superadmin
  if (user.role === 'superadmin') {
    throw new Error('Action non autorisée');
  }

  // Générer un token spécial qui contient l'info d'usurpation
  const token = jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      isImpersonated: true 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Token d'usurpation court
  );

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionType: user.subscriptionType,
    },
  };
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 🚨 Empêcher suppression du dernier admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error(
        'Impossible de supprimer le dernier administrateur'
      );
    }
  }

  await user.deleteOne();
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  login,
  getAllUsers,
  updatePermissions,
  updateUser,
  impersonate,
  deleteUser,
};
