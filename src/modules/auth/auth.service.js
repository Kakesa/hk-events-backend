const Organizer = require('../organizer/organizer.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (data) => {
  const { fullName, email, password } = data;

  const existingUser = await Organizer.findOne({ email });
  if (existingUser) throw new Error('Email déjà utilisé');

  const organizer = new Organizer({ fullName, email, password });
  await organizer.save();

  return { id: organizer._id, fullName: organizer.fullName, email: organizer.email, role: organizer.role };
};

const login = async ({ email, password }) => {
  const organizer = await Organizer.findOne({ email }).select('+password');
  if (!organizer) throw new Error('Email ou mot de passe incorrect');

  const isPasswordValid = await bcrypt.compare(password, organizer.password);
  if (!isPasswordValid) throw new Error('Email ou mot de passe incorrect');

  const token = jwt.sign({ id: organizer._id, role: organizer.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return { token, organizer: { id: organizer._id, fullName: organizer.fullName, email: organizer.email, role: organizer.role } };
};

module.exports = { register, login };
