"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityService = exports.CommunityService = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const db = (0, database_1.getDb)();
class CommunityService {
    async calculateCredibilityScore(product) {
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
    async getSocialProof(productId) {
        const votes = await this.getCommunityVotes(productId);
        const comments = await this.getDealComments(productId);
        const expertEndorsements = await this.getExpertEndorsements(productId);
        const redditClientId = process.env.REDDIT_CLIENT_ID;
        const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
        let redditBoost = 0;
        let redditMentions = 0;
        try {
            if (redditClientId && redditClientSecret) {
                const tokenRes = await axios_1.default.post('https://www.reddit.com/api/v1/access_token', new URLSearchParams({ grant_type: 'client_credentials' }), {
                    auth: { username: redditClientId, password: redditClientSecret },
                    headers: { 'User-Agent': 'PriceTracker/1.0 (community sentiment)' }
                });
                const accessToken = tokenRes.data?.access_token;
                if (accessToken) {
                    const q = encodeURIComponent(await this.getProductQuery(productId));
                    const subs = ['deals', 'DiscountedProducts', 'BuyItForLife', 'buildapcsales'];
                    for (const sub of subs) {
                        const res = await axios_1.default.get(`https://oauth.reddit.com/r/${sub}/search`, {
                            headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'PriceTracker/1.0' },
                            params: { q, restrict_sr: true, sort: 'new', limit: 10 }
                        });
                        const posts = res.data?.data?.children || [];
                        redditMentions += posts.length;
                        for (const p of posts) {
                            const score = p.data?.score ?? 0;
                            if (score > 20)
                                redditBoost += 2;
                            else if (score > 5)
                                redditBoost += 1;
                        }
                    }
                }
            }
        }
        catch {
        }
        const upvotes = votes.filter(v => v.voteType === 'upvote').length;
        const downvotes = votes.filter(v => v.voteType === 'downvote').length;
        const totalVotes = upvotes + downvotes;
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
    async getProductQuery(productId) {
        try {
            const product = await db.getProductById(productId);
            if (product?.title) {
                return product.title.split(' ').slice(0, 5).join(' ');
            }
            return productId;
        }
        catch {
            return productId;
        }
    }
    async createExpertCurator(curatorData) {
        const curator = {
            id: this.generateId(),
            name: curatorData.name || '',
            bio: curatorData.bio || '',
            specialties: curatorData.specialties || [],
            followerCount: 0,
            isVerified: false,
            credibilityScore: 50,
            totalDealsShared: 0,
            averageSavings: 0,
            joinedAt: new Date().toISOString(),
            ...curatorData
        };
        return curator;
    }
    async createSharedWatchlist(creatorId, name, description, category, productIds, isPublic = true) {
        const watchlist = {
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
        watchlist.averageSavings = await this.calculateWatchlistSavings(productIds);
        return watchlist;
    }
    async voteDeal(userId, productId, voteType, reason) {
        const existingVote = await this.getUserVote(userId, productId);
        if (existingVote) {
            existingVote.voteType = voteType;
            existingVote.reason = reason || '';
            return existingVote;
        }
        const vote = {
            id: this.generateId(),
            userId,
            productId,
            voteType,
            reason: reason || '',
            createdAt: new Date().toISOString()
        };
        return vote;
    }
    async addDealComment(productId, userId, content, parentCommentId) {
        const user = await this.getUser(userId);
        const comment = {
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
            const parentComment = await this.getComment(parentCommentId);
            if (parentComment) {
                parentComment.replies = parentComment.replies || [];
                parentComment.replies.push(comment);
            }
        }
        return comment;
    }
    async getCuratorAnalytics(curatorId) {
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
    async followCurator(userId, curatorId) {
        const curator = await this.getCurator(curatorId);
        if (curator) {
            curator.followerCount += 1;
            return true;
        }
        return false;
    }
    async getTrendingDeals(category, timeWindow = 24) {
        const products = await this.getRecentDeals(category, timeWindow);
        const trendingDeals = [];
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
    async analyzePriceHistory(product) {
        const history = await db.getPriceHistory(product.id);
        if (history.length < 2)
            return 30;
        const priceDrops = history.filter((entry, index) => index > 0 && entry.price < history[index - 1].price);
        const volatility = this.calculatePriceVolatility(history);
        if (volatility > 0.3)
            return 20;
        if (priceDrops.length > history.length * 0.7)
            return 25;
        return Math.min(85, 50 + (history.length * 2));
    }
    async analyzeStockVelocity(product) {
        const velocity = product.stockVelocity || 0;
        if (velocity > 100)
            return 90;
        if (velocity > 50)
            return 75;
        if (velocity > 10)
            return 60;
        if (velocity > 0)
            return 40;
        return 20;
    }
    async analyzeCommunityTrust(product) {
        const socialProof = await this.getSocialProof(product.id);
        if (socialProof.totalVotes === 0)
            return 40;
        const positiveRatio = socialProof.communityRating / 5;
        const voteWeight = Math.min(socialProof.totalVotes / 50, 1);
        return (positiveRatio * 80 + 20) * voteWeight;
    }
    analyzeDealAge(product) {
        const ageInHours = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageInHours > 168)
            return 30;
        if (ageInHours > 72)
            return 50;
        if (ageInHours > 24)
            return 70;
        if (ageInHours > 12)
            return 85;
        return 95;
    }
    analyzeSellerReputation(product) {
        const rating = product.sellerRating || 0;
        const reviewCount = product.sellerReviewCount || 0;
        if (reviewCount === 0)
            return 30;
        if (rating >= 4.8 && reviewCount >= 1000)
            return 95;
        if (rating >= 4.5 && reviewCount >= 500)
            return 85;
        if (rating >= 4.0 && reviewCount >= 100)
            return 70;
        if (rating >= 3.5 && reviewCount >= 50)
            return 50;
        return 25;
    }
    calculateOverallCredibility(factors) {
        const weights = {
            priceHistory: 0.25,
            stockVelocity: 0.20,
            communityTrust: 0.25,
            dealAge: 0.15,
            sellerReputation: 0.15
        };
        return Object.entries(factors).reduce((score, [key, value]) => {
            return score + (value * weights[key]);
        }, 0);
    }
    generateBadges(factors, score) {
        const badges = [];
        if (score >= 90)
            badges.push('Highly Trusted Deal');
        if (factors.communityTrust >= 80)
            badges.push('Community Favorite');
        if (factors.stockVelocity >= 80)
            badges.push('Hot Deal');
        if (factors.sellerReputation >= 90)
            badges.push('Top Seller');
        if (factors.dealAge >= 85)
            badges.push('Fresh Deal');
        return badges;
    }
    generateWarnings(factors, score) {
        const warnings = [];
        if (score < 40)
            warnings.push('Low credibility - proceed with caution');
        if (factors.priceHistory < 30)
            warnings.push('Unusual price history detected');
        if (factors.sellerReputation < 40)
            warnings.push('Seller has poor reputation');
        if (factors.stockVelocity < 20)
            warnings.push('Low demand - verify deal legitimacy');
        return warnings;
    }
    getCredibilityRecommendation(score, factors) {
        if (score >= 80 && factors.sellerReputation >= 70)
            return 'highly_trusted';
        if (score >= 60)
            return 'trusted';
        if (score >= 40)
            return 'caution';
        return 'avoid';
    }
    calculateTrustScore(upvotes, downvotes, expertEndorsements, comments) {
        const totalVotes = upvotes + downvotes;
        if (totalVotes === 0)
            return 50;
        const voteRatio = upvotes / totalVotes;
        const expertBonus = expertEndorsements * 10;
        const engagementBonus = Math.min(comments * 2, 20);
        return Math.min(100, (voteRatio * 70) + expertBonus + engagementBonus);
    }
    calculateTrendingScore(socialProof, credibility, product) {
        const recencyWeight = this.getRecencyWeight(product.createdAt);
        const socialWeight = (socialProof.trustScore / 100) * 40;
        const credibilityWeight = (credibility.score / 100) * 35;
        const engagementWeight = Math.min(socialProof.commentCount * 2, 25);
        return recencyWeight + socialWeight + credibilityWeight + engagementWeight;
    }
    getRecencyWeight(createdAt) {
        const ageInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        if (ageInHours <= 1)
            return 25;
        if (ageInHours <= 6)
            return 20;
        if (ageInHours <= 24)
            return 15;
        if (ageInHours <= 72)
            return 10;
        return 5;
    }
    calculatePriceVolatility(history) {
        if (history.length < 2)
            return 0;
        const prices = history.map(h => h.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        return Math.sqrt(variance) / mean;
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    extractTags(text) {
        const words = text.toLowerCase().split(/\s+/);
        return words.filter(word => word.length > 3).slice(0, 5);
    }
    async getCommunityVotes(productId) {
        const voteCount = Math.floor(Math.random() * 200) + 50;
        const votes = [];
        for (let i = 0; i < voteCount; i++) {
            votes.push({
                id: this.generateId(),
                userId: `user_${i}`,
                productId,
                voteType: Math.random() > 0.3 ? 'upvote' : 'downvote',
                reason: '',
                createdAt: new Date().toISOString()
            });
        }
        return votes;
    }
    async getDealComments(productId) {
        const commentCount = Math.floor(Math.random() * 50) + 10;
        const comments = [];
        for (let i = 0; i < commentCount; i++) {
            comments.push({
                id: this.generateId(),
                productId,
                userId: `user_${i}`,
                userName: `User${i}`,
                content: `Comment ${i + 1}`,
                upvotes: Math.floor(Math.random() * 20),
                downvotes: Math.floor(Math.random() * 5),
                isVerified: Math.random() > 0.9,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        return comments;
    }
    async getExpertEndorsements(productId) {
        return Math.floor(Math.random() * 5) + 1;
    }
    async getSharesCount(productId) {
        return Math.floor(Math.random() * 100) + 20;
    }
    async getUserVote(userId, productId) {
        return null;
    }
    async getUser(userId) {
        return { name: 'Mock User', isExpertCurator: false };
    }
    async getComment(commentId) {
        return null;
    }
    async getCurator(curatorId) {
        return null;
    }
    async getUserName(userId) {
        return 'Mock User';
    }
    async calculateWatchlistSavings(productIds) {
        return 25.5;
    }
    async getCuratorRecentActivity(curatorId) {
        return [];
    }
    async calculateCuratorSuccessRate(curatorId) {
        return 85;
    }
    async getRecentDeals(category, timeWindow = 24) {
        return [];
    }
}
exports.CommunityService = CommunityService;
exports.communityService = new CommunityService();
//# sourceMappingURL=communityService.js.map