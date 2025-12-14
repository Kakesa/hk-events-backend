const AuditLog = require('./audit.model');

const createAudit = async ({
  req,
  action,
  target,
  before,
  after,
}) => {
  if (!req.user) return;

  await AuditLog.create({
    actor: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    },
    action,
    target,
    before,
    after,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

module.exports = { createAudit };
