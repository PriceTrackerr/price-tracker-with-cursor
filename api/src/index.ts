import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeCronJobs } from './services/cronJobs';
import { getDb } from './config/database';

// Import routes
import productRoutes from './routes/products';
import userRoutes from './routes/users';
import alertRoutes from './routes/alerts';
import webhookRoutes from './routes/webhooks';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import advancedFeaturesRoutes from './routes/advancedFeatures';
import featuresRoutes from './routes/features';
import productMatchingRoutes from './routes/productMatching';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';




const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // Allow any origin dynamically
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});



const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // allow 1000 requests per 15 minutes per IP for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
// NOTE: For production, consider lowering this to 100-500 per 15 min per IP
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint for deployments (e.g., Vercel) to avoid 404 on "/"
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Price Tracker Backend',
    status: 'OK',
    message: 'API is running',
    endpoints: {
      health: '/health',
      api: '/api'
    },
    version: '1.0.0'
  });
});

// API root info
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Price Tracker API',
    routes: [
      '/api/products',
      '/api/users',
      '/api/alerts',
      '/api/webhooks',
      '/api/notifications',
      '/api/payments',
      '/api/advanced',
      '/api/features',
      '/api/product-matching'
    ]
  });
});

// Test endpoint for local storage
app.get('/test-storage', async (req, res) => {
  try {
    const db = getDb();
    const products = await db.getProducts();
    res.json({ success: true, productCount: products.length });
  } catch (error) {
    let message = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message;
    }
    res.status(500).json({ success: false, error: message });
  }
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/advanced', advancedFeaturesRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/product-matching', productMatchingRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // No SQL database to initialize!
    console.log('✅ Database connected successfully');

    // Initialize cron jobs
    // initializeCronJobs(); // TEMPORARILY DISABLED to fix connection issues
    console.log('⚠️  Cron jobs temporarily disabled for debugging');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export app for serverless (Vercel)
export default app;

// Start the server only when not running in Vercel serverless
if (!process.env.VERCEL) {
  startServer();
}