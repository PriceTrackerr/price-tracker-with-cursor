"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const features_1 = require("../config/features");
const router = express_1.default.Router();
router.get('/status', (req, res) => {
    res.json({
        message: 'Price Tracker Feature Status',
        timestamp: new Date().toISOString(),
        features: (0, features_1.getFeatureStatus)(),
        deployment: {
            stage: 'MVP Launch',
            aiEnabled: false,
            platforms: 'Currency APIs + Core Features',
            nextPhase: 'Platform Integrations'
        }
    });
});
router.get('/roadmap', (req, res) => {
    res.json({
        roadmap: {
            phase1: {
                name: 'MVP Launch (Current)',
                status: '✅ Complete',
                features: [
                    'Multi-currency price tracking',
                    'Global arbitrage detection',
                    'Rule-based condition scoring',
                    'Coupon stacking',
                    'Price guarantees',
                    'User dashboards'
                ]
            },
            phase2: {
                name: 'Platform Expansion',
                status: '🔄 Next',
                features: [
                    'Amazon Associates API',
                    'eBay API integration',
                    'Walmart API',
                    'Target API',
                    'Best Buy API'
                ]
            },
            phase3: {
                name: 'AI Enhancement',
                status: '⏳ Future',
                features: [
                    'AI-powered condition analysis',
                    'Smart price predictions',
                    'Fraud detection',
                    'Personalized recommendations'
                ]
            }
        }
    });
});
exports.default = router;
//# sourceMappingURL=features.js.map