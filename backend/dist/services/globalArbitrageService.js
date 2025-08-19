"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalArbitrageService = exports.GlobalArbitrageService = void 0;
class GlobalArbitrageService {
    constructor() {
        this.supportedMarkets = ['US', 'EU', 'UK', 'JP', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES'];
        this.exchangeRateApi = 'https://api.exchangerate-api.com/v4/latest/';
        this.exchangeRates = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.73,
            'JPY': 110.0,
            'CAD': 1.25,
            'AUD': 1.35,
        };
    }
    async findArbitrageOpportunities(product, userCountry = 'US') {
        const marketData = await this.fetchGlobalPrices(product);
        const marketsWithLandedCosts = await this.calculateLandedCosts(marketData, userCountry);
        const bestDeal = this.findBestArbitrageDeal(marketsWithLandedCosts, userCountry);
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
    async calculateLandedCost(basePrice, fromCountry, toCountry, productCategory = 'electronics') {
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
    async trackGlobalPriceTrends(productId, days = 30) {
        const trends = {};
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
    async fetchGlobalPrices(product) {
        const mockData = {
            productId: product.id,
            markets: {},
            bestDeal: {
                countryCode: 'US',
                savings: 0,
                landedCost: product.price
            },
            updatedAt: new Date().toISOString()
        };
        for (const market of this.supportedMarkets) {
            const basePrice = product.price;
            const priceVariation = (Math.random() - 0.5) * 0.3;
            const marketPrice = basePrice * (1 + priceVariation);
            mockData.markets[market] = {
                price: marketPrice,
                currency: this.getMarketCurrency(market),
                platform: product.platform,
                url: `${product.url}?market=${market}`,
                inStock: Math.random() > 0.1,
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
                landedCost: 0,
                lastUpdated: new Date().toISOString()
            };
        }
        return mockData;
    }
    async calculateLandedCosts(marketData, userCountry) {
        const result = {};
        for (const [country, data] of Object.entries(marketData.markets)) {
            if (country === userCountry) {
                result[country] = {
                    price: data.price,
                    currency: data.currency,
                    landedCost: data.price,
                    availability: data.inStock ? 'in_stock' : 'out_of_stock',
                    estimatedDelivery: 1,
                    riskLevel: 'low'
                };
            }
            else {
                const landedCostData = await this.calculateLandedCost(data.price, country, userCountry, 'electronics');
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
    findBestArbitrageDeal(markets, userCountry) {
        const localPrice = markets[userCountry]?.landedCost || Infinity;
        let bestMarket = null;
        let bestSavings = 0;
        for (const [country, data] of Object.entries(markets)) {
            const marketData = data;
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
                taxAmount: 0,
                dutyAmount: 0,
                totalFees: bestMarket.landedCost - bestMarket.price
            },
            risks,
            recommendation,
            confidence
        };
    }
    calculateShippingCost(price, fromCountry, toCountry) {
        if (fromCountry === toCountry)
            return 0;
        const baseRate = 15;
        const priceMultiplier = Math.min(price * 0.05, 50);
        const distanceMultiplier = this.getDistanceMultiplier(fromCountry, toCountry);
        return baseRate + priceMultiplier + distanceMultiplier;
    }
    getTaxRate(country) {
        const taxRates = {
            'US': 0.08,
            'EU': 0.20,
            'UK': 0.20,
            'JP': 0.10,
            'CA': 0.13,
            'AU': 0.10
        };
        return taxRates[country] || 0.15;
    }
    getDutyRate(category, fromCountry, toCountry) {
        if (fromCountry === toCountry)
            return 0;
        const dutyRates = {
            'electronics': 0.05,
            'clothing': 0.12,
            'jewelry': 0.15,
            'books': 0.0,
            'tools': 0.08
        };
        return dutyRates[category] || 0.10;
    }
    getDutyThreshold(country) {
        const thresholds = {
            'US': 800,
            'EU': 150,
            'UK': 135,
            'CA': 20,
            'AU': 1000
        };
        return thresholds[country] || 200;
    }
    calculateHandlingFees(price) {
        return Math.min(price * 0.02, 25);
    }
    getEstimatedDelivery(fromCountry, toCountry) {
        if (fromCountry === toCountry)
            return 1;
        const deliveryTimes = {
            'US-EU': 7, 'EU-US': 7,
            'US-JP': 10, 'JP-US': 10,
            'US-UK': 5, 'UK-US': 5,
            'EU-JP': 12, 'JP-EU': 12
        };
        const route = `${fromCountry}-${toCountry}`;
        return deliveryTimes[route] || 14;
    }
    getMarketCurrency(country) {
        const currencies = {
            'US': 'USD', 'EU': 'EUR', 'UK': 'GBP',
            'JP': 'JPY', 'CA': 'CAD', 'AU': 'AUD',
            'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR'
        };
        return currencies[country] || 'USD';
    }
    getDistanceMultiplier(fromCountry, toCountry) {
        const distanceMap = {
            'US-EU': 20, 'EU-US': 20,
            'US-JP': 25, 'JP-US': 25,
            'US-AU': 30, 'AU-US': 30
        };
        const route = `${fromCountry}-${toCountry}`;
        return distanceMap[route] || 15;
    }
    getPreferredCarrier(fromCountry, toCountry) {
        return 'DHL Express';
    }
    assessRiskLevel(fromCountry, toCountry, landedCost) {
        const deliveryTime = this.getEstimatedDelivery(fromCountry, toCountry);
        if (deliveryTime <= 5 && landedCost < 500)
            return 'low';
        if (deliveryTime <= 10 && landedCost < 1000)
            return 'medium';
        return 'high';
    }
    assessRisks(fromCountry, toCountry, deliveryTime) {
        const risks = [];
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
    getRecommendation(savingsPercentage, riskCount, riskLevel) {
        if (savingsPercentage >= 25 && riskLevel === 'low')
            return 'buy_international';
        if (savingsPercentage >= 15 && riskLevel === 'medium' && riskCount <= 2)
            return 'buy_international';
        if (savingsPercentage < 10 || riskLevel === 'high')
            return 'buy_local';
        return 'wait';
    }
    calculateConfidence(savingsPercentage, riskCount, riskLevel) {
        let confidence = 100;
        confidence -= riskCount * 10;
        if (riskLevel === 'medium')
            confidence -= 10;
        if (riskLevel === 'high')
            confidence -= 25;
        if (savingsPercentage < 15)
            confidence -= 20;
        return Math.max(0, confidence);
    }
    generateMockPriceHistory(days) {
        const history = [];
        const basePrice = 100;
        for (let i = days; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const variation = (Math.random() - 0.5) * 0.1;
            const price = basePrice * (1 + variation);
            history.push({
                date: date.toISOString().split('T')[0],
                price,
                landedCost: price * 1.2
            });
        }
        return history;
    }
    analyzeTrend(history) {
        if (history.length < 2)
            return 'stable';
        const firstPrice = history[0].price;
        const lastPrice = history[history.length - 1].price;
        const change = (lastPrice - firstPrice) / firstPrice;
        if (change > 0.05)
            return 'increasing';
        if (change < -0.05)
            return 'decreasing';
        return 'stable';
    }
    calculateVolatility(history) {
        if (history.length < 2)
            return 0;
        const prices = history.map(h => h.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        return Math.sqrt(variance) / mean;
    }
    predictOptimalBuyTime(trends) {
        const markets = Object.keys(trends);
        const randomMarket = markets[Math.floor(Math.random() * markets.length)];
        return {
            market: randomMarket,
            estimatedOptimalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expectedPrice: 95,
            confidence: 75
        };
    }
}
exports.GlobalArbitrageService = GlobalArbitrageService;
exports.globalArbitrageService = new GlobalArbitrageService();
//# sourceMappingURL=globalArbitrageService.js.map