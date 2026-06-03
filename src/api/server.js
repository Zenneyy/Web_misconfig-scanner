import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes.js';

const app = express();

/* ==============================
   Security & Core Middleware
============================== */

// Security headers
app.use(helmet());

// CORS
app.use(cors());

// JSON body parsing
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.url}`
  );
  next();
});

/* ==============================
   Static Frontend (Optional)
============================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build if bundled with backend
app.use(express.static(path.join(__dirname, '../frontend')));

/* ==============================
   Root Info Endpoint
============================== */

app.get('/', (req, res) => {
  res.json({
    message: 'Web Misconfig Scanner',
    version: '1.0.0',
    description: 'OWASP A02:2025 Security Misconfiguration Scanner',
    endpoints: {
      api: 'GET /api',
      scan: 'POST /api/scan',
      health: 'GET /api/health',
    },
    warning:
      'Use this tool responsibly. Ensure you have permission to scan target websites.',
  });
});

/* ==============================
   API Routes
============================== */

app.use('/api', routes);

/* ==============================
   Global Error Handler
============================== */

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong',
  });
});

/* ==============================
   Server Start
============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(' Web Misconfig Scanner API Started');
  console.log('='.repeat(50));
  console.log(`Server:        http://localhost:${PORT}`);
  console.log(`API:           http://localhost:${PORT}/api`);
  console.log(`Health:        http://localhost:${PORT}/api/health`);
  console.log(`Recent Scans:  http://localhost:${PORT}/api/scans`);
  console.log('='.repeat(50));
  console.log('Ready to scan!\n');
});

