import { Product } from '../config/storage';
export interface ArbitrageOpportunity {
    bestMarket: {
        countryCode: string;
        price: number;
        currency: string;
        landedCost: number;
        savings: number;
        savingsPercentage: number;
    };
    localPrice: number;
    shippingDetails: {
        cost: number;
        estimatedDays: number;
        carrier: string;
    };
    taxAndDuty: {
        taxAmount: number;
        dutyAmount: number;
        totalFees: number;
    };
    risks: string[];
    recommendation: 'buy_international' | 'buy_local' | 'wait';
    confidence: number;
}
export interface MarketComparison {
    markets: {
        [countryCode: string]: {
            price: number;
            currency: string;
            landedCost: number;
            availability: string;
            estimatedDelivery: number;
            riskLevel: 'low' | 'medium' | 'high';
        };
    };
    bestDeal: ArbitrageOpportunity;
    priceRange: {
        min: number;
        max: number;
        average: number;
    };
}
export declare class GlobalArbitrageService {
    private readonly supportedMarkets;
    private readonly exchangeRateApi;
    private exchangeRates;
    findArbitrageOpportunities(product: Product, userCountry?: string): Promise<MarketComparison>;
    calculateLandedCost(basePrice: number, fromCountry: string, toCountry: string, productCategory?: string): Promise<{
        landedCost: number;
        breakdown: {
            basePrice: number;
            shipping: number;
            tax: number;
            duty: number;
            fees: number;
        };
        estimatedDelivery: number;
    }>;
    trackGlobalPriceTrends(productId: string, days?: number): Promise<{
        trends: {
            [countryCode: string]: {
                priceHistory: Array<{
                    date: string;
                    price: number;
                    landedCost: number;
                }>;
                trend: 'increasing' | 'decreasing' | 'stable';
                volatility: number;
            };
        };
        bestTimeToBuy: {
            market: string;
            estimatedOptimalDate: string;
            expectedPrice: number;
            confidence: number;
        };
    }>;
    private fetchGlobalPrices;
    private calculateLandedCosts;
    private findBestArbitrageDeal;
    private calculateShippingCost;
    private getTaxRate;
    private getDutyRate;
    private getDutyThreshold;
    private calculateHandlingFees;
    private getEstimatedDelivery;
    private getMarketCurrency;
    private getDistanceMultiplier;
    private getPreferredCarrier;
    private assessRiskLevel;
    private assessRisks;
    private getRecommendation;
    private calculateConfidence;
    private generateMockPriceHistory;
    private analyzeTrend;
    private calculateVolatility;
    private predictOptimalBuyTime;
}
export declare const globalArbitrageService: GlobalArbitrageService;
//# sourceMappingURL=globalArbitrageService.d.ts.map