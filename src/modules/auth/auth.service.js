const User = require('../users/users.model');
const jwt = require('jsonwebtoken');

const register = async (data) => {
  const { name, email, phone, password } = data;

  if (!name || !email || !password ) {
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
  });

  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    tuser: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email et mot de passe requis');

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
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
    },
  };
};

module.exports = { register, login };
