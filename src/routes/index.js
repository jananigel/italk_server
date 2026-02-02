import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const router = express.Router();
const { version, name } = pkg;

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

export default router;
