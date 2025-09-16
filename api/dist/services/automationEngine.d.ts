import { Product, AutomationRule } from '../config/storage';
export interface AutomationDecision {
    action: 'buy' | 'wait' | 'alert' | 'no_action';
    confidence: number;
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
export declare class AutomationEngine {
    private readonly safetyLimits;
    makeAutomationDecision(product: Product, rule: AutomationRule, userContext: {
        budget: number;
        preferences: any;
        riskTolerance: 'low' | 'medium' | 'high';
    }): Promise<AutomationDecision>;
    executeAutoBuy(product: Product, rule: AutomationRule, userContext: any): Promise<AutoBuyExecution>;
    generateSmartAlerts(products: Product[], userRules: AutomationRule[]): Promise<SmartAlert[]>;
    private gatherProductIntelligence;
    private evaluateRuleConditions;
    private performSafetyChecks;
    private calculateOptimalAction;
    private calculatePriceChange;
    private calculateDeliveryDate;
    private updateExecutionStep;
    private verifyFinalPrice;
    private executePurchase;
    private setupOrderTracking;
    private sendAutoBuyNotification;
    private findEarliestCouponExpiry;
}
export declare const automationEngine: AutomationEngine;
//# sourceMappingURL=automationEngine.d.ts.map