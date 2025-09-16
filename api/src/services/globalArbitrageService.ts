import { Product, GlobalMarketData } from '../config/storage';

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

export class GlobalArbitrageService {
  private readonly supportedMarkets = ['US', 'EU', 'UK', 'JP', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES'];
  private readonly exchangeRateApi = 'https://api.exchangerate-api.com/v4/latest/';
  
  // Mock exchange rates - in production, fetch from real API
  private exchangeRates: { [currency: string]: number } = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
  };

  /**
   * Find arbitrage opportunities across global markets
   */
  public async findArbitrageOpportunities(product: Product, userCountry: string = 'US'): Promise<MarketComparison> {
    // Fetch prices from all supported markets
    const marketData = await this.fetchGlobalPrices(product);
    
    // Calculate landed costs for each market
    const marketsWithLandedCosts = await this.calculateLandedCosts(marketData, userCountry);
    
    // Find the best deal
    const bestDeal = this.findBestArbitrageDeal(marketsWithLandedCosts, userCountry);
    
    // Calculate price statistics
    const prices = Object.values(marketsWithLandedCosts).map(m => m.landedCost);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };

    return {
      markets: marketsWithLandedCosts,
      bestDeal,
      priceRange
    };
  }

  /**
   * Calculate total landed cost including shipping, taxes, and duties
   */
  public async calculateLandedCost(
    basePrice: number,
    fromCountry: string,
    toCountry: string,
    productCategory: string = 'electronics'
  ): Promise<{
    landedCost: number;
    breakdown: {
      basePrice: number;
      shipping: number;
      tax: number;
      duty: number;
      fees: number;
    };
    estimatedDelivery: number;
  }> {
    const shippingCost = this.calculateShippingCost(basePrice, fromCountry, toCountry);
    const taxRate = this.getTaxRate(toCountry);
    const dutyRate = this.getDutyRate(productCategory, fromCountry, toCountry);
    const handlingFees = this.calculateHandlingFees(basePrice);
    
    const taxableAmount = basePrice + shippingCost;
    const taxAmount = taxableAmount * taxRate;
    const dutyAmount = basePrice * dutyRate;
    
    const landedCost = basePrice + shippingCost + taxAmount + dutyAmount + handlingFees;
    
    return {
      landedCost,
      breakdown: {
        basePrice,
        shipping: shippingCost,
        tax: taxAmount,
        duty: dutyAmount,
        fees: handlingFees
      },
      estimatedDelivery: this.getEstimatedDelivery(fromCountry, toCountry)
    };
  }

  /**
   * Track price movements across markets over time
   */
  public async trackGlobalPriceTrends(productId: string, days: number = 30): Promise<{
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
  }> {
    // Mock implementation - in production, this would analyze historical data
    const trends: any = {};
    
    for (const market of this.supportedMarkets) {
      const mockHistory = this.generateMockPriceHistory(days);
      trends[market] = {
        priceHistory: mockHistory,
        trend: this.analyzeTrend(mockHistory),
        volatility: this.calculateVolatility(mockHistory)
      };
    }

    const bestTimeToBuy = this.predictOptimalBuyTime(trends);

    return {
      trends,
      bestTimeToBuy
    };
  }

  private async fetchGlobalPrices(product: Product): Promise<GlobalMarketData> {
    // Mock implementation - in production, this would scrape/API call multiple markets
    const mockData: GlobalMarketData = {
      productId: product.id,
      markets: {},
      bestDeal: {
        countryCode: 'US',
        savings: 0,
        landedCost: product.price
      },
      updatedAt: new Date().toISOString()
    };

    // Simulate different prices across markets
    for (const market of this.supportedMarkets) {
      const basePrice = product.price;
      const priceVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const marketPrice = basePrice * (1 + priceVariation);
      
      mockData.markets[market] = {
        price: marketPrice,
        currency: this.getMarketCurrency(market),
        platform: product.platform,
        url: `${product.url}?market=${market}`,
        inStock: Math.random() > 0.1, // 90% chance in stock
        shippingInfo: {
          cost: this.calculateShippingCost(marketPrice, market, 'US'),
          estimatedDays: this.getEstimatedDelivery(market, 'US'),
          carrier: this.getPreferredCarrier(market, 'US')
        },
        taxInfo: {
          rate: this.getTaxRate('US'),
          included: false
        },
        dutyInfo: {
          rate: this.getDutyRate('electronics', market, 'US'),
          threshold: this.getDutyThreshold('US')
        },
        landedCost: 0, // Will be calculated
        lastUpdated: new Date().toISOString()
      };
    }

    return mockData;
  }

  private async calculateLandedCosts(
    marketData: GlobalMarketData, 
    userCountry: string
  ): Promise<{ [countryCode: string]: any }> {
    const result: any = {};

    for (const [country, data] of Object.entries(marketData.markets)) {
      if (country === userCountry) {
        // Local market - no additional costs
        result[country] = {
          price: data.price,
          currency: data.currency,
          landedCost: data.price,
          availability: data.inStock ? 'in_stock' : 'out_of_stock',
          estimatedDelivery: 1, // Local delivery
          riskLevel: 'low' as const
        };
      } else {
        const landedCostData = await this.calculateLandedCost(
          data.price,
          country,
          userCountry,
          'electronics'
        );

        result[country] = {
          price: data.price,
          currency: data.currency,
          landedCost: landedCostData.landedCost,
          availability: data.inStock ? 'in_stock' : 'out_of_stock',
          estimatedDelivery: landedCostData.estimatedDelivery,
          riskLevel: this.assessRiskLevel(country, userCountry, landedCostData.landedCost)
        };
      }
    }

    return result;
  }

  private findBestArbitrageDeal(markets: any, userCountry: string): ArbitrageOpportunity {
    const localPrice = markets[userCountry]?.landedCost || Infinity;
    
    let bestMarket: any = null;
    let bestSavings = 0;

    for (const [country, data] of Object.entries(markets)) {
      const marketData = data as any; // Type assertion for the data object
      if (country !== userCountry && marketData.availability === 'in_stock') {
        const savings = localPrice - marketData.landedCost;
        if (savings > bestSavings) {
          bestSavings = savings;
          bestMarket = { countryCode: country, ...marketData };
        }
      }
    }

    if (!bestMarket || bestSavings <= 0) {
      return {
        bestMarket: {
          countryCode: userCountry,
          price: localPrice,
          currency: this.getMarketCurrency(userCountry),
          landedCost: localPrice,
          savings: 0,
          savingsPercentage: 0
        },
        localPrice,
        shippingDetails: { cost: 0, estimatedDays: 1, carrier: 'local' },
        taxAndDuty: { taxAmount: 0, dutyAmount: 0, totalFees: 0 },
        risks: [],
        recommendation: 'buy_local',
        confidence: 100
      };
    }

    const savingsPercentage = (bestSavings / localPrice) * 100;
    const risks = this.assessRisks(bestMarket.countryCode, userCountry, bestMarket.estimatedDelivery);
    const recommendation = this.getRecommendation(savingsPercentage, risks.length, bestMarket.riskLevel);
    const confidence = this.calculateConfidence(savingsPercentage, risks.length, bestMarket.riskLevel);

    return {
      bestMarket: {
        countryCode: bestMarket.countryCode,
        price: bestMarket.price,
        currency: bestMarket.currency,
        landedCost: bestMarket.landedCost,
        savings: bestSavings,
        savingsPercentage
      },
      localPrice,
      shippingDetails: {
        cost: bestMarket.landedCost - bestMarket.price,
        estimatedDays: bestMarket.estimatedDelivery,
        carrier: this.getPreferredCarrier(bestMarket.countryCode, userCountry)
      },
      taxAndDuty: {
        taxAmount: 0, // Simplified for mock
        dutyAmount: 0,
        totalFees: bestMarket.landedCost - bestMarket.price
      },
      risks,
      recommendation,
      confidence
    };
  }

  private calculateShippingCost(price: number, fromCountry: string, toCountry: string): number {
    if (fromCountry === toCountry) return 0;
    
    const baseRate = 15; // Base international shipping
    const priceMultiplier = Math.min(price * 0.05, 50); // 5% of price, max $50
    const distanceMultiplier = this.getDistanceMultiplier(fromCountry, toCountry);
    
    return baseRate + priceMultiplier + distanceMultiplier;
  }

  private getTaxRate(country: string): number {
    const taxRates: { [country: string]: number } = {
      'US': 0.08,   // Average state tax
      'EU': 0.20,   // Average VAT
      'UK': 0.20,   // VAT
      'JP': 0.10,   // Consumption tax
      'CA': 0.13,   // Average GST/PST
      'AU': 0.10    // GST
    };
    return taxRates[country] || 0.15;
  }

  private getDutyRate(category: string, fromCountry: string, toCountry: string): number {
    if (fromCountry === toCountry) return 0;
    
    const dutyRates: { [category: string]: number } = {
      'electronics': 0.05,
      'clothing': 0.12,
      'jewelry': 0.15,
      'books': 0.0,
      'tools': 0.08
    };
    
    return dutyRates[category] || 0.10;
  }

  private getDutyThreshold(country: string): number {
    const thresholds: { [country: string]: number } = {
      'US': 800,    // De minimis threshold
      'EU': 150,
      'UK': 135,
      'CA': 20,
      'AU': 1000
    };
    return thresholds[country] || 200;
  }

  private calculateHandlingFees(price: number): number {
    return Math.min(price * 0.02, 25); // 2% handling fee, max $25
  }

  private getEstimatedDelivery(fromCountry: string, toCountry: string): number {
    if (fromCountry === toCountry) return 1;
    
    const deliveryTimes: { [route: string]: number } = {
      'US-EU': 7, 'EU-US': 7,
      'US-JP': 10, 'JP-US': 10,
      'US-UK': 5, 'UK-US': 5,
      'EU-JP': 12, 'JP-EU': 12
    };
    
    const route = `${fromCountry}-${toCountry}`;
    return deliveryTimes[route] || 14; // Default 2 weeks
  }

  private getMarketCurrency(country: string): string {
    const currencies: { [country: string]: string } = {
      'US': 'USD', 'EU': 'EUR', 'UK': 'GBP', 
      'JP': 'JPY', 'CA': 'CAD', 'AU': 'AUD',
      'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR'
    };
    return currencies[country] || 'USD';
  }

  private getDistanceMultiplier(fromCountry: string, toCountry: string): number {
    // Simplified distance-based shipping cost
    const distanceMap: { [route: string]: number } = {
      'US-EU': 20, 'EU-US': 20,
      'US-JP': 25, 'JP-US': 25,
      'US-AU': 30, 'AU-US': 30
    };
    
    const route = `${fromCountry}-${toCountry}`;
    return distanceMap[route] || 15;
  }

  private getPreferredCarrier(fromCountry: string, toCountry: string): string {
    return 'DHL Express'; // Simplified
  }

  private assessRiskLevel(fromCountry: string, toCountry: string, landedCost: number): 'low' | 'medium' | 'high' {
    const deliveryTime = this.getEstimatedDelivery(fromCountry, toCountry);
    
    if (deliveryTime <= 5 && landedCost < 500) return 'low';
    if (deliveryTime <= 10 && landedCost < 1000) return 'medium';
    return 'high';
  }

  private assessRisks(fromCountry: string, toCountry: string, deliveryTime: number): string[] {
    const risks: string[] = [];
    
    if (deliveryTime > 14) {
      risks.push('Long delivery time may delay receipt');
    }
    
    if (fromCountry !== 'US' && fromCountry !== 'EU') {
      risks.push('Potential customs delays');
    }
    
    risks.push('Exchange rate fluctuation risk');
    risks.push('International return/warranty complications');
    
    return risks;
  }

  private getRecommendation(
    savingsPercentage: number, 
    riskCount: number, 
    riskLevel: string
  ): 'buy_international' | 'buy_local' | 'wait' {
    if (savingsPercentage >= 25 && riskLevel === 'low') return 'buy_international';
    if (savingsPercentage >= 15 && riskLevel === 'medium' && riskCount <= 2) return 'buy_international';
    if (savingsPercentage < 10 || riskLevel === 'high') return 'buy_local';
    return 'wait';
  }

  private calculateConfidence(savingsPercentage: number, riskCount: number, riskLevel: string): number {
    let confidence = 100;
    
    confidence -= riskCount * 10; // Reduce by 10% per risk
    
    if (riskLevel === 'medium') confidence -= 10;
    if (riskLevel === 'high') confidence -= 25;
    
    if (savingsPercentage < 15) confidence -= 20;
    
    return Math.max(0, confidence);
  }

  private generateMockPriceHistory(days: number): Array<{ date: string; price: number; landedCost: number }> {
    const history: Array<{ date: string; price: number; landedCost: number }> = [];
    const basePrice = 100;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% daily variation
      const price = basePrice * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0]!,
        price,
        landedCost: price * 1.2 // Mock 20% overhead
      });
    }
    
    return history;
  }

  private analyzeTrend(history: Array<{ price: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const firstPrice = history[0]!.price;
    const lastPrice = history[history.length - 1]!.price;
    const change = (lastPrice - firstPrice) / firstPrice;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateVolatility(history: Array<{ price: number }>): number {
    if (history.length < 2) return 0;
    
    const prices = history.map(h => h.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private predictOptimalBuyTime(trends: any): any {
    // Simplified prediction - in production, use ML models
    const markets = Object.keys(trends);
    const randomMarket = markets[Math.floor(Math.random() * markets.length)];
    
    return {
      market: randomMarket,
      estimatedOptimalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expectedPrice: 95, // Mock predicted price
      confidence: 75
    };
  }
}

export const globalArbitrageService = new GlobalArbitrageService(); 