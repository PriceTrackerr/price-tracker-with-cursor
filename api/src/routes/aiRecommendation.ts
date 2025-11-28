import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDb } from '../config/database';
import { supabase, TABLES } from '../config/supabase';
import axios from 'axios';

const router = express.Router();
const db = getDb();

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
 * Get AI recommendation from Groq (Llama 3) for a product
 * Caches results in Supabase for 7 days
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

    // 1. Check Database Cache
    try {
      const { data: cachedData, error: cacheError } = await supabase
        .from(TABLES.AI_RECOMMENDATIONS)
        .select('recommendation_text, expires_at')
        .eq('product_id', productId)
        .single();

      if (!cacheError && cachedData) {
        const now = new Date();
        const expiresAt = new Date(cachedData.expires_at);

        if (expiresAt > now) {
          console.log(`✅ Returning DB cached recommendation for product ${productId}`);
          return res.json({
            success: true,
            data: {
              ...cachedData.recommendation_text,
              cached: true
            }
          });
        } else {
          console.log(`⚠️ Cache expired for product ${productId}, refreshing...`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error checking AI cache:', err);
      // Continue to fetch fresh data on cache error
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
          risk: 'Medium',
          action: 'Check back later',
          cached: false
        }
      });
    }

    // ===== Enhanced Data Analysis =====

    // Ensure all price values have safe defaults to prevent undefined errors
    const safeCurrentPrice = currentPrice || 0;
    const safeLowestPrice = lowestPrice || safeCurrentPrice;
    const safeGlobalCheapest = globalCheapest || safeCurrentPrice;
    const safePriceHistory = (priceHistory && Array.isArray(priceHistory)) ? priceHistory : [];

    // 1. Calculate price volatility and trends
    const calculateVolatility = (history: Array<{ price: number; timestamp: string }>) => {
      if (history.length < 2) return { volatility: 0, trend: 'flat', highestPrice: safeCurrentPrice, daysSinceLastDrop: 0, avgPrice: safeCurrentPrice, predictedDrop: 'Unknown' };

      const sorted = [...history].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const prices = sorted.map(h => h.price);
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance);
      const volatilityPercent = (volatility / mean) * 100;

      // Determine trend (last 7 days)
      const recentPrices = sorted.slice(-7);
      const firstRecent = recentPrices[0]?.price || safeCurrentPrice;
      const lastRecent = recentPrices[recentPrices.length - 1]?.price || safeCurrentPrice;

      let trend = 'flat';
      const trendChange = ((lastRecent - firstRecent) / firstRecent) * 100;
      if (trendChange > 2) trend = 'rising';
      else if (trendChange < -2) trend = 'falling';

      // Find highest price and days since last drop
      const highestPrice = Math.max(...prices, safeCurrentPrice);
      const lastDropIndex = sorted.findIndex((h, i) =>
        i > 0 && h.price < sorted[i - 1].price
      );
      const daysSinceLastDrop = lastDropIndex >= 0
        ? Math.floor((Date.now() - new Date(sorted[lastDropIndex].timestamp).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Analyze monthly patterns (simple heuristic)
      const currentDay = new Date().getDate();
      const isEndMonth = currentDay > 25;
      const isMidMonth = currentDay > 14 && currentDay < 16;
      let predictedDrop = 'Unknown';

      if (trend === 'falling') predictedDrop = 'Price is currently dropping';
      else if (daysSinceLastDrop > 14) predictedDrop = 'Due for a drop soon (based on 2-week cycle)';
      else if (isEndMonth) predictedDrop = 'Likely to drop start of next month';

      return {
        volatility: volatilityPercent,
        trend,
        highestPrice,
        daysSinceLastDrop,
        avgPrice: mean,
        predictedDrop
      };
    };

    const priceAnalysis = calculateVolatility(safePriceHistory);

    // 2. Detect condition/seller clues from title
    const detectConditionClues = (title: string) => {
      const lowerTitle = title.toLowerCase();
      const clues: string[] = [];

      // Condition keywords
      if (lowerTitle.includes('refurbished')) clues.push('Refurbished');
      if (lowerTitle.includes('open box')) clues.push('Open Box');
      if (lowerTitle.includes('like new')) clues.push('Like New');
      if (lowerTitle.includes('used')) clues.push('Used');
      if (lowerTitle.includes('renewed')) clues.push('Amazon Renewed');
      if (lowerTitle.includes('no charger') || lowerTitle.includes('without charger')) clues.push('No charger included');
      if (lowerTitle.includes('cracked') || lowerTitle.includes('damaged')) clues.push('⚠️ Damage mentioned');

      // Seller clues
      if (lowerTitle.includes('amazon')) clues.push('Sold by Amazon');
      if (lowerTitle.includes('3rd party') || lowerTitle.includes('third party')) clues.push('3rd party seller');

      // Scarcity signals
      if (lowerTitle.includes('only') && lowerTitle.includes('left')) clues.push('⏰ Low stock - Urgency High');
      if (lowerTitle.includes('limited')) clues.push('⏰ Limited offer');

      return clues;
    };

    const conditionClues = detectConditionClues(title);

    const savingsVsHigh = ((priceAnalysis.highestPrice - safeCurrentPrice) / priceAnalysis.highestPrice) * 100;
    const savingsVsAvg = ((priceAnalysis.avgPrice - safeCurrentPrice) / priceAnalysis.avgPrice) * 100;
    const savingsVsLowest = safeLowestPrice !== 0 ? ((safeCurrentPrice - safeLowestPrice) / safeLowestPrice) * 100 : 0;

    // 4. Determine risk level
    let risk = 'Low';
    if (priceAnalysis.volatility > 15) risk = 'High';
    else if (priceAnalysis.volatility > 8) risk = 'Medium';

    // Build enhanced prompt with all data
    const prompt = `You are a brutally honest shopping expert who helps people save money by analyzing data.

Product: ${title}
Current price: $${safeCurrentPrice.toFixed(2)}
30-day lowest: $${safeLowestPrice.toFixed(2)}
30-day highest: $${priceAnalysis.highestPrice.toFixed(2)}
Average price (30d): $${priceAnalysis.avgPrice.toFixed(2)}
Global cheapest (with shipping): $${safeGlobalCheapest.toFixed(2)}

Price Analysis:
- Savings vs highest: ${savingsVsHigh.toFixed(1)}%
- Savings vs average: ${savingsVsAvg.toFixed(1)}%
- Distance from 30-day low: ${savingsVsLowest > 0 ? '+' : ''}${savingsVsLowest.toFixed(1)}%
- Recent trend (7 days): ${priceAnalysis.trend === 'rising' ? '📈 Rising' : priceAnalysis.trend === 'falling' ? '📉 Falling' : '➡️ Flat'}
- Price volatility: ${priceAnalysis.volatility.toFixed(1)}% (${risk} risk)
- Days since last price drop: ${priceAnalysis.daysSinceLastDrop}
- Predicted drop: ${priceAnalysis.predictedDrop}

Additional Context:
- Working coupon: ${hasCoupon ? 'Yes ✅' : 'No'}
- Reddit sentiment: ${redditSentiment} ${redditSentiment === 'positive' ? '👍' : redditSentiment === 'negative' ? '👎' : '👌'}
${conditionClues.length > 0 ? `- Product notes: ${conditionClues.join(', ')}` : ''}

Give a verdict in this EXACT format (don't add extra text):
VERDICT: STRONG BUY / BUY / WAIT / AVOID
Confidence: XX%
Risk: Low/Medium/High
Reason: 1-2 specific sentences using the data above (mention exact percentages, trends, or timeframes)
Action: One clear next step (e.g., "Buy now", "Set alert for $X", "Wait 5 days")
Alternative: If not buying, suggest what to do instead

IMPORTANT: Vary your verdicts based on the data - don't always say STRONG BUY. Use:
- STRONG BUY: Only when price is 15%+ below average AND trend is flat/falling
- BUY: When price is 8-15% below average OR has good coupon
- WAIT: When price is near average OR rising trend
- AVOID: When price is above average OR high volatility + rising trend

Be honest and data-driven. Users trust you to save them money.`;

    console.log(`🤖 Calling Groq AI for product: ${title}`);
    console.log(`📊 Analysis: ${savingsVsAvg.toFixed(1)}% vs avg, trend: ${priceAnalysis.trend}, volatility: ${priceAnalysis.volatility.toFixed(1)}%`);

    // Call Groq API (OpenAI-compatible endpoint)
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a brutally honest shopping expert. Be specific, data-driven, and vary your recommendations. Never give generic advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.85, // Increased for more variety
        max_tokens: 250
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

    // Parse the enhanced response
    const verdictMatch = aiResponse.match(/VERDICT:\s*(STRONG BUY|BUY|WAIT|AVOID)/i);
    const confidenceMatch = aiResponse.match(/Confidence:\s*(\d+)%/i);
    const riskMatch = aiResponse.match(/Risk:\s*(Low|Medium|High)/i);
    const reasonMatch = aiResponse.match(/Reason:\s*(.+?)(?:\n|Action:|$)/is);
    const actionMatch = aiResponse.match(/Action:\s*(.+?)(?:\n|Alternative:|$)/is);
    const alternativeMatch = aiResponse.match(/Alternative:\s*(.+?)(?:\n|$)/is);

    const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'WAIT';
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 70;
    const detectedRisk = riskMatch ? riskMatch[1] : risk;
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Analysis completed.';
    const action = actionMatch ? actionMatch[1].trim() : 'Review product details';
    const alternative = alternativeMatch ? alternativeMatch[1].trim() : '';

    const recommendation = {
      verdict,
      confidence,
      risk: detectedRisk,
      reason,
      action,
      alternative: alternative || undefined,
      priceAnalysis: {
        savingsVsAverage: Math.round(savingsVsAvg),
        trend: priceAnalysis.trend,
        volatility: Math.round(priceAnalysis.volatility),
        predictedDrop: priceAnalysis.predictedDrop
      },
      cached: false
    };

    // Save to Database Cache (7 days expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const { error: upsertError } = await supabase
        .from(TABLES.AI_RECOMMENDATIONS)
        .upsert({
          product_id: productId,
          recommendation_text: recommendation,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        });

      if (upsertError) {
        console.error('❌ Error caching AI recommendation:', upsertError);
      } else {
        console.log(`💾 Cached AI recommendation for product ${productId}`);
      }
    } catch (err) {
      console.error('❌ Error saving to AI cache:', err);
    }

    return res.json({
      success: true,
      data: recommendation
    });

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Groq API Error:', {
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
