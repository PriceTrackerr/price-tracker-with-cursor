"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
const db = (0, database_1.getDb)();
const recommendationCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000;
router.post('/recommendation', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, title, currentPrice, priceHistory, lowestPrice, globalCheapest, hasCoupon, redditSentiment } = req.body;
        if (!productId || !title || currentPrice === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: productId, title, currentPrice'
            });
        }
        const cacheKey = `recommendation_${productId}`;
        const cached = recommendationCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`✅ Returning cached recommendation for product ${productId}`);
            return res.json({
                success: true,
                data: cached.data,
                cached: true
            });
        }
        const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekApiKey) {
            console.warn('⚠️ DEEPSEEK_API_KEY not configured, returning fallback recommendation');
            return res.json({
                success: true,
                data: {
                    verdict: 'WAIT',
                    confidence: 75,
                    reason: 'AI analysis temporarily unavailable. Please check back later.',
                    cached: false
                }
            });
        }
        const prompt = `Product: ${title}
Current price: $${currentPrice.toFixed(2)}
30-day lowest: $${lowestPrice.toFixed(2)}
Global cheapest (incl. shipping): $${globalCheapest.toFixed(2)}
Working coupon: ${hasCoupon ? 'Yes' : 'No'}
Reddit sentiment: ${redditSentiment}

Give a buy verdict in this exact format:
VERDICT: STRONG BUY / BUY / WAIT / AVOID
Confidence: XX%
Reason: One short sentence.`;
        console.log(`🤖 Calling DeepSeek AI for product: ${title}`);
        const deepseekResponse = await axios_1.default.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a product price analysis expert. Analyze the given product data and provide a clear buy recommendation.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${deepseekApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        const aiResponse = deepseekResponse.data?.choices?.[0]?.message?.content || '';
        console.log(`📝 DeepSeek response: ${aiResponse}`);
        const verdictMatch = aiResponse.match(/VERDICT:\s*(STRONG BUY|BUY|WAIT|AVOID)/i);
        const confidenceMatch = aiResponse.match(/Confidence:\s*(\d+)%/i);
        const reasonMatch = aiResponse.match(/Reason:\s*(.+?)(?:\n|$)/i);
        const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'WAIT';
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 75;
        const reason = reasonMatch ? reasonMatch[1].trim() : 'Analysis completed.';
        const recommendation = {
            verdict,
            confidence,
            reason,
            cached: false
        };
        recommendationCache.set(cacheKey, {
            data: recommendation,
            timestamp: Date.now()
        });
        const now = Date.now();
        for (const [key, value] of recommendationCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                recommendationCache.delete(key);
            }
        }
        return res.json({
            success: true,
            data: recommendation
        });
    }
    catch (error) {
        console.error('❌ Error getting AI recommendation:', error?.message || error);
        return res.json({
            success: true,
            data: {
                verdict: 'WAIT',
                confidence: 70,
                reason: 'AI analysis temporarily unavailable. Please try again later.',
                cached: false
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=aiRecommendation.js.map