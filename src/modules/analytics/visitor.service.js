const SiteVisit = require('./site-visit.model');

const PERIOD_CONFIG = {
  day: { ms: 24 * 60 * 60 * 1000, groupFormat: '%Y-%m-%d %H:00', labelFormat: 'hour' },
  week: { ms: 7 * 24 * 60 * 60 * 1000, groupFormat: '%Y-%m-%d', labelFormat: 'day' },
  month: { ms: 30 * 24 * 60 * 60 * 1000, groupFormat: '%Y-%m-%d', labelFormat: 'day' },
  year: { ms: 365 * 24 * 60 * 60 * 1000, groupFormat: '%Y-%m', labelFormat: 'month' },
};

const buildEmptyBuckets = (period, startDate, endDate) => {
  const buckets = [];
  const cursor = new Date(startDate);

  if (period === 'day') {
    cursor.setMinutes(0, 0, 0);
    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')} ${String(cursor.getHours()).padStart(2, '0')}:00`;
      buckets.push({ label: key, visits: 0, uniqueVisitors: 0 });
      cursor.setHours(cursor.getHours() + 1);
    }
    return buckets;
  }

  if (period === 'year') {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ label: key, visits: 0, uniqueVisitors: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }

  cursor.setHours(0, 0, 0, 0);
  while (cursor <= endDate) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    buckets.push({ label: key, visits: 0, uniqueVisitors: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
};

exports.recordVisit = async ({ visitorId, path, referrer }) => {
  return SiteVisit.create({
    visitorId,
    path: path || '/',
    referrer: referrer || '',
  });
};

exports.getVisitorStats = async (period = 'week') => {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.week;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - config.ms);

  const [aggregated, totalVisits, uniqueVisitorsResult] = await Promise.all([
    SiteVisit.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: config.groupFormat, date: '$createdAt' } },
          visits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          label: '$_id',
          visits: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          _id: 0,
        },
      },
      { $sort: { label: 1 } },
    ]),
    SiteVisit.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    SiteVisit.distinct('visitorId', { createdAt: { $gte: startDate, $lte: endDate } }),
  ]);

  const bucketMap = new Map(aggregated.map((row) => [row.label, row]));
  const chartData = buildEmptyBuckets(period, startDate, endDate).map((bucket) => {
    const found = bucketMap.get(bucket.label);
    return found || bucket;
  });

  const topPages = await SiteVisit.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$path', visits: { $sum: 1 } } },
    { $sort: { visits: -1 } },
    { $limit: 10 },
    { $project: { path: '$_id', visits: 1, _id: 0 } },
  ]);

  return {
    period,
    totalVisits,
    uniqueVisitors: uniqueVisitorsResult.length,
    chartData,
    topPages,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};
