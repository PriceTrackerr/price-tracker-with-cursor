import axios from 'axios';

export interface EbayProduct {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  conditionDescription?: string;
  seller: {
    username: string;
    feedbackPercentage: number;
    feedbackScore: number;
  };
  shipping: {
    cost: number;
    type: string;
  };
  location: {
    country: string;
    postalCode?: string;
  };
  returnPolicy?: {
    returnsAccepted: boolean;
    returnPeriod: string;
  };
}

export class EbayService {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private baseUrl = 'https://api.ebay.com';

  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID || '';
    this.clientSecret = process.env.EBAY_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new token (FREE - no limits on auth tokens)
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/identity/v1/oauth2/token`,
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get eBay access token:', error);
      throw new Error('eBay authentication failed');
    }
  }

  async searchProducts(query: string, limit = 10): Promise<EbayProduct[]> {
    try {
      const token = await this.getAccessToken();
      
      // Use eBay Browse API (5,000 calls/day FREE)
      const response = await axios.get(
        `${this.baseUrl}/buy/browse/v1/item_summary/search`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          },
          params: {
            q: query,
            limit: limit,
            filter: 'buyingOptions:{FIXED_PRICE}', // Only fixed price items
            sort: 'price' // Sort by price ascending
          }
        }
      );

      return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
    } catch (error) {
      console.error('eBay search failed:', error);
      return [];
    }
  }

  async searchProductsInMarketplace(query: string, marketplaceId: string, limit = 10): Promise<EbayProduct[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${this.baseUrl}/buy/browse/v1/item_summary/search`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': marketplaceId
          },
          params: {
            q: query,
            limit,
            filter: 'buyingOptions:{FIXED_PRICE}',
            sort: 'price'
          }
        }
      );

      return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
    } catch (error) {
      console.error(`eBay search failed for ${marketplaceId}:`, error);
      return [];
    }
  }

  async getProductDetails(itemId: string): Promise<EbayProduct | null> {
    try {
      const token = await this.getAccessToken();
      
      // Get detailed item information (FREE)
      const response = await axios.get(
        `${this.baseUrl}/buy/browse/v1/item/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          }
        }
      );

      return this.mapToEbayProduct(response.data);
    } catch (error) {
      console.error('Failed to get eBay product details:', error);
      return null;
    }
  }

  async getConditionAnalysis(itemId: string): Promise<{
    condition: string;
    conditionScore: number;
    sellerTrustScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    returnPolicy: any;
  } | null> {
    try {
      const product = await this.getProductDetails(itemId);
      if (!product) return null;

      // Analyze condition based on eBay data
      const conditionScore = this.calculateConditionScore(product);
      const sellerTrustScore = this.calculateSellerTrustScore(product);
      const riskLevel = this.calculateRiskLevel(conditionScore, sellerTrustScore);

      return {
        condition: product.condition,
        conditionScore,
        sellerTrustScore,
        riskLevel,
        returnPolicy: product.returnPolicy
      };
    } catch (error) {
      console.error('Failed to analyze eBay condition:', error);
      return null;
    }
  }

  private calculateConditionScore(product: EbayProduct): number {
    let score = 50; // Base score

    // Condition mapping
    const conditionScores = {
      'New': 95,
      'New with tags': 95,
      'New without tags': 90,
      'New with defects': 75,
      'Manufacturer refurbished': 85,
      'Seller refurbished': 75,
      'Used': 60,
      'Very Good': 80,
      'Good': 65,
      'Acceptable': 45,
      'For parts or not working': 10
    };

    score = conditionScores[product.condition as keyof typeof conditionScores] || score;

    // Adjust based on condition description
    if (product.conditionDescription) {
      const desc = product.conditionDescription.toLowerCase();
      if (desc.includes('like new')) score += 10;
      if (desc.includes('minor')) score -= 5;
      if (desc.includes('significant') || desc.includes('major')) score -= 15;
      if (desc.includes('damage')) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateSellerTrustScore(product: EbayProduct): number {
    let score = 50;

    // Feedback percentage
    if (product.seller.feedbackPercentage >= 99.5) score += 25;
    else if (product.seller.feedbackPercentage >= 98) score += 15;
    else if (product.seller.feedbackPercentage >= 95) score += 5;
    else if (product.seller.feedbackPercentage < 90) score -= 30;

    // Feedback score (number of reviews)
    if (product.seller.feedbackScore >= 10000) score += 15;
    else if (product.seller.feedbackScore >= 1000) score += 10;
    else if (product.seller.feedbackScore >= 100) score += 5;
    else if (product.seller.feedbackScore < 10) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(conditionScore: number, sellerScore: number): 'low' | 'medium' | 'high' {
    const averageScore = (conditionScore + sellerScore) / 2;
    
    if (averageScore >= 80) return 'low';
    if (averageScore >= 60) return 'medium';
    return 'high';
  }

  private mapToEbayProduct(item: any): EbayProduct {
    return {
      itemId: item.itemId,
      title: item.title,
      price: parseFloat(item.price?.value || '0'),
      currency: item.price?.currency || 'USD',
      condition: item.condition || 'Unknown',
      conditionDescription: item.conditionDescription,
      seller: {
        username: item.seller?.username || '',
        feedbackPercentage: parseFloat(item.seller?.feedbackPercentage || '0'),
        feedbackScore: parseInt(item.seller?.feedbackScore || '0')
      },
      shipping: {
        cost: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || '0'),
        type: item.shippingOptions?.[0]?.shippingCostType || 'FIXED'
      },
      location: {
        country: item.itemLocation?.country || 'US',
        postalCode: item.itemLocation?.postalCode
      },
      returnPolicy: item.returnTerms ? {
        returnsAccepted: item.returnTerms.returnsAccepted,
        returnPeriod: item.returnTerms.returnPeriod?.value + ' ' + item.returnTerms.returnPeriod?.unit
      } : undefined
    };
  }

  // Get used/refurbished alternatives for a product
  async getUsedAlternatives(productTitle: string): Promise<EbayProduct[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/buy/browse/v1/item_summary/search`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
          },
          params: {
            q: productTitle,
            limit: 20,
            filter: 'conditions:{USED|MANUFACTURER_REFURBISHED|SELLER_REFURBISHED}',
            sort: 'price'
          }
        }
      );

      return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
    } catch (error) {
      console.error('Failed to get eBay used alternatives:', error);
      return [];
    }
  }
}

export default EbayService; 