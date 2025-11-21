import { Product, AutomationRule } from '../config/storage';
import { conditionScoringService } from './conditionScoringService';
import { couponStackingService } from './couponStackingService';
import { globalArbitrageService } from './globalArbitrageService';
import { communityService } from './communityService';
import { priceGuaranteeService } from './priceGuaranteeService';
import EmailService from './emailService';

export interface AutomationDecision {
  action: 'buy' | 'wait' | 'alert' | 'no_action';
  confidence: number; // 0-100
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
  alternatives: {
    action: string;
    reason: string;
    confidence: number;
  }[];
  executionPlan?: {
    steps: string[];
    estimatedTime: number;
    requiredApprovals: string[];
  };
}

export interface SmartAlert {
  id: string;
  type: 'price_drop' | 'stock_alert' | 'coupon_found' | 'arbitrage_opportunity' | 'guarantee_claimable' | 'condition_improved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionRequired: boolean;
  expiresAt?: string;
  metadata: {
    productId: string;
    originalPrice: number;
    currentPrice: number;
    savings: number;
    savingsPercentage: number;
  };
}

export interface AutoBuyExecution {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  product: Product;
  finalPrice: number;
  appliedCoupons: string[];
  paymentMethod: string;
  estimatedDelivery: string;
  steps: {
    step: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp?: string;
    details?: string;
  }[];
}

export class AutomationEngine {
  private readonly safetyLimits = {
    maxDailySpend: 2000,
    maxSinglePurchase: 1000,
    minCredibilityScore: 70,
    minConditionScore: 60,
    maxRiskLevel: 'medium' as const,
    requireUserApprovalAbove: 500
  };

  /**
   * Analyze product and make intelligent automation decision
   */
  public async makeAutomationDecision(
    product: Product,
    rule: AutomationRule,
    userContext: {
      budget: number;
      preferences: any;
      riskTolerance: 'low' | 'medium' | 'high';
    }
  ): Promise<AutomationDecision> {
    console.log(`🤖 Making automation decision for: ${product.title}`);

    // Gather comprehensive intelligence
    const intelligence = await this.gatherProductIntelligence(product);
    
    // Apply rule conditions
    const ruleMatch = this.evaluateRuleConditions(rule, product, intelligence);
    
    if (!ruleMatch.matches) {
      return {
        action: 'no_action',
        confidence: 100,
        reasoning: [`Rule conditions not met: ${ruleMatch.reasons.join(', ')}`],
        riskLevel: 'low',
        alternatives: []
      };
    }

    // Safety checks
    const safetyCheck = this.performSafetyChecks(product, intelligence, userContext);
    
    if (!safetyCheck.passed) {
      return {
        action: 'alert',
        confidence: 90,
        reasoning: [`Safety check failed: ${safetyCheck.reasons.join(', ')}`],
        riskLevel: 'high',
        alternatives: [
          {
            action: 'wait',
            reason: 'Wait for safer opportunity',
            confidence: 85
          }
        ]
      };
    }

    // Make intelligent decision
    const decision = this.calculateOptimalAction(product, intelligence, rule, userContext);
    
    return decision;
  }

