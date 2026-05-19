const express = require('express');
const router = express.Router();
const monarkLogger = require('../services/monarkLogger');
const MONARK_SECRET = process.env.MONARK_SECRET || 'monark2024secret';

// Middleware de vérification
const verifyMonarkAccess = (req, res, next) => {
  const { secret } = req.query;
  const authHeader = req.headers['x-monark-secret'];
  if (secret !== MONARK_SECRET && authHeader !== MONARK_SECRET) {
    return res.status(403).json({ error: 'Accès refusé', message: 'Secret invalide ou manquant' });
  }
  next();
};

// GET /api/monark/logs?secret=xxx
router.get('/logs', verifyMonarkAccess, (req, res) => {
  const { limit, type } = req.query;
  try {
    const logs = monarkLogger.getLogs(parseInt(limit) || 50, type);
    res.json({ success: true, total: logs.length, logs, stats: monarkLogger.getStats(), timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// GET /api/monark/stats?secret=xxx
router.get('/stats', verifyMonarkAccess, (req, res) => {
  try {
    const stats = monarkLogger.getStats();
    res.json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// DELETE /api/monark/clear?secret=xxx (vider les logs)
router.delete('/clear', verifyMonarkAccess, (req, res) => {
  try {
    monarkLogger.buffer = [];
    res.json({ success: true, message: 'Logs effacés', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// GET /api/monark/health (sans auth, pour monitoring)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Monark Logger',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
