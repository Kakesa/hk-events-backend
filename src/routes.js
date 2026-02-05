const authRoutes = require('./modules/auth/auth.routes');
const eventRoutes = require('./modules/event/event.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const guestRoutes = require('./modules/guest/guest.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const invitationRoutes = require('./modules/invitation/invitation.routes');
const rsvpRoutes = require('./modules/rsvp/rsvp.routes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/guests', guestRoutes); 
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/public', rsvpRoutes);
};