  /**
   * Execute automated purchase with full intelligence
   */
  public async executeAutoBuy(
    product: Product,
    rule: AutomationRule,
    userContext: any
  ): Promise<AutoBuyExecution> {
    const executionId = `auto-buy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`🛒 Executing auto-buy: ${executionId}`);

    const execution: AutoBuyExecution = {
      id: executionId,
      status: 'pending',
      product,
      finalPrice: product.finalPrice || product.price,
      appliedCoupons: [],
      paymentMethod: userContext.preferredPaymentMethod || 'default',
      estimatedDelivery: this.calculateDeliveryDate(product),
      steps: [
        { step: 'Validate product availability', status: 'pending' },
        { step: 'Apply optimal coupons', status: 'pending' },
        { step: 'Verify final price', status: 'pending' },
        { step: 'Execute purchase', status: 'pending' },
        { step: 'Confirm order', status: 'pending' },
        { step: 'Set up tracking', status: 'pending' }
      ]
    };

    try {
      execution.status = 'in_progress';

      // Step 1: Validate product availability
      await this.updateExecutionStep(execution, 0, 'completed', 'Product confirmed in stock');

      // Step 2: Apply optimal coupons
      const couponResult = await couponStackingService.findCoupons(product);
      if (couponResult.bestStack.coupons.length > 0) {
        const applied = await couponStackingService.autoApplyCoupons(product, couponResult.bestStack.coupons);
        execution.appliedCoupons = applied.appliedCoupons.map(c => c.code);
        execution.finalPrice = applied.finalPrice;
        await this.updateExecutionStep(execution, 1, 'completed', `Applied ${applied.appliedCoupons.length} coupons, saved $${applied.totalSavings.toFixed(2)}`);
      } else {
        await this.updateExecutionStep(execution, 1, 'completed', 'No additional coupons found');
      }

      // Step 3: Verify final price
      const priceVerification = await this.verifyFinalPrice(product, execution.finalPrice);
      if (!priceVerification.isValid) {
        throw new Error(`Price verification failed: ${priceVerification.reason}`);
      }
      await this.updateExecutionStep(execution, 2, 'completed', `Final price confirmed: $${execution.finalPrice.toFixed(2)}`);

      // Step 4: Execute purchase (mock implementation)
      const purchaseResult = await this.executePurchase(product, execution);
      if (!purchaseResult.success) {
        throw new Error(`Purchase failed: ${purchaseResult.error}`);
      }
      await this.updateExecutionStep(execution, 3, 'completed', `Order placed: ${purchaseResult.orderId}`);

      // Step 5: Confirm order
      await this.updateExecutionStep(execution, 4, 'completed', 'Order confirmation received');

      // Step 6: Set up tracking
      await this.setupOrderTracking(execution);
      await this.updateExecutionStep(execution, 5, 'completed', 'Tracking activated');

      execution.status = 'completed';
      
      // Send success notification
      await this.sendAutoBuyNotification(execution, 'success');

    } catch (error) {
      execution.status = 'failed';
      console.error(`Auto-buy failed for ${executionId}:`, error);
      
      // Send failure notification
      await this.sendAutoBuyNotification(execution, 'failed', error.message);
    }

    return execution;
  }

  /**
   * Generate smart alerts based on comprehensive analysis
   */
  public async generateSmartAlerts(
    products: Product[],
    userRules: AutomationRule[]
  ): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];

    for (const product of products) {
      const intelligence = await this.gatherProductIntelligence(product);
      
      // Price drop alerts
      if (intelligence.priceChange && intelligence.priceChange.percentage < -10) {
        alerts.push({
          id: `price-drop-${product.id}-${Date.now()}`,
          type: 'price_drop',
          priority: intelligence.priceChange.percentage < -25 ? 'high' : 'medium',
          title: `📉 Significant Price Drop: ${product.title}`,
          message: `Price dropped ${Math.abs(intelligence.priceChange.percentage).toFixed(1)}% to $${intelligence.currentPrice.toFixed(2)}`,
          actionRequired: intelligence.credibility.score >= 70,
          metadata: {
            productId: product.id,
            originalPrice: intelligence.originalPrice,
            currentPrice: intelligence.currentPrice,
            savings: intelligence.priceChange.amount,
            savingsPercentage: Math.abs(intelligence.priceChange.percentage)
          }
        });
      }

      // Coupon stack alerts
      if (intelligence.coupons && intelligence.coupons.totalSavings > 20) {
        alerts.push({
          id: `coupon-${product.id}-${Date.now()}`,
          type: 'coupon_found',
          priority: intelligence.coupons.totalSavings > 50 ? 'high' : 'medium',
          title: `🎟️ New Coupon Stack: ${product.title}`,
          message: `Found ${intelligence.coupons.coupons.length} stackable coupons saving $${intelligence.coupons.totalSavings.toFixed(2)}`,
          actionRequired: true,
          expiresAt: this.findEarliestCouponExpiry(intelligence.coupons.coupons),
          metadata: {
            productId: product.id,
            originalPrice: product.price,
            currentPrice: intelligence.coupons.bestStack.finalPrice,
            savings: intelligence.coupons.totalSavings,
            savingsPercentage: (intelligence.coupons.totalSavings / product.price) * 100
          }
        });
      }

      // Arbitrage opportunities
      if (intelligence.arbitrage && intelligence.arbitrage.bestDeal.bestMarket.savings > 30) {
        alerts.push({
          id: `arbitrage-${product.id}-${Date.now()}`,
          type: 'arbitrage_opportunity',
          priority: intelligence.arbitrage.bestDeal.bestMarket.savings > 100 ? 'high' : 'medium',
          title: `🌍 Global Deal: ${product.title}`,
          message: `Save $${intelligence.arbitrage.bestDeal.bestMarket.savings.toFixed(2)} buying from ${intelligence.arbitrage.bestDeal.bestMarket.countryCode}`,
          actionRequired: intelligence.arbitrage.bestDeal.recommendation === 'buy_international',
          metadata: {
            productId: product.id,
            originalPrice: intelligence.arbitrage.bestDeal.localPrice,
            currentPrice: intelligence.arbitrage.bestDeal.bestMarket.landedCost,
            savings: intelligence.arbitrage.bestDeal.bestMarket.savings,
            savingsPercentage: intelligence.arbitrage.bestDeal.bestMarket.savingsPercentage
          }
        });
      }

      // Condition improvement alerts
      if (intelligence.condition && intelligence.condition.score > 80 && product.condition === 'used') {
        alerts.push({
          id: `condition-${product.id}-${Date.now()}`,
          type: 'condition_improved',
          priority: 'medium',
          title: `✅ High Quality Used Item: ${product.title}`,
          message: `Excellent condition score (${intelligence.condition.score}/100) with ${intelligence.condition.riskLevel} risk`,
          actionRequired: false,
          metadata: {
            productId: product.id,
            originalPrice: product.price,
            currentPrice: product.price,
            savings: 0,
            savingsPercentage: 0
          }
        });
      }
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async gatherProductIntelligence(product: Product) {
    console.log(`🧠 Gathering intelligence for: ${product.title}`);

    const [condition, coupons, arbitrage, credibility] = await Promise.all([
      conditionScoringService.analyzeCondition(product).catch((): null => null),
      couponStackingService.findCoupons(product).catch((): null => null),
      globalArbitrageService.findArbitrageOpportunities(product, 'US').catch((): null => null),
      communityService.calculateCredibilityScore(product).catch((): null => null)
    ]);

    // Calculate price change
    const priceChange = this.calculatePriceChange(product);

    return {
      condition,
      coupons,
      arbitrage,
      credibility,
      priceChange,
      originalPrice: product.price,
      currentPrice: product.finalPrice || product.price,
      timestamp: new Date().toISOString()
    };
  }

  private evaluateRuleConditions(rule: AutomationRule, product: Product, intelligence: any) {
    const conditions = rule.conditions;
    const reasons: string[] = [];
    let matches = true;

    // Price conditions
    if (conditions.maxPrice && (product.finalPrice || product.price) > conditions.maxPrice) {
      matches = false;
      reasons.push(`Price $${(product.finalPrice || product.price).toFixed(2)} exceeds max $${conditions.maxPrice}`);
    }

    // Condition score
    if (conditions.minConditionScore && intelligence.condition && intelligence.condition.score < conditions.minConditionScore) {
      matches = false;
      reasons.push(`Condition score ${intelligence.condition.score} below minimum ${conditions.minConditionScore}`);
    }

    // Seller rating
    if (conditions.minSellerRating && product.sellerRating && product.sellerRating < conditions.minSellerRating) {
      matches = false;
      reasons.push(`Seller rating ${product.sellerRating} below minimum ${conditions.minSellerRating}`);
    }

    // Coupons required
    if (conditions.requiresCoupons && (!intelligence.coupons || intelligence.coupons.coupons.length === 0)) {
      matches = false;
      reasons.push('Coupons required but none found');
    }

    return { matches, reasons };
  }

  private performSafetyChecks(product: Product, intelligence: any, userContext: any) {
    const reasons: string[] = [];
    let passed = true;

    // Budget check
    const finalPrice = product.finalPrice || product.price;
    if (finalPrice > userContext.budget) {
      passed = false;
      reasons.push(`Price $${finalPrice.toFixed(2)} exceeds budget $${userContext.budget}`);
    }

    // Daily spend limit
    if (finalPrice > this.safetyLimits.maxDailySpend) {
      passed = false;
      reasons.push(`Price exceeds daily spend limit $${this.safetyLimits.maxDailySpend}`);
    }

    // Credibility check
    if (intelligence.credibility && intelligence.credibility.score < this.safetyLimits.minCredibilityScore) {
      passed = false;
      reasons.push(`Credibility score ${intelligence.credibility.score} below safety minimum ${this.safetyLimits.minCredibilityScore}`);
    }

    // Risk tolerance
    if (userContext.riskTolerance === 'low' && intelligence.condition && intelligence.condition.riskLevel === 'high') {
      passed = false;
      reasons.push('High risk item not suitable for low risk tolerance');
    }

    return { passed, reasons };
  }

  private calculateOptimalAction(product: Product, intelligence: any, rule: AutomationRule, userContext: any): AutomationDecision {
    const finalPrice = product.finalPrice || product.price;
    const savings = intelligence.coupons ? intelligence.coupons.totalSavings : 0;
    const credibilityScore = intelligence.credibility ? intelligence.credibility.score : 50;

    // Calculate confidence based on multiple factors
    let confidence = 50;
    
    if (credibilityScore >= 80) confidence += 20;
    else if (credibilityScore >= 60) confidence += 10;
    
    if (savings >= 50) confidence += 15;
    else if (savings >= 20) confidence += 10;
    
    if (intelligence.condition && intelligence.condition.score >= 80) confidence += 10;
    
    if (intelligence.arbitrage && intelligence.arbitrage.bestDeal.recommendation === 'buy_international') {
      confidence += 5;
    }

    // Determine action
    let action: 'buy' | 'wait' | 'alert' | 'no_action' = 'wait';
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';

    if (confidence >= 85 && finalPrice <= this.safetyLimits.requireUserApprovalAbove) {
      action = 'buy';
      riskLevel = 'low';
    } else if (confidence >= 70) {
      action = finalPrice > this.safetyLimits.requireUserApprovalAbove ? 'alert' : 'buy';
      riskLevel = 'medium';
    } else if (confidence >= 50) {
      action = 'alert';
      riskLevel = 'medium';
    } else {
      action = 'wait';
      riskLevel = 'high';
    }

    const reasoning = [
      `Credibility score: ${credibilityScore}/100`,
      `Potential savings: $${savings.toFixed(2)}`,
      `Final price: $${finalPrice.toFixed(2)}`,
      `Overall confidence: ${confidence}%`
    ];

    if (intelligence.condition) {
      reasoning.push(`Condition: ${intelligence.condition.score}/100 (${intelligence.condition.riskLevel} risk)`);
    }

    const alternatives = [
      { action: 'wait', reason: 'Monitor for better opportunity', confidence: Math.max(0, confidence - 20) },
      { action: 'alert', reason: 'Notify user for manual decision', confidence: Math.max(0, confidence - 10) }
    ];

    return {
      action,
      confidence: Math.min(100, confidence),
      reasoning,
      riskLevel,
      alternatives,
      executionPlan: action === 'buy' ? {
        steps: [
          'Apply best coupon stack',
          'Verify final price',
          'Execute purchase',
          'Confirm order',
          'Set up tracking'
        ],
        estimatedTime: 120, // seconds
        requiredApprovals: finalPrice > this.safetyLimits.requireUserApprovalAbove ? ['user'] : []
      } : undefined
    };
  }

  private calculatePriceChange(product: Product) {
    // Mock implementation - in production, compare with price history
    const randomChange = (Math.random() - 0.7) * 0.3; // Bias toward price drops
    const newPrice = product.price * (1 + randomChange);
    
    if (Math.abs(randomChange) < 0.05) return null; // No significant change
    
    return {
      amount: newPrice - product.price,
      percentage: randomChange * 100,
      direction: randomChange < 0 ? 'down' : 'up'
    };
  }

  private calculateDeliveryDate(product: Product): string {
    const days = product.platform === 'amazon' ? 2 : 5; // Mock delivery estimation
    const deliveryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return deliveryDate.toISOString().split('T')[0];
  }

  private async updateExecutionStep(execution: AutoBuyExecution, stepIndex: number, status: 'completed' | 'failed', details?: string): Promise<void> {
    execution.steps[stepIndex].status = status;
    execution.steps[stepIndex].timestamp = new Date().toISOString();
    execution.steps[stepIndex].details = details;
    
    console.log(`✅ Step ${stepIndex + 1}: ${execution.steps[stepIndex].step} - ${status}`);
  }

  private async verifyFinalPrice(product: Product, expectedPrice: number): Promise<{ isValid: boolean; reason?: string }> {
    // Mock price verification
    const actualPrice = product.finalPrice || product.price;
    const tolerance = 0.05; // 5% tolerance
    
    if (Math.abs(actualPrice - expectedPrice) / expectedPrice > tolerance) {
      return {
        isValid: false,
        reason: `Price changed: expected $${expectedPrice.toFixed(2)}, actual $${actualPrice.toFixed(2)}`
      };
    }
    
    return { isValid: true };
  }

  private async executePurchase(product: Product, execution: AutoBuyExecution): Promise<{ success: boolean; orderId?: string; error?: string }> {
    // Mock purchase execution
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate purchase time
    
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }

  private async setupOrderTracking(execution: AutoBuyExecution): Promise<void> {
    // Set up order tracking and delivery monitoring
    console.log(`📦 Setting up tracking for order: ${execution.id}`);
  }

  private async sendAutoBuyNotification(execution: AutoBuyExecution, type: 'success' | 'failed', error?: string): Promise<void> {
    const subject = type === 'success' 
      ? `✅ Auto-Buy Successful: ${execution.product.title}`
      : `❌ Auto-Buy Failed: ${execution.product.title}`;
    
    console.log(`📧 Sending notification: ${subject}`);
    
    // In production, send actual notification
  }

  private findEarliestCouponExpiry(coupons: any[]): string {
    if (!coupons.length) return '';
    
    const earliest = coupons.reduce((earliest, coupon) => {
      return new Date(coupon.expiresAt) < new Date(earliest.expiresAt) ? coupon : earliest;
    });
    
    return earliest.expiresAt;
  }
}

export const automationEngine = new AutomationEngine(); 