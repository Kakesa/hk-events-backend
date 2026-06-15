const { applyCorsHeaders } = require('../config/cors');

exports.errorHandler = (err, req, res, next) => {
  applyCorsHeaders(req, res);
  console.error(err.stack || err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Contenu trop volumineux (template email trop lourd)',
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
};
