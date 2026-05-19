const monarkLogger = require('../services/monarkLogger');

const monarkDebugMiddleware = (req, res, next) => {
  // Ignorer les assets statiques
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  // Ignorer les health checks
  if (req.path === '/health' || req.path === '/ping') {
    return next();
  }

  const startTime = Date.now();
  const originalJson = res.json;
  let responseBody;

  res.json = function(data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Log seulement ce qui est important
    const shouldLog = (
      res.statusCode >= 400 ||
      req.path.includes('/api/staff') ||
      req.path.includes('/api/monark')
    );

    if (!shouldLog) return;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      headers: {
        authorization: authHeader ? 'PRÉSENT ✅' : 'ABSENT ❌',
        contentType: req.headers['content-type']
      },
      authDetails: {
        isBearerFormat: authHeader?.startsWith('Bearer ') ? 'OUI ✅' : 'NON ❌',
        tokenPreview: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
      },
      user: {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        role: req.user?.role || null
      },
      response: res.statusCode >= 400 ? responseBody : '[OK]'
    };

    if (res.statusCode === 401) {
      await monarkLogger.log('auth', { message: '🚨 ERREUR 401', route: `${req.path}:${req.method}`, ...logData });
    } else if (res.statusCode === 403) {
      await monarkLogger.log('auth', { message: '🔒 ERREUR 403 - Accès refusé', route: `${req.path}:${req.method}`, ...logData });
    } else if (res.statusCode >= 500) {
      await monarkLogger.log('error', { message: '💥 ERREUR SERVEUR', ...logData });
    } else if (req.path.includes('/api/staff')) {
      await monarkLogger.log('request', { message: '📡 Requête Staff', ...logData });
    }
  });

  next();
};

module.exports = monarkDebugMiddleware;
