const authRoutes = require('./modules/auth/auth.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
};
