const User = require('../users/users.model');
const jwt = require('jsonwebtoken');

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

  if (!name || !email || !password) {
    throw new Error('Champs obligatoires manquants');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non défini');
  }

  const emailNormalized = email.trim().toLowerCase();

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
    password, // hash via le model
    role: safeRole,
    permissions: permissions || [],
  });

  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

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

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non défini');
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select('+password');

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

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
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* =====================================================
   UPDATE PERMISSIONS
===================================================== */
const updatePermissions = async (userId, permissions) => {
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
  deleteUser,
};
