const Organizer = require('../organizer/organizer.model');
const jwt = require('jsonwebtoken');

const register = async (data) => {
  const { name, email, phone, password } = data;

  if (!name || !email || !password ) {
    throw new Error('Champs obligatoires manquants');
  }

  
  const emailNormalized = email.trim().toLowerCase();
  const existingUser = await Organizer.findOne({ email: emailNormalized });
  if (existingUser) throw new Error('Email déjà utilisé');

  const organizer = new Organizer({
    name,
    email: emailNormalized,
    phone,
    password,
  });

  await organizer.save();

  const token = jwt.sign(
    { id: organizer._id, role: organizer.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    organizer: {
      id: organizer._id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
    },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email et mot de passe requis');

  const organizer = await Organizer.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!organizer) throw new Error('Email ou mot de passe incorrect');

  const isPasswordValid = await organizer.comparePassword(password);
  if (!isPasswordValid) throw new Error('Email ou mot de passe incorrect');

  const token = jwt.sign(
    { id: organizer._id, role: organizer.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    organizer: {
      id: organizer._id,
      name: organizer.name,
      email: organizer.email,
      role: organizer.role,
    },
  };
};

module.exports = { register, login };
