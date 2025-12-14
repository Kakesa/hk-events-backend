const AuditLog = require('./audit.model');

const getAudits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action } = req.query;

    const query = {};
    if (action) query.action = action;

    const audits = await AuditLog.find(query)
      .populate('actor.id', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
      data: audits,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAudits };
