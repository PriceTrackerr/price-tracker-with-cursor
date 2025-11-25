"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = require("./config/database");
const supabase_1 = require("./config/supabase");
const products_1 = __importDefault(require("./routes/products"));
const users_1 = __importDefault(require("./routes/users"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const payments_1 = __importDefault(require("./routes/payments"));
const advancedFeatures_1 = __importDefault(require("./routes/advancedFeatures"));
const features_1 = __importDefault(require("./routes/features"));
const productMatching_1 = __importDefault(require("./routes/productMatching"));
const aiRecommendation_1 = __importDefault(require("./routes/aiRecommendation"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://price-tracker-with-cursor-web-app.vercel.app',
    'https://price-tracker-with-cursor.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...(process.env.ADMIN_DASHBOARD_URL ? [process.env.ADMIN_DASHBOARD_URL] : []),
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (origin.startsWith('chrome-extension://') ||
            origin.startsWith('moz-extension://') ||
            origin.startsWith('safari-extension://')) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
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
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(process.env.NODE_ENV === 'development' ? (0, morgan_1.default)('dev') : (0, morgan_1.default)('combined'));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.get('/health/database', async (req, res) => {
    try {
        const db = (0, database_1.getDb)();
        const dbType = db.constructor.name;
        const supabaseConfigured = (0, supabase_1.isSupabaseConfigured)();
        let connectionTest = 'unknown';
        try {
            if (typeof db.getProducts === 'function') {
                await db.getProducts();
                connectionTest = 'success';
            }
            else {
                connectionTest = 'no_methods';
            }
        }
        catch (error) {
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
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});
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
app.get('/test-storage', async (req, res) => {
    try {
        const db = (0, database_1.getDb)();
        const products = await db.getProducts();
        res.json({ success: true, productCount: products.length });
    }
    catch (error) {
        let message = 'Unknown error';
        if (error && typeof error === 'object' && 'message' in error) {
            message = error.message;
        }
        res.status(500).json({ success: false, error: message });
    }
});
app.use('/api/products', products_1.default);
app.use('/api/users', users_1.default);
app.use('/api/alerts', alerts_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/advanced', advancedFeatures_1.default);
app.use('/api/features', features_1.default);
app.use('/api/product-matching', productMatching_1.default);
app.use('/api/ai', aiRecommendation_1.default);
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${socket.id} joined room: ${roomId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
app.set('io', io);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        if (!(0, supabase_1.isSupabaseConfigured)()) {
            throw new Error('Supabase configuration incomplete, cannot start server');
        }
        const db = (0, database_1.getDb)();
        await db.getProducts();
        console.log('✅ Database connected successfully');
        console.log('⚠️ Cron jobs temporarily disabled for debugging');
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
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
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
exports.default = app;
if (!process.env.VERCEL) {
    startServer();
}
//# sourceMappingURL=index.js.map