import { Product, ExpertCurator, WatchlistShared, CommunityVote, DealComment } from '../config/storage';
export interface CredibilityAnalysis {
    score: number;
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
export declare class CommunityService {
    calculateCredibilityScore(product: Product): Promise<CredibilityAnalysis>;
    getSocialProof(productId: string): Promise<SocialProof>;
    private getProductQuery;
    createExpertCurator(curatorData: Partial<ExpertCurator>): Promise<ExpertCurator>;
    createSharedWatchlist(creatorId: string, name: string, description: string, category: string, productIds: string[], isPublic?: boolean): Promise<WatchlistShared>;
    voteDeal(userId: string, productId: string, voteType: 'upvote' | 'downvote', reason?: string): Promise<CommunityVote>;
    addDealComment(productId: string, userId: string, content: string, parentCommentId?: string): Promise<DealComment>;
    getCuratorAnalytics(curatorId: string): Promise<CuratorAnalytics>;
    followCurator(userId: string, curatorId: string): Promise<boolean>;
    getTrendingDeals(category?: string, timeWindow?: number): Promise<Array<{
        product: Product;
        trendingScore: number;
        socialProof: SocialProof;
        credibility: CredibilityAnalysis;
    }>>;
    private analyzePriceHistory;
    private analyzeStockVelocity;
    private analyzeCommunityTrust;
    private analyzeDealAge;
    private analyzeSellerReputation;
    private calculateOverallCredibility;
    private generateBadges;
    private generateWarnings;
    private getCredibilityRecommendation;
    private calculateTrustScore;
    private calculateTrendingScore;
    private getRecencyWeight;
    private calculatePriceVolatility;
    private generateId;
    private extractTags;
    private getCommunityVotes;
    private getDealComments;
    private getExpertEndorsements;
    private getSharesCount;
    private getUserVote;
    private getUser;
    private getComment;
    private getCurator;
    private getUserName;
    private calculateWatchlistSavings;
    private getCuratorRecentActivity;
    private calculateCuratorSuccessRate;
    private getRecentDeals;
}
export declare const communityService: CommunityService;
//# sourceMappingURL=communityService.d.ts.map