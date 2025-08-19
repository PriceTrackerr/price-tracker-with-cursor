import { Product, PriceGuarantee } from '../config/storage';
import EmailService from './emailService';

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

export class PriceGuaranteeService {
  private readonly retailerPolicies: RetailerPolicy[] = [
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

  /**
   * Analyze all available price guarantees for a product
   */
  public async analyzeGuarantees(
    product: Product,
    purchaseDate?: string,
    purchaseRetailer?: string
  ): Promise<GuaranteeAnalysis> {
    const eligiblePolicies = this.getEligiblePolicies(product, purchaseRetailer);
    const eligibleGuarantees: PriceGuarantee[] = [];

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

  /**
   * Monitor price guarantees and send alerts when claims become available
   */
  public async monitorGuarantees(productIds: string[]): Promise<void> {
    for (const productId of productIds) {
      // This would run as a scheduled job
      await this.checkGuaranteeOpportunities(productId);
    }
  }

  /**
   * Auto-generate claim documentation
   */
  public async generateClaimDocumentation(
    product: Product,
    guarantee: PriceGuarantee,
    competitorPrice: number,
    competitorUrl: string
  ): Promise<{
    claimForm: any;
    supportingDocuments: string[];
    submissionInstructions: string[];
  }> {
    const policy = this.retailerPolicies.find(p => p.retailer === guarantee.retailer);
    if (!policy) {
      throw new Error('Retailer policy not found');
    }

    // Generate claim form data
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

    // Generate supporting documents
    const supportingDocuments = [
      `Product screenshot: ${product.imageUrl}`,
      `Competitor price screenshot: ${competitorUrl}`,
      `Price difference calculation: $${(product.price - competitorPrice).toFixed(2)}`,
      `Policy reference: ${policy.claimUrl}`
    ];

    // Generate submission instructions
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

  /**
   * Track claim success rates and optimize recommendations
   */
  public async trackClaimResult(
    guaranteeId: string,
    result: 'approved' | 'denied' | 'pending',
    amountRecovered?: number,
    notes?: string
  ): Promise<void> {
    // Update guarantee status and track analytics
    console.log(`Claim ${guaranteeId} result: ${result}`);
    if (amountRecovered) {
      console.log(`Amount recovered: $${amountRecovered}`);
    }
    
    // In production, this would update database and analytics
    await this.updateGuaranteeTracking(guaranteeId, result, amountRecovered, notes);
  }

  private getEligiblePolicies(product: Product, purchaseRetailer?: string): RetailerPolicy[] {
    return this.retailerPolicies.filter(policy => {
      // If we know where it was purchased, prioritize that retailer's policies
      if (purchaseRetailer && policy.retailer.toLowerCase() === purchaseRetailer.toLowerCase()) {
        return true;
      }
      
      // For price matching, check if product is available at the retailer
      if (policy.policyType === 'price_match') {
        return this.isProductAvailableAtRetailer(product, policy.retailer);
      }
      
      return true;
    });
  }

  private async createGuarantee(
    product: Product,
    policy: RetailerPolicy,
    purchaseDate?: string
  ): Promise<PriceGuarantee> {
    const eligibleUntil = purchaseDate 
      ? new Date(new Date(purchaseDate).getTime() + policy.windowDays * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + policy.windowDays * 24 * 60 * 60 * 1000).toISOString();

    // Find current best competitor price
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

  private findBestGuarantee(guarantees: PriceGuarantee[]): PriceGuarantee | null {
    if (guarantees.length === 0) return null;
    
    return guarantees.reduce((best, current) => {
      const bestAmount = best.claimableAmount || 0;
      const currentAmount = current.claimableAmount || 0;
      
      if (currentAmount > bestAmount) return current;
      if (currentAmount === bestAmount) {
        // Prefer policies with higher success rates
        const bestPolicy = this.retailerPolicies.find(p => p.retailer === best.retailer);
        const currentPolicy = this.retailerPolicies.find(p => p.retailer === current.retailer);
        
        if (currentPolicy && bestPolicy && currentPolicy.successRate > bestPolicy.successRate) {
          return current;
        }
      }
      
      return best;
    });
  }

  private async generateDocumentation(
    product: Product,
    guarantee: PriceGuarantee | null
  ): Promise<{ screenshots: string[]; priceProof: string[]; purchaseProof: string[] }> {
    // Mock implementation - in production, this would generate actual screenshots
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

  private generateNextSteps(
    bestGuarantee: PriceGuarantee | null,
    allGuarantees: PriceGuarantee[]
  ): string[] {
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

  private async checkGuaranteeOpportunities(productId: string): Promise<void> {
    // This would be called by a cron job to monitor price changes
    // and alert users when new guarantee opportunities arise
    console.log(`Checking guarantee opportunities for product ${productId}`);
  }

  private async updateGuaranteeTracking(
    guaranteeId: string,
    result: string,
    amount?: number,
    notes?: string
  ): Promise<void> {
    // Track success rates, amounts recovered, and optimize future recommendations
    console.log(`Updating guarantee tracking: ${guaranteeId} - ${result}`);
  }

  private isProductAvailableAtRetailer(product: Product, retailer: string): boolean {
    // Mock implementation - in production, check if product is available at retailer
    return Math.random() > 0.3; // 70% chance available
  }

  private async findBestCompetitorPrice(product: Product, excludeRetailer: string): Promise<number | null> {
    // Mock implementation - in production, scrape competitor prices
    const variation = (Math.random() - 0.5) * 0.2; // ±10% price variation
    return product.price * (1 + variation);
  }

  /**
   * Send automated price guarantee alerts
   */
  public async sendGuaranteeAlert(
    userEmail: string,
    product: Product,
    guarantee: PriceGuarantee
  ): Promise<void> {
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

    // In production, send actual email
    console.log(`Sending guarantee alert to ${userEmail}: ${subject}`);
  }
}

export const priceGuaranteeService = new PriceGuaranteeService(); 