const authRoutes = require('./modules/auth/auth.routes');
const eventRoutes = require('./modules/event/event.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
};
