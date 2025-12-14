const AuditLog = require('./audit.model');

const logAction = async ({ actor, action, targetUser, details, ip }) => {
  await AuditLog.create({
    actor,
    action,
    targetUser,
    details,
    ip,
  });
};

module.exports = { logAction };
