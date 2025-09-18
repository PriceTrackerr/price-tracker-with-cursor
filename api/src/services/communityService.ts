import { Product, ExpertCurator, WatchlistShared, CommunityVote, DealComment } from '../config/storage';
import axios from 'axios';
import { getDb } from '../config/database';

const db = getDb();

export interface CredibilityAnalysis {
  score: number; // 0-100
  factors: {
    priceHistory: number;
    stockVelocity: number;
    communityTrust: number;
    dealAge: number;
    sellerReputation: number;
  };
  badges: string[];
  warnings: string[];
  recommendation: 'highly_trusted' | 'trusted' | 'caution' | 'avoid';
}

export interface SocialProof {
  communityRating: number;
  totalVotes: number;
  expertEndorsements: number;
  commentCount: number;
  sharesCount: number;
  trustScore: number;
}

export interface CuratorAnalytics {
  totalFollowers: number;
  averageSavings: number;
  successRate: number;
  specialtyCategories: string[];
  recentActivity: Array<{
    action: string;
    productTitle: string;
    date: string;
    savings: number;
  }>;
}

export class CommunityService {
  /**
   * Calculate deal credibility score
   */
  public async calculateCredibilityScore(product: Product): Promise<CredibilityAnalysis> {
    const factors = {
      priceHistory: await this.analyzePriceHistory(product),
      stockVelocity: await this.analyzeStockVelocity(product),
      communityTrust: await this.analyzeCommunityTrust(product),
      dealAge: this.analyzeDealAge(product),
      sellerReputation: this.analyzeSellerReputation(product)
    };

    const score = this.calculateOverallCredibility(factors);
    const badges = this.generateBadges(factors, score);
    const warnings = this.generateWarnings(factors, score);
    const recommendation = this.getCredibilityRecommendation(score, factors);

    return {
      score,
      factors,
      badges,
      warnings,
      recommendation
    };
  }

  /**
   * Get social proof metrics for a product
   */
  public async getSocialProof(productId: string): Promise<SocialProof> {
    // Base metrics from local community actions
    const votes = await this.getCommunityVotes(productId);
    const comments = await this.getDealComments(productId);
    const expertEndorsements = await this.getExpertEndorsements(productId);

    // Try to enrich with Reddit sentiment if credentials are present
    const redditClientId = process.env.REDDIT_CLIENT_ID;
    const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
    let redditBoost = 0;
    let redditMentions = 0;

    try {
      if (redditClientId && redditClientSecret) {
        const tokenRes = await axios.post(
          'https://www.reddit.com/api/v1/access_token',
          new URLSearchParams({ grant_type: 'client_credentials' }),
          {
            auth: { username: redditClientId, password: redditClientSecret },
            headers: { 'User-Agent': 'PriceTracker/1.0 (community sentiment)' }
          }
        );

        const accessToken = tokenRes.data?.access_token;
        if (accessToken) {
          const q = encodeURIComponent(await this.getProductQuery(productId));
          const subs = ['deals', 'DiscountedProducts', 'BuyItForLife', 'buildapcsales'];
          for (const sub of subs) {
            const res = await axios.get(`https://oauth.reddit.com/r/${sub}/search`, {
              headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'PriceTracker/1.0' },
              params: { q, restrict_sr: true, sort: 'new', limit: 10 }
            });
            const posts = res.data?.data?.children || [];
            redditMentions += posts.length;
            for (const p of posts) {
              const score = p.data?.score ?? 0;
              if (score > 20) redditBoost += 2;
              else if (score > 5) redditBoost += 1;
            }
          }
        }
      }
    } catch {
      // Ignore Reddit failures; keep local-only metrics
    }

    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    const totalVotes = upvotes + downvotes;

    // Base 0-5 rating from local votes, then boost slightly by Reddit chatter
    let communityRating = totalVotes > 0 ? (upvotes / Math.max(1, totalVotes)) * 5 : 0;
    communityRating = Math.min(5, communityRating + Math.min(1, redditBoost * 0.1));

    const trustScore = this.calculateTrustScore(upvotes + redditBoost, downvotes, expertEndorsements, comments.length + redditMentions);

