import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

connectDB();

const app = express();

// Trust the first hop of any reverse proxy (Vercel, Render, etc.) so
// express-rate-limit sees the real client IP via X-Forwarded-For instead
// of the proxy's own IP.
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
