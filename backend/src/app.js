import express from 'express';
import cors from 'cors';

// Routes (will be created module by module)
import authRoutes from './modules/auth/auth.routes.js';
import eventRoutes from './modules/events/events.routes.js';
import photoRoutes from './modules/photos/photos.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 10mb for base64 image uploads in search

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/events', photoRoutes);
app.use('/api/v1/events', searchRoutes);
app.use('/api/v1/events', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
