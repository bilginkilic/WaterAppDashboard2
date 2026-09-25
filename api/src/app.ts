import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import waterprintRoutes from './routes/waterprint.routes';
import adminRoutes from './routes/admin.routes';

export function createApp() {
  const app = express();

  // CORS — Netlify dashboard URL'ini commitlemeyin; Render env ile verin
  const dashboardOrigin = process.env.FRONTEND_DASHBOARD_ORIGIN;
  const corsOrigins = [
    'http://localhost:3002',
    'http://localhost:3000',
    'https://waterappdashboard2.onrender.com',
    ...(dashboardOrigin ? [dashboardOrigin] : []),
  ];

  app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
  }));

  app.options('*', cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/waterprint', waterprintRoutes);
  app.use('/api/admin', adminRoutes);

  return app;
}