    return {
      communityRating,
      totalVotes,
      expertEndorsements,
      commentCount: comments.length + redditMentions,
      sharesCount: await this.getSharesCount(productId),
      trustScore
    };
  }

  private async getProductQuery(productId: string): Promise<string> {
    try {
      const product = await db.getProductById(productId);
      if (product?.title) {
        // Use a shorter query to improve Reddit matching
        return product.title.split(' ').slice(0, 5).join(' ');
      }
      return productId;
    } catch {
      return productId;
    }
  }

  /**
   * Create or update expert curator profile
   */
  public async createExpertCurator(curatorData: Partial<ExpertCurator>): Promise<ExpertCurator> {
    const curator: ExpertCurator = {
      id: this.generateId(),
      name: curatorData.name || '',
      bio: curatorData.bio || '',
      specialties: curatorData.specialties || [],
      followerCount: 0,
      isVerified: false,
      credibilityScore: 50, // Starting score
      totalDealsShared: 0,
      averageSavings: 0,
      joinedAt: new Date().toISOString(),
      ...curatorData
    };

    // In production, this would save to database
    return curator;
  }

  /**
   * Create shared watchlist
   */
  public async createSharedWatchlist(
    creatorId: string,
    name: string,
    description: string,
    category: string,
    productIds: string[],
    isPublic: boolean = true
  ): Promise<WatchlistShared> {
    const watchlist: WatchlistShared = {
      id: this.generateId(),
      name,
      description,
      creatorId,
      creatorName: await this.getUserName(creatorId),
      isPublic,
      category,
      productIds,
      followerCount: 0,
      tags: this.extractTags(name + ' ' + description),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalProducts: productIds.length
    };

    // Calculate average savings
    watchlist.averageSavings = await this.calculateWatchlistSavings(productIds);

    return watchlist;
  }

  /**
   * Vote on a deal
   */
  public async voteDeal(
    userId: string,
    productId: string,
    voteType: 'upvote' | 'downvote',
    reason?: string
  ): Promise<CommunityVote> {
    // Check if user already voted
    const existingVote = await this.getUserVote(userId, productId);
    if (existingVote) {
      // Update existing vote
      existingVote.voteType = voteType;
      existingVote.reason = reason || '';
      return existingVote;
    }

    const vote: CommunityVote = {
      id: this.generateId(),
      userId,
      productId,
      voteType,
      reason: reason || '',
      createdAt: new Date().toISOString()
    };

    // In production, save to database
    return vote;
  }

  /**
   * Add comment to a deal
   */
  public async addDealComment(
    productId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ): Promise<DealComment> {
    const user = await this.getUser(userId);
    const comment: DealComment = {
      id: this.generateId(),
      productId,
      userId,
      userName: user?.name || 'Anonymous',
      content,
      upvotes: 0,
      downvotes: 0,
      isVerified: user?.isExpertCurator || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (parentCommentId) {
      // Handle reply logic
      const parentComment = await this.getComment(parentCommentId);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(comment);
      }
    }

    return comment;
  }

  /**
   * Get curator analytics
   */
  public async getCuratorAnalytics(curatorId: string): Promise<CuratorAnalytics> {
    const curator = await this.getCurator(curatorId);
    if (!curator) {
      throw new Error('Curator not found');
    }

    const recentActivity = await this.getCuratorRecentActivity(curatorId);
    const successRate = await this.calculateCuratorSuccessRate(curatorId);

    return {
      totalFollowers: curator.followerCount,
      averageSavings: curator.averageSavings,
      successRate,
      specialtyCategories: curator.specialties,
      recentActivity
    };
  }

  /**
   * Follow a curator
   */
  public async followCurator(userId: string, curatorId: string): Promise<boolean> {
    // In production, implement follow logic
    const curator = await this.getCurator(curatorId);
    if (curator) {
      curator.followerCount += 1;
      return true;
    }
    return false;
  }

  /**
   * Get trending deals based on community activity
   */
  public async getTrendingDeals(category?: string, timeWindow: number = 24): Promise<Array<{
    product: Product;
    trendingScore: number;
    socialProof: SocialProof;
    credibility: CredibilityAnalysis;
  }>> {
    const products = await this.getRecentDeals(category, timeWindow);
    const trendingDeals: Array<any> = [];

    for (const product of products) {
      const socialProof = await this.getSocialProof(product.id);
      const credibility = await this.calculateCredibilityScore(product);
      const trendingScore = this.calculateTrendingScore(socialProof, credibility, product);

      trendingDeals.push({
        product,
        trendingScore,
        socialProof,
        credibility
      });
    }

    return trendingDeals.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  private async analyzePriceHistory(product: Product): Promise<number> {
    // Analyze price history to detect legitimacy
    const history = await db.getPriceHistory(product.id);
    
    if (history.length < 2) return 30; // New product, lower confidence
    
    const priceDrops = history.filter((entry, index) => 
      index > 0 && entry.price < history[index - 1]!.price
    );
    
    const volatility = this.calculatePriceVolatility(history);
    
    // High volatility or frequent drops might indicate fake deals
    if (volatility > 0.3) return 20; // High volatility = suspicious
    if (priceDrops.length > history.length * 0.7) return 25; // Too many drops
    
    return Math.min(85, 50 + (history.length * 2)); // More history = higher score
  }

  private async analyzeStockVelocity(product: Product): Promise<number> {
    // Mock stock velocity analysis
    const velocity = product.stockVelocity || 0;
    
    if (velocity > 100) return 90; // High demand = legitimate
    if (velocity > 50) return 75;
    if (velocity > 10) return 60;
    if (velocity > 0) return 40;
    return 20; // No sales data
  }

  private async analyzeCommunityTrust(product: Product): Promise<number> {
    const socialProof = await this.getSocialProof(product.id);
    
    if (socialProof.totalVotes === 0) return 40; // No community input
    
    const positiveRatio = socialProof.communityRating / 5;
    const voteWeight = Math.min(socialProof.totalVotes / 50, 1); // Scale by participation
    
    return (positiveRatio * 80 + 20) * voteWeight;
  }

  private analyzeDealAge(product: Product): number {
    const ageInHours = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (ageInHours > 168) return 30; // Over a week old
    if (ageInHours > 72) return 50; // Over 3 days
    if (ageInHours > 24) return 70; // Over a day
    if (ageInHours > 12) return 85; // Half day
    return 95; // Very fresh
  }

  private analyzeSellerReputation(product: Product): number {
    const rating = product.sellerRating || 0;
    const reviewCount = product.sellerReviewCount || 0;
    
    if (reviewCount === 0) return 30; // No reviews
    if (rating >= 4.8 && reviewCount >= 1000) return 95;
    if (rating >= 4.5 && reviewCount >= 500) return 85;
    if (rating >= 4.0 && reviewCount >= 100) return 70;
    if (rating >= 3.5 && reviewCount >= 50) return 50;
    return 25; // Poor reputation
  }

  private calculateOverallCredibility(factors: any): number {
    const weights = {
      priceHistory: 0.25,
      stockVelocity: 0.20,
      communityTrust: 0.25,
      dealAge: 0.15,
      sellerReputation: 0.15
    };

    return Object.entries(factors).reduce((score, [key, value]) => {
      return score + ((value as number) * weights[key as keyof typeof weights]);
    }, 0);
  }

  private generateBadges(factors: any, score: number): string[] {
    const badges: string[] = [];
    
    if (score >= 90) badges.push('Highly Trusted Deal');
    if (factors.communityTrust >= 80) badges.push('Community Favorite');
    if (factors.stockVelocity >= 80) badges.push('Hot Deal');
    if (factors.sellerReputation >= 90) badges.push('Top Seller');
    if (factors.dealAge >= 85) badges.push('Fresh Deal');
    
    return badges;
  }

  private generateWarnings(factors: any, score: number): string[] {
    const warnings: string[] = [];
    
    if (score < 40) warnings.push('Low credibility - proceed with caution');
    if (factors.priceHistory < 30) warnings.push('Unusual price history detected');
    if (factors.sellerReputation < 40) warnings.push('Seller has poor reputation');
    if (factors.stockVelocity < 20) warnings.push('Low demand - verify deal legitimacy');
    
    return warnings;
  }

  private getCredibilityRecommendation(score: number, factors: any): 'highly_trusted' | 'trusted' | 'caution' | 'avoid' {
    if (score >= 80 && factors.sellerReputation >= 70) return 'highly_trusted';
    if (score >= 60) return 'trusted';
    if (score >= 40) return 'caution';
    return 'avoid';
  }

  private calculateTrustScore(upvotes: number, downvotes: number, expertEndorsements: number, comments: number): number {
    const totalVotes = upvotes + downvotes;
    if (totalVotes === 0) return 50; // Neutral when no votes
    
    const voteRatio = upvotes / totalVotes;
    const expertBonus = expertEndorsements * 10;
    const engagementBonus = Math.min(comments * 2, 20);
    
    return Math.min(100, (voteRatio * 70) + expertBonus + engagementBonus);
  }

  private calculateTrendingScore(socialProof: SocialProof, credibility: CredibilityAnalysis, product: Product): number {
    const recencyWeight = this.getRecencyWeight(product.createdAt);
    const socialWeight = (socialProof.trustScore / 100) * 40;
    const credibilityWeight = (credibility.score / 100) * 35;
    const engagementWeight = Math.min(socialProof.commentCount * 2, 25);
    
    return recencyWeight + socialWeight + credibilityWeight + engagementWeight;
  }

  private getRecencyWeight(createdAt: string): number {
    const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    
    if (ageInHours <= 1) return 25;
    if (ageInHours <= 6) return 20;
    if (ageInHours <= 24) return 15;
    if (ageInHours <= 72) return 10;
    return 5;
  }

  private calculatePriceVolatility(history: Array<{ price: number }>): number {
    if (history.length < 2) return 0;
    
    const prices = history.map(h => h.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction from text
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3).slice(0, 5);
  }

  // Mock helper methods - in production, these would query the database
  private async getCommunityVotes(productId: string): Promise<CommunityVote[]> {
    // Generate varied mock votes based on product ID
    const voteCount = Math.floor(Math.random() * 200) + 50; // 50-250 votes
    const votes: CommunityVote[] = [];
    
    for (let i = 0; i < voteCount; i++) {
      votes.push({
        id: this.generateId(),
        userId: `user_${i}`,
        productId,
        voteType: Math.random() > 0.3 ? 'upvote' : 'downvote', // 70% upvotes
        reason: '',
        createdAt: new Date().toISOString()
      });
    }
    
    return votes;
  }

  private async getDealComments(productId: string): Promise<DealComment[]> {
    // Generate varied mock comments based on product ID
    const commentCount = Math.floor(Math.random() * 50) + 10; // 10-60 comments
    const comments: DealComment[] = [];
    
    for (let i = 0; i < commentCount; i++) {
      comments.push({
        id: this.generateId(),
        productId,
        userId: `user_${i}`,
        userName: `User${i}`,
        content: `Comment ${i + 1}`,
        upvotes: Math.floor(Math.random() * 20),
        downvotes: Math.floor(Math.random() * 5),
        isVerified: Math.random() > 0.9, // 10% chance of being verified
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return comments;
  }

  private async getExpertEndorsements(productId: string): Promise<number> {
    // Generate varied expert endorsements based on product ID
    return Math.floor(Math.random() * 5) + 1; // 1-6 endorsements
  }

  private async getSharesCount(productId: string): Promise<number> {
    // Generate varied share count based on product ID
    return Math.floor(Math.random() * 100) + 20; // 20-120 shares
  }

  private async getUserVote(userId: string, productId: string): Promise<CommunityVote | null> {
    return null; // Mock implementation
  }

  private async getUser(userId: string): Promise<any> {
    return { name: 'Mock User', isExpertCurator: false }; // Mock implementation
  }

  private async getComment(commentId: string): Promise<DealComment | null> {
    return null; // Mock implementation
  }

  private async getCurator(curatorId: string): Promise<ExpertCurator | null> {
    return null; // Mock implementation
  }

  private async getUserName(userId: string): Promise<string> {
    return 'Mock User'; // Mock implementation
  }

  private async calculateWatchlistSavings(productIds: string[]): Promise<number> {
    return 25.5; // Mock average savings percentage
  }

  private async getCuratorRecentActivity(curatorId: string): Promise<any[]> {
    return []; // Mock implementation
  }

  private async calculateCuratorSuccessRate(curatorId: string): Promise<number> {
    return 85; // Mock success rate
  }

  private async getRecentDeals(category?: string, timeWindow: number = 24): Promise<Product[]> {
    return []; // Mock implementation
  }
}

export const communityService = new CommunityService(); 