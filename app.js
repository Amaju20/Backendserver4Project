import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { assertRequiredEnv } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import rsvpRoutes from './routes/rsvp.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

assertRequiredEnv();
connectDB();

const app = express();

// Trust the first hop of any reverse proxy (Vercel, Render, etc.) so
// express-rate-limit sees the real client IP via X-Forwarded-For instead
// of the proxy's own IP.
app.set('trust proxy', 1);

// Standard security headers (HSTS, X-Content-Type-Options, etc.). CSP is
// left at helmet's default — this is a JSON API with no HTML views to
// protect, so a strict CSP mostly just covers /api/health.
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/rsvps', rsvpRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
