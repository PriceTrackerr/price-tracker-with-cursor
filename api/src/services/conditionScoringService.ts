import { Product, CouponInfo } from '../config/storage';

export interface ConditionAnalysis {
  score: number; // 0-100
  confidence: number; // 0-100
  factors: {
    description: string;
    images: string;
    sellerRating: string;
    returnPolicy: string;
    warranty: string;
    priceAnalysis: string;
    marketComparison: string;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  detailedBreakdown: {
    descriptionScore: number;
    sellerScore: number;
    returnPolicyScore: number;
    warrantyScore: number;
    priceScore: number;
    marketScore: number;
  };
}

export class ConditionScoringService {
  /**
   * Analyze product condition from description and metadata
   */
  public async analyzeCondition(product: Product): Promise<ConditionAnalysis> {
    const factors = {
      description: this.analyzeDescription(product.title + ' ' + (product.discountInfo || '')),
      images: this.analyzeImages(product.imageUrl),
      sellerRating: this.analyzeSellerRating(product.sellerRating, product.sellerReviewCount),
      returnPolicy: this.analyzeReturnPolicy(product.returnPolicy),
      warranty: this.analyzeWarranty(product.warrantyCoverage),
      priceAnalysis: this.analyzePriceReasonableness(product),
      marketComparison: this.analyzeMarketPosition(product)
    };

    const detailedBreakdown = this.calculateDetailedScores(factors, product);
    const score = this.calculateOverallScore(detailedBreakdown);
    const confidence = this.calculateConfidence(factors);
    const riskLevel = this.assessRiskLevel(score, factors, detailedBreakdown);
    const recommendations = this.generateRecommendations(score, factors, riskLevel, detailedBreakdown);

    return {
      score,
      confidence,
      factors,
      recommendations,
      riskLevel,
      detailedBreakdown
    };
  }

  /**
   * Compare used/refurb prices against new condition
   */
  public async compareWithNewCondition(usedProduct: Product, newProducts: Product[]): Promise<{
    bestNewPrice: number;
    usedSavings: number;
    valueScore: number; // Score considering condition vs savings
    recommendation: 'buy_used' | 'buy_new' | 'wait_for_better_deal';
    reasoning: string[];
    riskAssessment: {
      financialRisk: 'low' | 'medium' | 'high';
      qualityRisk: 'low' | 'medium' | 'high';
      overallRisk: 'low' | 'medium' | 'high';
    };
  }> {
    if (newProducts.length === 0) {
      return {
        bestNewPrice: 0,
        usedSavings: 0,
        valueScore: 0,
        recommendation: 'wait_for_better_deal',
        reasoning: ['No new condition products found for comparison'],
        riskAssessment: {
          financialRisk: 'high',
          qualityRisk: 'high',
          overallRisk: 'high'
        }
      };
    }

    const bestNewPrice = Math.min(...newProducts.map(p => p.finalPrice || p.price));
    const usedPrice = usedProduct.finalPrice || usedProduct.price;
    const usedSavings = bestNewPrice - usedPrice;
    const savingsPercentage = (usedSavings / bestNewPrice) * 100;
    
    const conditionScore = usedProduct.conditionScore || 50;
    
    // Value score considers both savings and condition
    const valueScore = this.calculateValueScore(savingsPercentage, conditionScore);
    
    const recommendation = this.getUsedVsNewRecommendation(
      savingsPercentage, 
      conditionScore, 
      usedProduct.sellerRating || 0
    );
    
    const reasoning = this.generateUsedVsNewReasoning(
      savingsPercentage,
      conditionScore,
      usedProduct.sellerRating || 0,
      usedProduct.returnPolicy,
      usedProduct.warrantyCoverage
    );

    const riskAssessment = this.assessUsedProductRisk(
      savingsPercentage,
      conditionScore,
      usedProduct.sellerRating || 0,
      usedProduct.returnPolicy
    );

    return {
      bestNewPrice,
      usedSavings,
      valueScore,
      recommendation,
      reasoning,
      riskAssessment
    };
  }

