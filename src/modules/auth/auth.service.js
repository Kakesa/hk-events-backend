const User = require('../users/users.model');
const jwt = require('jsonwebtoken');

// ================= REGISTER =================
const register = async (data) => {
  const { name, email, phone, password, role = 'user', permissions } = data;

  if (!name || !email || !password) {
    throw new Error('Champs obligatoires manquants');
  }

  const emailNormalized = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) throw new Error('Email déjà utilisé');

  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password,
    role,
    permissions,
  });

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
};

// ================= LOGIN =================
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email et mot de passe requis');
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select('+password');

  if (!user) throw new Error('Email ou mot de passe incorrect');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new Error('Email ou mot de passe incorrect');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  };
};

// ================= GET ALL USERS =================
const getAllUsers = async () => {
  return User.find().select('-password');
};

// ================= UPDATE PERMISSIONS =================
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

// ================= DELETE USER =================
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 🚨 Empêcher suppression du dernier admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error('Impossible de supprimer le dernier administrateur');
    }
  }

  await user.deleteOne();
};


module.exports = {
  register,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
