import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDb } from '../config/database';
import axios from 'axios';

const router = express.Router();
const db = getDb();

// In-memory cache for AI recommendations (24 hours)
const recommendationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface RecommendationRequest {
  productId: string;
  title: string;
  currentPrice: number;
  priceHistory: Array<{ price: number; timestamp: string }>;
  lowestPrice: number;
  globalCheapest: number;
  hasCoupon: boolean;
  redditSentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * POST /api/ai/recommendation
 * Get AI recommendation from DeepSeek for a product
 */
router.post('/recommendation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      productId,
      title,
      currentPrice,
      priceHistory,
      lowestPrice,
      globalCheapest,
      hasCoupon,
      redditSentiment
    } = req.body as RecommendationRequest;

    if (!productId || !title || currentPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, title, currentPrice'
      });
    }

    // Check cache first
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

    // Get Groq API key (fallback to DeepSeek for backward compatibility)
    const groqApiKey = process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK;
    if (!groqApiKey) {
      console.warn('⚠️ GROQ_API_KEY not configured, returning fallback recommendation');
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

    // Build the prompt
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

    console.log(`🤖 Calling Groq AI for product: ${title}`);

    // Call Groq API (OpenAI-compatible endpoint)
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // Fast, free Groq model
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
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = groqResponse.data?.choices?.[0]?.message?.content || '';
    console.log(`📝 Groq response: ${aiResponse}`);

    // Parse the response
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

    // Cache the result
    recommendationCache.set(cacheKey, {
      data: recommendation,
      timestamp: Date.now()
    });

    // Clean old cache entries (older than 24 hours)
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

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ DeepSeek API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    } else {
      console.error('❌ Error getting AI recommendation:', error?.message || error);
    }

    // Return fallback on error
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

export default router;