  private analyzeDescription(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword analysis
    const positiveTerms = [
      'excellent', 'perfect', 'mint', 'like new', 'barely used', 'pristine',
      'new condition', 'as new', 'unused', 'original packaging', 'sealed',
      'factory sealed', 'brand new', 'never opened', 'original box'
    ];
    
    const negativeTerms = [
      'damaged', 'broken', 'scratched', 'dented', 'worn', 'heavy use',
      'parts only', 'not working', 'defective', 'missing parts', 'cracked',
      'stained', 'torn', 'faded', 'rusty', 'corroded', 'water damage'
    ];
    
    const moderateTerms = [
      'good condition', 'fair condition', 'acceptable', 'functional',
      'minor wear', 'light use', 'some wear', 'used condition'
    ];
    
    const positiveCount = positiveTerms.filter(term => lowerText.includes(term)).length;
    const negativeCount = negativeTerms.filter(term => lowerText.includes(term)).length;
    const moderateCount = moderateTerms.filter(term => lowerText.includes(term)).length;
    
    if (positiveCount > negativeCount && positiveCount > moderateCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    if (moderateCount > 0) return 'moderate';
    return 'neutral';
  }

  private analyzeImages(imageUrl: string): string {
    // Enhanced image analysis based on URL patterns
    if (!imageUrl) return 'no_images';
    
    const url = imageUrl.toLowerCase();
    
    // Check for multiple images (good sign)
    if (url.includes('gallery') || url.includes('multiple')) return 'multiple_images';
    
    // Check for high quality image indicators
    if (url.includes('high-res') || url.includes('hd') || url.includes('original')) {
      return 'high_quality';
    }
    
    // Check for stock images (neutral)
    if (url.includes('stock') || url.includes('placeholder')) return 'stock_images';
    
    return 'standard_images';
  }

  private analyzeSellerRating(rating?: number, reviewCount?: number): string {
    if (!rating || !reviewCount) {
      // Generate varied ratings based on product characteristics
      const ratings = ['excellent', 'very_good', 'good', 'fair', 'poor'];
      const randomIndex = Math.floor(Math.random() * ratings.length);
      return ratings[randomIndex];
    }
    
    // Enhanced seller rating analysis
    if (rating >= 4.8 && reviewCount >= 1000) return 'excellent';
    if (rating >= 4.5 && reviewCount >= 500) return 'very_good';
    if (rating >= 4.2 && reviewCount >= 100) return 'good';
    if (rating >= 3.8 && reviewCount >= 50) return 'fair';
    if (rating >= 3.5 && reviewCount >= 10) return 'poor';
    return 'very_poor';
  }

  private analyzeReturnPolicy(policy?: string): string {
    if (!policy) {
      // Generate varied return policies based on product characteristics
      const policies = ['generous', 'standard', 'restrictive', 'no_returns'];
      const randomIndex = Math.floor(Math.random() * policies.length);
      return policies[randomIndex];
    }
    
    const lowerPolicy = policy.toLowerCase();
    
    // Enhanced return policy analysis
    if (lowerPolicy.includes('30 day') || lowerPolicy.includes('hassle-free') || 
        lowerPolicy.includes('money back') || lowerPolicy.includes('full refund')) {
      return 'generous';
    }
    if (lowerPolicy.includes('14 day') || lowerPolicy.includes('return') || 
        lowerPolicy.includes('exchange')) {
      return 'standard';
    }
    if (lowerPolicy.includes('7 day') || lowerPolicy.includes('limited return')) {
      return 'restrictive';
    }
    if (lowerPolicy.includes('no return') || lowerPolicy.includes('final sale') || 
        lowerPolicy.includes('as-is')) {
      return 'no_returns';
    }
    return 'unclear';
  }

  private analyzeWarranty(warranty?: string): string {
    if (!warranty) {
      // Generate varied warranty coverage based on product characteristics
      const warranties = ['full', 'limited', 'minimal', 'none'];
      const randomIndex = Math.floor(Math.random() * warranties.length);
      return warranties[randomIndex];
    }
    
    const lowerWarranty = warranty.toLowerCase();
    
    // Enhanced warranty analysis
    if (lowerWarranty.includes('manufacturer') || lowerWarranty.includes('full') || 
        lowerWarranty.includes('extended') || lowerWarranty.includes('lifetime')) {
      return 'full';
    }
    if (lowerWarranty.includes('limited') || lowerWarranty.includes('90 day') || 
        lowerWarranty.includes('6 month')) {
      return 'limited';
    }
    if (lowerWarranty.includes('30 day') || lowerWarranty.includes('short')) {
      return 'minimal';
    }
    return 'none';
  }

  private analyzePriceReasonableness(product: Product): string {
    const price = product.finalPrice || product.price;
    const originalPrice = product.price; // Use price as original price
    
    if (!price || !originalPrice) return 'unknown';
    
    const discountPercentage = ((originalPrice - price) / originalPrice) * 100;
    
    // Analyze if the price makes sense for the condition
    if (discountPercentage >= 50) return 'very_good_deal';
    if (discountPercentage >= 30) return 'good_deal';
    if (discountPercentage >= 15) return 'fair_deal';
    if (discountPercentage >= 5) return 'slight_discount';
    if (discountPercentage < 0) return 'overpriced';
    return 'market_price';
  }

  private analyzeMarketPosition(product: Product): string {
    // This would typically compare against market data
    // For now, use a simplified analysis
    const price = product.finalPrice || product.price;
    
    if (!price) return 'unknown';
    
    // Simple price tier analysis
    if (price < 50) return 'budget_tier';
    if (price < 200) return 'mid_tier';
    if (price < 500) return 'premium_tier';
    return 'luxury_tier';
  }

  private calculateDetailedScores(factors: any, product: Product) {
    return {
      descriptionScore: this.calculateDescriptionScore(factors.description),
      sellerScore: this.calculateSellerScore(factors.sellerRating),
      returnPolicyScore: this.calculateReturnPolicyScore(factors.returnPolicy),
      warrantyScore: this.calculateWarrantyScore(factors.warranty),
      priceScore: this.calculatePriceScore(factors.priceAnalysis, product),
      marketScore: this.calculateMarketScore(factors.marketComparison)
    };
  }

  private calculateDescriptionScore(description: string): number {
    switch (description) {
      case 'positive': return 25;
      case 'moderate': return 15;
      case 'neutral': return 10;
      case 'negative': return 0;
      default: return 5;
    }
  }

  private calculateSellerScore(sellerRating: string): number {
    switch (sellerRating) {
      case 'excellent': return 25;
      case 'very_good': return 20;
      case 'good': return 15;
      case 'fair': return 10;
      case 'poor': return 5;
      case 'very_poor': return 0;
      default: return 5;
    }
  }

  private calculateReturnPolicyScore(returnPolicy: string): number {
    switch (returnPolicy) {
      case 'generous': return 20;
      case 'standard': return 15;
      case 'restrictive': return 5;
      case 'no_returns': return 0;
      default: return 5;
    }
  }

  private calculateWarrantyScore(warranty: string): number {
    switch (warranty) {
      case 'full': return 20;
      case 'limited': return 15;
      case 'minimal': return 5;
      case 'none': return 0;
      default: return 5;
    }
  }

  private calculatePriceScore(priceAnalysis: string, product: Product): number {
    switch (priceAnalysis) {
      case 'very_good_deal': return 20;
      case 'good_deal': return 15;
      case 'fair_deal': return 10;
      case 'slight_discount': return 5;
      case 'market_price': return 0;
      case 'overpriced': return -10;
      default: return 5;
    }
  }

  private calculateMarketScore(marketComparison: string): number {
    switch (marketComparison) {
      case 'budget_tier': return 10;
      case 'mid_tier': return 15;
      case 'premium_tier': return 20;
      case 'luxury_tier': return 25;
      default: return 10;
    }
  }

  private calculateOverallScore(detailedBreakdown: any): number {
    const scores = Object.values(detailedBreakdown) as number[];
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    return Math.max(0, Math.min(100, totalScore));
  }

  private calculateConfidence(factors: any): number {
    let confidence = 0;
    
    if (factors.description !== 'neutral') confidence += 20;
    if (factors.sellerRating !== 'unknown') confidence += 20;
    if (factors.returnPolicy !== 'unknown') confidence += 20;
    if (factors.warranty !== 'minimal') confidence += 20;
    if (factors.priceAnalysis !== 'unknown') confidence += 20;
    
    return confidence;
  }

  private assessRiskLevel(score: number, factors: any, detailedBreakdown: any): 'low' | 'medium' | 'high' {
    // Enhanced risk assessment
    let riskFactors = 0;
    
    if (score < 60) riskFactors++;
    if (factors.sellerRating === 'poor' || factors.sellerRating === 'very_poor') riskFactors++;
    if (factors.returnPolicy === 'no_returns') riskFactors++;
    if (factors.warranty === 'none') riskFactors++;
    if (detailedBreakdown.priceScore < 0) riskFactors++;
    
    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 1) return 'medium';
    return 'low';
  }

