import { Product, PriceGuarantee } from '../config/storage';
export interface RetailerPolicy {
    retailer: string;
    policyType: 'price_match' | 'price_protection' | 'best_price_guarantee';
    windowDays: number;
    maxClaimAmount?: number;
    requirements: string[];
    exclusions: string[];
    claimUrl: string;
    documentationRequired: string[];
    processingTime: string;
    successRate: number;
}
export interface GuaranteeAnalysis {
    eligibleGuarantees: PriceGuarantee[];
    claimableAmount: number;
    bestGuarantee: PriceGuarantee | null;
    documentation: {
        screenshots: string[];
        priceProof: string[];
        purchaseProof: string[];
    };
    nextSteps: string[];
}
export declare class PriceGuaranteeService {
    private readonly retailerPolicies;
    analyzeGuarantees(product: Product, purchaseDate?: string, purchaseRetailer?: string): Promise<GuaranteeAnalysis>;
    monitorGuarantees(productIds: string[]): Promise<void>;
    generateClaimDocumentation(product: Product, guarantee: PriceGuarantee, competitorPrice: number, competitorUrl: string): Promise<{
        claimForm: any;
        supportingDocuments: string[];
        submissionInstructions: string[];
    }>;
    trackClaimResult(guaranteeId: string, result: 'approved' | 'denied' | 'pending', amountRecovered?: number, notes?: string): Promise<void>;
    private getEligiblePolicies;
    private createGuarantee;
    private findBestGuarantee;
    private generateDocumentation;
    private generateNextSteps;
    private checkGuaranteeOpportunities;
    private updateGuaranteeTracking;
    private isProductAvailableAtRetailer;
    private findBestCompetitorPrice;
    sendGuaranteeAlert(userEmail: string, product: Product, guarantee: PriceGuarantee): Promise<void>;
}
export declare const priceGuaranteeService: PriceGuaranteeService;
//# sourceMappingURL=priceGuaranteeService.d.ts.map