import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import travelRouter from './routes/travel.js';
import travelLogRouter from './routes/travelLog.js';
import tripPlanRouter from './routes/tripPlan.js';
import trainRouter from './routes/train.js';
import collectRouter from './controllers/collection.js';
import collectlistRouter from './controllers/collectionlist.js';
import locationRouter from './services/location.js';
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Service is running', uptime: process.uptime() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/travel', travelRouter);
app.use('/api/travel-logs', travelLogRouter);
app.use('/api/trip-plans', tripPlanRouter);
app.use('/api/plan', collectRouter);
app.use('/api/list', collectlistRouter);
app.use('/api/location', locationRouter);
// Backward compat
app.use('/travel', travelRouter);
app.use('/api/train', trainRouter);
// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
