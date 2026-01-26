const express = require('express');
const router = express.Router();

const { version, name } = require('../../package.json');

router.get('/', (req, res) => {
  res.json({
    name,
    version,
    status: 'online',
    uptime: process.uptime()
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