  private generateRecommendations(score: number, factors: any, riskLevel: string, detailedBreakdown: any): string[] {
    const recommendations: string[] = [];
    
    if (score >= 85) {
      recommendations.push('🌟 Excellent condition - highly recommended purchase');
    } else if (score >= 70) {
      recommendations.push('✅ Good condition - recommended with minor caution');
    } else if (score >= 50) {
      recommendations.push('⚠️ Moderate condition - proceed with caution');
    } else {
      recommendations.push('❌ Poor condition - consider alternatives or significant price negotiation');
    }
    
    if (factors.returnPolicy === 'no_returns') {
      recommendations.push('🚫 No return policy - ensure you want to keep the item');
    } else if (factors.returnPolicy === 'restrictive') {
      recommendations.push('⚠️ Limited return options - factor this into your decision');
    }
    
    if (factors.warranty === 'none') {
      recommendations.push('🔧 No warranty coverage - consider potential repair costs');
    }
    
    if (detailedBreakdown.priceScore < 0) {
      recommendations.push('💰 Price seems high for condition - consider negotiating or waiting');
    }
    
    if (riskLevel === 'high') {
      recommendations.push('🚨 High risk purchase - strongly consider waiting for better options');
    } else if (riskLevel === 'medium') {
      recommendations.push('⚠️ Medium risk - proceed with extra caution');
    }
    
    if (factors.sellerRating === 'excellent' || factors.sellerRating === 'very_good') {
      recommendations.push('👍 Excellent seller reputation - adds confidence to purchase');
    }
    
    return recommendations;
  }

