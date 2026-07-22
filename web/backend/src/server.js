import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';

// Import configs
import './config/db.js';
import { initSocket } from './config/socket.js';

// Import Middlewares
import { errorHandler } from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import sugarRoutes from './routes/sugarRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import foodScannerRoutes from './routes/foodScannerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initSocket(server);

// Security and Logging Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for dev/testing ease.
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiter — raised limit to prevent 429 errors during development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (handles polling + dev usage)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // disable in dev mode
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Server Status Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Diabetes Management System API is running successfully.',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sugar', sugarRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/food-scanner', foodScannerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/gamification', gamificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Listen
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  AI Diabetes System Backend running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================\n`);
});
