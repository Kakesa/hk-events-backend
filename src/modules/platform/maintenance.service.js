const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');
const Invitation = require('../invitation/invitation.model');
const Analytics = require('../analytics/analytics.model');
const EmailLog = require('../email/email.model');
const WhatsAppLog = require('../whatsapp-log/whatsapp-log.model');
const User = require('../users/users.model');
const Payment = require('../payment/payment.model');
const AuditLog = require('../audit/audit.model');
const { deleteStoredImage } = require('../../services/cloudinary.service');

const PURGE_CONFIRM_PHRASE = 'NETTOYER';

const NON_SUPERADMIN_FILTER = { role: { $ne: 'superadmin' } };

async function countGuestbookMessages() {
  const result = await Event.aggregate([
    { $project: { count: { $size: { $ifNull: ['$guestbook', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  return result[0]?.total || 0;
}

async function getPurgePreview() {
  const [
    events,
    guests,
    invitations,
    analytics,
    emails,
    whatsappLogs,
    guestbookMessages,
    eventsWithPhotos,
    users,
    usersWithAvatars,
    payments,
  ] = await Promise.all([
    Event.countDocuments(),
    Guest.countDocuments(),
    Invitation.countDocuments(),
    Analytics.countDocuments(),
    EmailLog.countDocuments(),
    WhatsAppLog.countDocuments(),
    countGuestbookMessages(),
    Event.countDocuments({ coverImage: { $exists: true, $nin: [null, ''] } }),
    User.countDocuments(NON_SUPERADMIN_FILTER),
    User.countDocuments({
      ...NON_SUPERADMIN_FILTER,
      avatarUrl: { $exists: true, $nin: [null, ''] },
    }),
    Payment.countDocuments(),
  ]);

  return {
    events,
    guests,
    invitations,
    analytics,
    emails,
    whatsappLogs,
    guestbookMessages,
    eventPhotos: eventsWithPhotos,
    users,
    userAvatars: usersWithAvatars,
    payments,
    totalMessages: guestbookMessages + emails + whatsappLogs,
  };
}

async function purgeAllTestData() {
  const [events, usersToDelete] = await Promise.all([
    Event.find().select('coverImage').lean(),
    User.find(NON_SUPERADMIN_FILTER).select('avatarUrl').lean(),
  ]);

  const coverImages = events.map((e) => e.coverImage).filter(Boolean);
  const avatarUrls = usersToDelete.map((u) => u.avatarUrl).filter(Boolean);

  const [
    deletedGuests,
    deletedInvitations,
    deletedAnalytics,
    deletedEmails,
    deletedWhatsappLogs,
    deletedEvents,
    deletedPayments,
    deletedUsers,
    deletedAuditLogs,
  ] = await Promise.all([
    Guest.deleteMany({}),
    Invitation.deleteMany({}),
    Analytics.deleteMany({}),
    EmailLog.deleteMany({}),
    WhatsAppLog.deleteMany({}),
    Event.deleteMany({}),
    Payment.deleteMany({}),
    User.deleteMany(NON_SUPERADMIN_FILTER),
    AuditLog.deleteMany({}),
  ]);

  const photoResults = await Promise.all(
    [...coverImages, ...avatarUrls].map((url) => deleteStoredImage(url))
  );
  const photosDeleted = photoResults.filter((r) => r.deleted).length;
  const photosFailed = photoResults.filter((r) => r.error).length;

  return {
    deleted: {
      events: deletedEvents.deletedCount || 0,
      guests: deletedGuests.deletedCount || 0,
      invitations: deletedInvitations.deletedCount || 0,
      analytics: deletedAnalytics.deletedCount || 0,
      emails: deletedEmails.deletedCount || 0,
      whatsappLogs: deletedWhatsappLogs.deletedCount || 0,
      eventPhotos: photosDeleted,
      users: deletedUsers.deletedCount || 0,
      payments: deletedPayments.deletedCount || 0,
      auditLogs: deletedAuditLogs.deletedCount || 0,
    },
    photosFailed,
    superAdminsPreserved: await User.countDocuments({ role: 'superadmin' }),
  };
}

module.exports = {
  PURGE_CONFIRM_PHRASE,
  getPurgePreview,
  purgeAllTestData,
};