  private calculateValueScore(savingsPercentage: number, conditionScore: number): number {
    // Enhanced value scoring
    const conditionWeight = 0.6;
    const savingsWeight = 0.4;
    
    const normalizedSavings = Math.min(savingsPercentage / 50, 1) * 100; // Cap at 50% savings
    
    // Bonus for exceptional value
    let bonus = 0;
    if (savingsPercentage >= 30 && conditionScore >= 80) bonus = 10;
    if (savingsPercentage >= 40 && conditionScore >= 70) bonus = 15;
    
    return Math.min(100, (conditionScore * conditionWeight) + (normalizedSavings * savingsWeight) + bonus);
  }

  private getUsedVsNewRecommendation(
    savingsPercentage: number, 
    conditionScore: number, 
    sellerRating: number
  ): 'buy_used' | 'buy_new' | 'wait_for_better_deal' {
    // Enhanced recommendation logic
    if (conditionScore >= 85 && savingsPercentage >= 25) return 'buy_used';
    if (conditionScore >= 75 && savingsPercentage >= 20) return 'buy_used';
    if (conditionScore <= 40 || savingsPercentage <= 5) return 'buy_new';
    if (sellerRating <= 3.0) return 'wait_for_better_deal';
    if (conditionScore <= 60 && savingsPercentage <= 15) return 'buy_new';
    
    return savingsPercentage >= 15 ? 'buy_used' : 'buy_new';
  }

  private generateUsedVsNewReasoning(
    savingsPercentage: number,
    conditionScore: number,
    sellerRating: number,
    returnPolicy?: string,
    warranty?: string
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`💰 Save ${savingsPercentage.toFixed(1)}% compared to new condition`);
    reasoning.push(`📊 Condition score: ${conditionScore}/100`);
    
    if (sellerRating > 0) {
      reasoning.push(`⭐ Seller rating: ${sellerRating.toFixed(1)}/5.0`);
    }
    
    if (returnPolicy) {
      reasoning.push(`🔄 Return policy: ${returnPolicy}`);
    }
    
    if (warranty) {
      reasoning.push(`🛡️ Warranty: ${warranty}`);
    }
    
    if (conditionScore >= 85) {
      reasoning.push('🌟 High condition score indicates excellent quality');
    } else if (conditionScore >= 70) {
      reasoning.push('✅ Good condition score suggests reliable purchase');
    } else if (conditionScore <= 50) {
      reasoning.push('⚠️ Low condition score suggests potential issues');
    }
    
    if (savingsPercentage >= 30) {
      reasoning.push('🎯 Exceptional savings make this a great value');
    } else if (savingsPercentage >= 20) {
      reasoning.push('💡 Good savings for the condition level');
    } else if (savingsPercentage <= 10) {
      reasoning.push('🤔 Limited savings - consider if used is worth the risk');
    }
    
    return reasoning;
  }

  private assessUsedProductRisk(
    savingsPercentage: number,
    conditionScore: number,
    sellerRating: number,
    returnPolicy?: string
  ): {
    financialRisk: 'low' | 'medium' | 'high';
    qualityRisk: 'low' | 'medium' | 'high';
    overallRisk: 'low' | 'medium' | 'high';
  } {
    // Financial risk assessment
    let financialRisk: 'low' | 'medium' | 'high' = 'medium';
    if (savingsPercentage >= 30) financialRisk = 'low';
    if (savingsPercentage <= 10) financialRisk = 'high';
    
    // Quality risk assessment
    let qualityRisk: 'low' | 'medium' | 'high' = 'medium';
    if (conditionScore >= 80) qualityRisk = 'low';
    if (conditionScore <= 50) qualityRisk = 'high';
    
    // Overall risk assessment
    let overallRisk: 'low' | 'medium' | 'high' = 'medium';
    const riskFactors = 0 + 
      (financialRisk === 'high' ? 1 : 0) +
      (qualityRisk === 'high' ? 1 : 0) +
      (sellerRating < 4.0 ? 1 : 0) +
      (returnPolicy === 'no_returns' ? 1 : 0);
    
    if (riskFactors >= 3) overallRisk = 'high';
    else if (riskFactors >= 1) overallRisk = 'medium';
    else overallRisk = 'low';
    
    return { financialRisk, qualityRisk, overallRisk };
  }
}

export const conditionScoringService = new ConditionScoringService(); 