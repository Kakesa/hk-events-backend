const DEFAULT_PRODUCTION_ORIGINS = [
  'https://www.hkeventscd.com',
  'https://hkeventscd.com',
];

const DEFAULT_DEVELOPMENT_ORIGINS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const parseOrigins = (...values) =>
  values
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

const getAllowedOrigins = () => {
  const origins = parseOrigins(
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    ...DEFAULT_PRODUCTION_ORIGINS,
    ...(process.env.NODE_ENV !== 'production' ? DEFAULT_DEVELOPMENT_ORIGINS : [])
  );

  return new Set(origins);
};

const corsOptions = (allowedOrigins) => ({
  origin: (origin, callback) => {
    // Requêtes sans Origin (Postman, health checks, curl)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  optionsSuccessStatus: 204,
});

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
};

module.exports = {
  getAllowedOrigins,
  corsOptions,
  applyCorsHeaders,
  DEFAULT_PRODUCTION_ORIGINS,
};
