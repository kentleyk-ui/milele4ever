const fs = require('fs').promises;
const path = require('path');

class MonarkLogger {
  constructor() {
    this.buffer = [];
    this.maxBufferSize = 200;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logFile = path.join(__dirname, '../logs/monark.log');
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(path.join(__dirname, '../logs'), { recursive: true });
    } catch (err) {}
  }

  sanitize(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    if (sanitized.auth?.tokenPreview) {
      sanitized.auth.tokenPreview = sanitized.auth.tokenPreview.substring(0, 15) + '...';
    }
    if (sanitized.auth?.bearerTokenPreview) {
      sanitized.auth.bearerTokenPreview = 'Bearer ***';
    }
    if (sanitized.request?.headers?.authorizationPreview) {
      sanitized.request.headers.authorizationPreview = 'Bearer ***';
    }
    if (sanitized.auth?.cookieHeaderPreview) {
      sanitized.auth.cookieHeaderPreview = '***';
    }
    return sanitized;
  }

  async log(type, data) {
    if (this.isProduction && type !== 'auth' && type !== 'error') {
      return null;
    }

    const logEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      type,
      data: this.sanitize(data),
      env: process.env.NODE_ENV || 'development'
    };

    this.buffer.push(logEntry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (type === 'auth' || type === 'error') {
      await this.saveToFile(logEntry);
    }

    if (!this.isProduction) {
      console.log(`[MONARK ${type.toUpperCase()}]`, JSON.stringify(logEntry.data, null, 2));
    }

    return logEntry;
  }

  async saveToFile(logEntry) {
    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (err) {}
  }

  getLogs(limit = 50, type = null) {
    let filtered = [...this.buffer];
    if (type) {
      filtered = filtered.filter(log => log.type === type);
    }
    return filtered.slice(-limit).reverse();
  }

  getStats() {
    const types = {};
    this.buffer.forEach(log => {
      types[log.type] = (types[log.type] || 0) + 1;
    });
    return { total: this.buffer.length, types, oldest: this.buffer[0]?.timestamp, newest: this.buffer[this.buffer.length - 1]?.timestamp };
  }

  clearLogs() {
    this.buffer = [];
    return { success: true, message: 'Logs effacés' };
  }
}

module.exports = new MonarkLogger();
