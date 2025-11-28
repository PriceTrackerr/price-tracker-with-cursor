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
import { isSupabaseConfigured } from './config/supabase';

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
import aiRecommendationRoutes from './routes/aiRecommendation';
import subscriptionRoutes from './routes/subscriptions';
import cronRoutes from './routes/cron';
import couponRoutes from './routes/coupons';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
app.set('trust proxy', 1);

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'https://price-tracker-with-cursor-web-app.vercel.app', // Web app
  'https://price-tracker-with-cursor-web-app-s.vercel.app', // Web app (alternative)
  'https://price-tracker-with-cursor.vercel.app', // Admin dashboard
  'https://price-tracker-with-cursor-2am4ntk8x.vercel.app', // Admin dashboard (new deployment)
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.ADMIN_DASHBOARD_URL ? [process.env.ADMIN_DASHBOARD_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Chrome extensions
      if (origin.startsWith('chrome-extension://') ||
        origin.startsWith('moz-extension://') ||
        origin.startsWith('safari-extension://')) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting - more permissive to avoid blocking legitimate users
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000, // 500 in prod, 1000 in dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for some IPs if needed
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/health/database';
  }
});
app.use('/api/', limiter);

// Logging middleware
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));

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
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database health check endpoint
app.get('/health/database', async (req, res) => {
  try {
    const db = getDb();
    const dbType = db.constructor.name;
    const supabaseConfigured = isSupabaseConfigured();

    // Test database connection
    let connectionTest = 'unknown';
    try {
      if (typeof db.getProducts === 'function') {
        await db.getProducts();
        connectionTest = 'success';
      } else {
        connectionTest = 'no_methods';
      }
    } catch (error) {
      connectionTest = 'failed';
    }

    res.json({
      status: 'ok',
      database: {
        type: dbType,
        connection: connectionTest,
        isSupabase: dbType === 'SupabaseStorage',
        isFileStorage: dbType === 'FileStorage',
      },
      environment: {
        USE_SUPABASE: process.env.USE_SUPABASE,
        USE_LOCAL_DB: process.env.USE_LOCAL_DB,
        VERCEL: process.env.VERCEL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not_set',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not_set',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not_set',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Price Tracker Backend',
    status: 'OK',
    message: 'API is running',
    endpoints: {
      health: '/health',
      api: '/api',
    },
    version: '1.0.0',
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
      '/api/subscriptions',
      '/api/advanced',
      '/api/features',
      '/api/product-matching',
    ],
  });
});

// Test endpoint for storage
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
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/advanced', advancedFeaturesRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/product-matching', productMatchingRoutes);
app.use('/api/ai', aiRecommendationRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/coupons', couponRoutes);

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
    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase configuration incomplete, cannot start server');
    }

    // Test database connection
    const db = getDb();
    await db.getProducts(); // Test connection
    console.log('✅ Database connected successfully');

    // Initialize cron jobs (disabled for debugging)
    // initializeCronJobs();
    console.log('⚠️ Cron jobs temporarily disabled for debugging');

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