import express, { Response } from 'express';
import { getFeatureStatus, FEATURES } from '../config/features';

const router = express.Router();

// Get current feature status
router.get('/status', (req, res: Response) => {
  res.json({
    message: 'Price Tracker Feature Status',
    timestamp: new Date().toISOString(),
    features: getFeatureStatus(),
    deployment: {
      stage: 'MVP Launch',
      aiEnabled: false,
      platforms: 'Currency APIs + Core Features',
      nextPhase: 'Platform Integrations'
    }
  });
});

// Get feature roadmap
router.get('/roadmap', (req, res: Response) => {
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

export default router;
