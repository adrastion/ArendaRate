import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import passport from './config/passport';
import { errorHandler } from './middleware/errorHandler';
import { sendDailyDigest } from './services/dailyDigest';
import authRoutes from './routes/auth';
import addressRoutes from './routes/addresses';
import apartmentRoutes from './routes/apartments';
import reviewRoutes from './routes/reviews';
import moderationRoutes from './routes/moderation';
import telegramWebhookRoutes from './routes/telegramWebhook';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/telegram-webhook', telegramWebhookRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);

  // Ежедневная сводка в Telegram в 19:00 серверного времени
  cron.schedule('0 19 * * *', () => {
    sendDailyDigest().catch((err) => {
      console.error('Daily digest failed:', err);
    });
  });
});

