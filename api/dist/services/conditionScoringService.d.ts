import { Product } from '../config/storage';
export interface ConditionAnalysis {
    score: number;
    confidence: number;
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
export declare class ConditionScoringService {
    analyzeCondition(product: Product): Promise<ConditionAnalysis>;
    compareWithNewCondition(usedProduct: Product, newProducts: Product[]): Promise<{
        bestNewPrice: number;
        usedSavings: number;
        valueScore: number;
        recommendation: 'buy_used' | 'buy_new' | 'wait_for_better_deal';
        reasoning: string[];
        riskAssessment: {
            financialRisk: 'low' | 'medium' | 'high';
            qualityRisk: 'low' | 'medium' | 'high';
            overallRisk: 'low' | 'medium' | 'high';
        };
    }>;
    private analyzeDescription;
    private analyzeImages;
    private analyzeSellerRating;
    private analyzeReturnPolicy;
    private analyzeWarranty;
    private analyzePriceReasonableness;
    private analyzeMarketPosition;
    private calculateDetailedScores;
    private calculateDescriptionScore;
    private calculateSellerScore;
    private calculateReturnPolicyScore;
    private calculateWarrantyScore;
    private calculatePriceScore;
    private calculateMarketScore;
    private calculateOverallScore;
    private calculateConfidence;
    private assessRiskLevel;
    private generateRecommendations;
    private calculateValueScore;
    private getUsedVsNewRecommendation;
    private generateUsedVsNewReasoning;
    private assessUsedProductRisk;
}
export declare const conditionScoringService: ConditionScoringService;
//# sourceMappingURL=conditionScoringService.d.ts.map