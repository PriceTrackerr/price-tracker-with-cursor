"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceGuaranteeService = exports.PriceGuaranteeService = void 0;
class PriceGuaranteeService {
    constructor() {
        this.retailerPolicies = [
            {
                retailer: 'Amazon',
                policyType: 'price_protection',
                windowDays: 30,
                maxClaimAmount: 1000,
                requirements: [
                    'Must be sold and shipped by Amazon',
                    'Product must be identical (same model, color, size)',
                    'Lower price must be from authorized retailer',
                    'No lightning deals or limited-time offers'
                ],
                exclusions: ['Digital content', 'Gift cards', 'Subscriptions'],
                claimUrl: 'https://www.amazon.com/contact-us',
                documentationRequired: ['Order confirmation', 'Competitor price screenshot', 'Product page URL'],
                processingTime: '1-3 business days',
                successRate: 78
            },
            {
                retailer: 'Best Buy',
                policyType: 'price_match',
                windowDays: 15,
                requirements: [
                    'Product must be in stock at both retailers',
                    'Identical model numbers',
                    'Competitor must be authorized retailer',
                    'Price must include shipping and taxes'
                ],
                exclusions: ['Marketplace sellers', 'Auction sites', 'Club memberships required'],
                claimUrl: 'https://www.bestbuy.com/site/help-topics/price-match-guarantee',
                documentationRequired: ['Product page screenshot', 'Current availability proof'],
                processingTime: 'Immediate at store, 1-2 days online',
                successRate: 85
            },
            {
                retailer: 'Target',
                policyType: 'price_match',
                windowDays: 14,
                requirements: [
                    'Item must be identical',
                    'Competitor must have item in stock',
                    'Price difference must be significant',
                    'No shipping costs if online price match'
                ],
                exclusions: ['Clearance items', 'Marketplace sellers', 'Daily deals'],
                claimUrl: 'https://help.target.com/help/subcategoryarticle?childcat=Price+Match+Guarantee',
                documentationRequired: ['Competitor URL', 'Product comparison'],
                processingTime: 'Immediate in-store',
                successRate: 82
            },
            {
                retailer: 'Walmart',
                policyType: 'price_match',
                windowDays: 7,
                requirements: [
                    'Identical items only',
                    'Must be in stock online',
                    'Excludes shipping costs',
                    'Must be current advertised price'
                ],
                exclusions: ['Marketplace items', 'Auction sites', 'Membership prices'],
                claimUrl: 'https://help.walmart.com/app/answers/detail/a_id/31/',
                documentationRequired: ['Competitor advertisement', 'Item comparison'],
                processingTime: 'Immediate online and in-store',
                successRate: 79
            },
            {
                retailer: 'Costco',
                policyType: 'price_protection',
                windowDays: 30,
                requirements: [
                    'Must have Costco membership',
                    'Product must be available at both locations',
                    'Price difference minimum $10',
                    'Must be identical item'
                ],
                exclusions: ['Special orders', 'Custom items', 'Services'],
                claimUrl: 'https://customerservice.costco.com/',
                documentationRequired: ['Receipt', 'Competitor price proof', 'Membership verification'],
                processingTime: '3-5 business days',
                successRate: 88
            }
        ];
    }
    async analyzeGuarantees(product, purchaseDate, purchaseRetailer) {
        const eligiblePolicies = this.getEligiblePolicies(product, purchaseRetailer);
        const eligibleGuarantees = [];
        for (const policy of eligiblePolicies) {
            const guarantee = await this.createGuarantee(product, policy, purchaseDate);
            if (guarantee.isClaimable) {
                eligibleGuarantees.push(guarantee);
            }
        }
        const claimableAmount = eligibleGuarantees.reduce((sum, g) => sum + (g.claimableAmount || 0), 0);
        const bestGuarantee = this.findBestGuarantee(eligibleGuarantees);
        const documentation = await this.generateDocumentation(product, bestGuarantee);
        const nextSteps = this.generateNextSteps(bestGuarantee, eligibleGuarantees);
        return {
            eligibleGuarantees,
            claimableAmount,
            bestGuarantee,
            documentation,
            nextSteps
        };
    }
    async monitorGuarantees(productIds) {
        for (const productId of productIds) {
            await this.checkGuaranteeOpportunities(productId);
        }
    }
    async generateClaimDocumentation(product, guarantee, competitorPrice, competitorUrl) {
        const policy = this.retailerPolicies.find(p => p.retailer === guarantee.retailer);
        if (!policy) {
            throw new Error('Retailer policy not found');
        }
        const claimForm = {
            retailer: guarantee.retailer,
            productTitle: product.title,
            productUrl: product.url,
            originalPrice: product.price,
            competitorPrice,
            competitorUrl,
            claimAmount: product.price - competitorPrice,
            purchaseDate: guarantee.purchaseDate,
            claimDate: new Date().toISOString(),
            policyType: guarantee.policyType
        };
        const supportingDocuments = [
            `Product screenshot: ${product.imageUrl}`,
            `Competitor price screenshot: ${competitorUrl}`,
            `Price difference calculation: $${(product.price - competitorPrice).toFixed(2)}`,
            `Policy reference: ${policy.claimUrl}`
        ];
        const submissionInstructions = [
            `1. Visit ${policy.claimUrl}`,
            `2. Select "${guarantee.policyType.replace('_', ' ')}" option`,
            `3. Upload required documentation: ${policy.documentationRequired.join(', ')}`,
            `4. Submit claim within ${policy.windowDays} days of purchase`,
            `5. Expected processing time: ${policy.processingTime}`,
            `6. Success rate for this retailer: ${policy.successRate}%`
        ];
        return {
            claimForm,
            supportingDocuments,
            submissionInstructions
        };
    }
    async trackClaimResult(guaranteeId, result, amountRecovered, notes) {
        console.log(`Claim ${guaranteeId} result: ${result}`);
        if (amountRecovered) {
            console.log(`Amount recovered: $${amountRecovered}`);
        }
        await this.updateGuaranteeTracking(guaranteeId, result, amountRecovered, notes);
    }
    getEligiblePolicies(product, purchaseRetailer) {
        return this.retailerPolicies.filter(policy => {
            if (purchaseRetailer && policy.retailer.toLowerCase() === purchaseRetailer.toLowerCase()) {
                return true;
            }
            if (policy.policyType === 'price_match') {
                return this.isProductAvailableAtRetailer(product, policy.retailer);
            }
            return true;
        });
    }
    async createGuarantee(product, policy, purchaseDate) {
        const eligibleUntil = purchaseDate
            ? new Date(new Date(purchaseDate).getTime() + policy.windowDays * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + policy.windowDays * 24 * 60 * 60 * 1000).toISOString();
        const competitorPrice = await this.findBestCompetitorPrice(product, policy.retailer);
        const claimableAmount = competitorPrice ? Math.max(0, product.price - competitorPrice) : 0;
        const isClaimable = claimableAmount > 0 &&
            new Date(eligibleUntil) > new Date() &&
            claimableAmount >= (policy.maxClaimAmount ? Math.min(10, policy.maxClaimAmount * 0.1) : 10);
        return {
            id: `guarantee-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            retailer: policy.retailer,
            policyType: policy.policyType,
            windowDays: policy.windowDays,
            purchaseDate,
            eligibleUntil,
            claimableAmount,
            isClaimable,
            claimUrl: policy.claimUrl,
            requirements: policy.requirements,
            status: isClaimable ? 'eligible' : 'ineligible'
        };
    }
    findBestGuarantee(guarantees) {
        if (guarantees.length === 0)
            return null;
        return guarantees.reduce((best, current) => {
            const bestAmount = best.claimableAmount || 0;
            const currentAmount = current.claimableAmount || 0;
            if (currentAmount > bestAmount)
                return current;
            if (currentAmount === bestAmount) {
                const bestPolicy = this.retailerPolicies.find(p => p.retailer === best.retailer);
                const currentPolicy = this.retailerPolicies.find(p => p.retailer === current.retailer);
                if (currentPolicy && bestPolicy && currentPolicy.successRate > bestPolicy.successRate) {
                    return current;
                }
            }
            return best;
        });
    }
    async generateDocumentation(product, guarantee) {
        return {
            screenshots: [
                `${product.url}?timestamp=${Date.now()}`,
                `competitor-price-${product.id}.png`,
                `product-comparison-${product.id}.png`
            ],
            priceProof: [
                `price-history-${product.id}.json`,
                `competitor-prices-${product.id}.json`,
                `market-analysis-${product.id}.pdf`
            ],
            purchaseProof: [
                guarantee ? `receipt-${guarantee.retailer}-${product.id}.pdf` : '',
                guarantee ? `order-confirmation-${guarantee.id}.pdf` : ''
            ].filter(Boolean)
        };
    }
    generateNextSteps(bestGuarantee, allGuarantees) {
        if (!bestGuarantee) {
            return [
                'No eligible price guarantees found',
                'Consider purchasing from retailers with better price protection',
                'Monitor price drops for future guarantee opportunities'
            ];
        }
        const steps = [
            `Claim ${bestGuarantee.policyType.replace('_', ' ')} with ${bestGuarantee.retailer}`,
            `Potential recovery: $${(bestGuarantee.claimableAmount || 0).toFixed(2)}`,
            `Deadline: ${new Date(bestGuarantee.eligibleUntil || '').toLocaleDateString()}`,
            `Visit: ${bestGuarantee.claimUrl}`,
            `Required: ${bestGuarantee.requirements.slice(0, 2).join(', ')}`
        ];
        if (allGuarantees.length > 1) {
            steps.push(`Additional ${allGuarantees.length - 1} guarantee(s) available`);
        }
        return steps;
    }
    async checkGuaranteeOpportunities(productId) {
        console.log(`Checking guarantee opportunities for product ${productId}`);
    }
    async updateGuaranteeTracking(guaranteeId, result, amount, notes) {
        console.log(`Updating guarantee tracking: ${guaranteeId} - ${result}`);
    }
    isProductAvailableAtRetailer(product, retailer) {
        return Math.random() > 0.3;
    }
    async findBestCompetitorPrice(product, excludeRetailer) {
        const variation = (Math.random() - 0.5) * 0.2;
        return product.price * (1 + variation);
    }
    async sendGuaranteeAlert(userEmail, product, guarantee) {
        const subject = `💰 Price Guarantee Alert: Save $${(guarantee.claimableAmount || 0).toFixed(2)} on ${product.title}`;
        const emailBody = `
      <h2>Price Guarantee Opportunity!</h2>
      <p>Great news! You're eligible for a price guarantee claim:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${product.title}</h3>
        <p><strong>Retailer:</strong> ${guarantee.retailer}</p>
        <p><strong>Policy Type:</strong> ${guarantee.policyType.replace('_', ' ')}</p>
        <p><strong>Claimable Amount:</strong> $${(guarantee.claimableAmount || 0).toFixed(2)}</p>
        <p><strong>Deadline:</strong> ${new Date(guarantee.eligibleUntil || '').toLocaleDateString()}</p>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Visit: <a href="${guarantee.claimUrl}">${guarantee.claimUrl}</a></li>
        <li>Submit your claim with the required documentation</li>
        <li>Expect processing within ${this.retailerPolicies.find(p => p.retailer === guarantee.retailer)?.processingTime}</li>
      </ol>
      
      <p><em>Don't wait - this opportunity expires soon!</em></p>
    `;
        console.log(`Sending guarantee alert to ${userEmail}: ${subject}`);
    }
}
exports.PriceGuaranteeService = PriceGuaranteeService;
exports.priceGuaranteeService = new PriceGuaranteeService();
//# sourceMappingURL=priceGuaranteeService.js.map