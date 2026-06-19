const User = require('../users/users.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { getPermissionsForRole } = require('../../constants/permissions');
const { sendEmail } = require('../../services/email.service');

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

const serializeUser = (user) => {
  const isPremiumAccess =
    user.subscriptionType === 'premium' || user.subscriptionType === 'enterprise';

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: isPremiumAccess
      ? getPermissionsForRole('admin')
      : user.permissions,
    subscriptionType: user.subscriptionType,
    planLimitsBypass: user.planLimitsBypass === true,
    guestPriceFc: user.guestPriceFc ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

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
    user: serializeUser(user),
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

  if (!user.password) {
    throw new Error('Ce compte utilise la connexion Google. Connectez-vous avec Google.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = generateToken(user);

  return {
    token,
    user: serializeUser(user),
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
const ASSIGNABLE_ROLES = ['user', 'admin', 'organizer'];

const updateUser = async (userId, updateData) => {
  delete updateData.password;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  if (user.role === 'superadmin') {
    delete updateData.role;
  }

  if (updateData.role !== undefined) {
    if (updateData.role === 'superadmin') {
      throw new Error('Impossible de promouvoir en superadmin via cette action');
    }

    if (!ASSIGNABLE_ROLES.includes(updateData.role)) {
      throw new Error('Rôle invalide');
    }

    if (updateData.role !== user.role && !updateData.permissions) {
      updateData.permissions = getPermissionsForRole(updateData.role);
    }
  }

  if (updateData.email) {
    updateData.email = normalizeEmail(updateData.email);
  }

  const allowedFields = [
    'name',
    'email',
    'phone',
    'subscriptionType',
    'planLimitsBypass',
    'guestPriceFc',
    'isActive',
    'role',
    'permissions',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.password;

  return updatedUser;
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
    user: serializeUser(user),
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
   FORGOT PASSWORD
===================================================== */
const forgotPassword = async (email) => {
  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized });

  if (!user) {
    return { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' };
  }

  if (user.authProvider === 'google' && !user.password) {
    return { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #4a5a44;">
      <h2 style="color: #b8956c;">Réinitialisation du mot de passe</h2>
      <p>Bonjour ${user.name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe HK Event.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: #b8956c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Choisir un nouveau mot de passe
        </a>
      </p>
      <p style="font-size: 13px; color: #7a8b72;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  `;

  try {
    await sendEmail(user.email, 'Réinitialisation de votre mot de passe — HK Event', html, {
      recipientName: user.name,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error("Impossible d'envoyer l'email de réinitialisation. Réessayez plus tard.");
  }

  return { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' };
};

/* =====================================================
   RESET PASSWORD
===================================================== */
const resetPassword = async (token, password) => {
  if (!token || !password || password.length < 6) {
    throw new Error('Données invalides');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new Error('Lien invalide ou expiré');
  }

  user.password = password;
  user.authProvider = 'local';
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const authToken = generateToken(user);
  return {
    token: authToken,
    user: serializeUser(user),
  };
};

/* =====================================================
   GOOGLE AUTH
===================================================== */
const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Connexion Google non configurée');
  }
  return new OAuth2Client(clientId);
};

const googleAuth = async (credential) => {
  if (!credential) {
    throw new Error('Token Google manquant');
  }

  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error('Email Google introuvable');
  }

  const emailNormalized = normalizeEmail(payload.email);
  const googleId = payload.sub;
  const name = payload.name || payload.given_name || emailNormalized.split('@')[0];

  let user = await User.findOne({
    $or: [{ googleId }, { email: emailNormalized }],
  }).select('+password');

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = user.password ? user.authProvider : 'google';
      await user.save();
    }
  } else {
    user = new User({
      name,
      email: emailNormalized,
      googleId,
      authProvider: 'google',
      role: 'user',
      permissions: [],
    });
    await user.save();
  }

  const token = generateToken(user);
  return {
    token,
    user: serializeUser(user),
  };
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleAuth,
  getAllUsers,
  updatePermissions,
  updateUser,
  impersonate,
  deleteUser,
};
