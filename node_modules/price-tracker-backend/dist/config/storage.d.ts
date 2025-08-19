export interface Product {
    id: string;
    url: string;
    title: string;
    price: number;
    currency: string;
    platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    stockStatus?: 'in_stock' | 'out_of_stock' | 'unknown';
    discountInfo?: string | undefined;
    matchedProducts?: string[];
    previousStockStatus?: 'in_stock' | 'out_of_stock' | 'unknown';
    condition?: 'new' | 'used' | 'refurbished' | 'open_box' | 'damaged';
    conditionScore?: number;
    conditionDetails?: string;
    sellerRating?: number;
    sellerReviewCount?: number;
    warrantyCoverage?: string;
    returnPolicy?: string;
    globalPrices?: {
        [countryCode: string]: {
            price: number;
            currency: string;
            shippingCost?: number;
            taxRate?: number;
            dutyRate?: number;
            landedCost?: number;
            availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
        };
    };
    availableCoupons?: CouponInfo[];
    bestStack?: CouponStack;
    finalPrice?: number;
    credibilityScore?: number;
    communityRating?: number;
    communityVotes?: number;
    isVerified?: boolean;
    priceGuarantees?: PriceGuarantee[];
    autoBuyEnabled?: boolean;
    autoBuyTriggerPrice?: number;
    stockVelocity?: number;
    priceVolatility?: number;
    predictedNextPrice?: number;
    predictedPriceDate?: string;
}
export interface CouponInfo {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed' | 'bogo' | 'shipping';
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    expiresAt: string;
    isStackable: boolean;
    isVerified: boolean;
    platform: string;
    categories?: string[];
    usageCount: number;
    successRate: number;
}
export interface CouponStack {
    coupons: CouponInfo[];
    totalDiscount: number;
    finalPrice: number;
    savings: number;
    isValid: boolean;
    validationDate: string;
}
export interface PriceGuarantee {
    id: string;
    retailer: string;
    policyType: 'price_match' | 'price_protection' | 'best_price_guarantee';
    windowDays: number;
    purchaseDate?: string;
    eligibleUntil?: string;
    claimableAmount?: number;
    isClaimable: boolean;
    claimUrl?: string;
    requirements: string[];
    status: 'eligible' | 'claimed' | 'expired' | 'ineligible';
}
export interface ExpertCurator {
    id: string;
    name: string;
    bio: string;
    specialties: string[];
    followerCount: number;
    isVerified: boolean;
    credibilityScore: number;
    totalDealsShared: number;
    averageSavings: number;
    joinedAt: string;
}
export interface WatchlistShared {
    id: string;
    name: string;
    description: string;
    creatorId: string;
    creatorName: string;
    isPublic: boolean;
    category: string;
    productIds: string[];
    followerCount: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    averageSavings?: number;
    totalProducts: number;
}
export interface CommunityVote {
    id: string;
    userId: string;
    productId: string;
    voteType: 'upvote' | 'downvote';
    reason?: string;
    createdAt: string;
}
export interface DealComment {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    content: string;
    upvotes: number;
    downvotes: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    replies?: DealComment[];
}
export interface GlobalMarketData {
    productId: string;
    markets: {
        [countryCode: string]: {
            price: number;
            currency: string;
            platform: string;
            url: string;
            inStock: boolean;
            shippingInfo: {
                cost: number;
                estimatedDays: number;
                carrier: string;
            };
            taxInfo: {
                rate: number;
                included: boolean;
            };
            dutyInfo?: {
                rate: number;
                threshold: number;
            };
            landedCost: number;
            lastUpdated: string;
        };
    };
    bestDeal: {
        countryCode: string;
        savings: number;
        landedCost: number;
    };
    updatedAt: string;
}
export interface AutomationRule {
    id: string;
    userId: string;
    productId: string;
    type: 'auto_buy' | 'price_alert' | 'stock_alert' | 'coupon_alert';
    isActive: boolean;
    conditions: {
        maxPrice?: number;
        minConditionScore?: number;
        requiresCoupons?: boolean;
        maxShippingTime?: number;
        minSellerRating?: number;
    };
    actions: {
        autoExecute?: boolean;
        notificationMethods: ('email' | 'push' | 'sms')[];
        purchaseBudget?: number;
    };
    createdAt: string;
    executionHistory: {
        executedAt: string;
        action: string;
        result: 'success' | 'failed' | 'pending';
        details: string;
    }[];
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    features: {
        maxTrackedProducts: number;
        alertFrequency: 'instant' | 'hourly' | 'daily';
        priceHistoryDays: number;
        exportData: boolean;
        prioritySupport: boolean;
    };
}
export interface User {
    id: string;
    email: string;
    password: string;
    username: string;
    createdAt: string;
    lastLogin: string;
    role?: 'admin' | 'user' | 'banned';
    notificationSettings?: {
        priceDrops: boolean;
        newProducts: boolean;
        weeklySummary: boolean;
    };
    privacySettings?: {
        shareData: boolean;
        analytics: boolean;
    };
    preferences?: {
        currency: string;
        language: string;
    };
    seenPriceDropIds?: string[];
    subscription?: {
        plan: 'free' | 'premium' | 'pro';
        status: 'active' | 'cancelled' | 'expired' | 'pending';
        startDate: string;
        endDate: string;
        paymentMethod: 'chapa' | 'paypal' | 'webirr' | 'manual';
        subscriptionId?: string;
        nextBillingDate?: string;
        features: {
            maxTrackedProducts: number;
            alertFrequency: 'instant' | 'hourly' | 'daily';
            priceHistoryDays: number;
            exportData: boolean;
            prioritySupport: boolean;
        };
    };
    affiliate?: {
        isAffiliate: boolean;
        referralCode?: string;
        commissionRate?: number;
        totalEarnings?: number;
        pendingEarnings?: number;
        payoutMethod?: 'paypal' | 'bybit' | 'bank' | 'wise';
        payoutDetails?: {
            paypalEmail?: string;
            bybitAddress?: string;
            bankAccount?: {
                accountNumber: string;
                bankName: string;
                swiftCode?: string;
            };
            wiseEmail?: string;
        };
    };
}
export interface Alert {
    id: string;
    productId: string;
    productTitle: string;
    targetPrice: number;
    currentPrice: number;
    isActive: boolean;
    email?: string;
    createdAt: string;
    userId: string;
    triggeredAt?: string;
    restockAlert?: boolean;
}
export interface Notification {
    id: string;
    userId: string;
    alertId: string;
    productId: string;
    productTitle: string;
    previousPrice: number;
    currentPrice: number;
    priceDrop: number;
    timestamp: string;
    type: string;
    isRead: boolean;
    productUrl?: string;
}
export interface PriceHistory {
    id: string;
    productId: string;
    price: number;
    currency: string;
    timestamp: string;
}
export interface Payment {
    id: string;
    userId: string;
    type: 'subscription' | 'one_time';
    amount: number;
    currency: 'USD' | 'ETB' | 'EUR';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: 'chapa' | 'paypal' | 'webirr' | 'manual';
    paymentGatewayId?: string;
    subscriptionPlan?: 'premium' | 'pro';
    createdAt: string;
    completedAt?: string;
    metadata?: {
        invoiceUrl?: string;
        receiptUrl?: string;
        failureReason?: string;
        planId?: string;
        planName?: string;
    };
}
export interface AffiliateTransaction {
    id: string;
    affiliateUserId: string;
    referredUserId: string;
    type: 'signup' | 'subscription' | 'renewal';
    amount: number;
    commission: number;
    status: 'pending' | 'approved' | 'paid';
    createdAt: string;
    paidAt?: string;
    paymentReference?: string;
}
export interface PayoutRequest {
    id: string;
    affiliateUserId: string;
    amount: number;
    currency: 'USD' | 'ETB';
    method: 'paypal' | 'bybit' | 'bank' | 'wise';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: string;
    processedAt?: string;
    paymentReference?: string;
    details?: {
        paypalEmail?: string;
        bybitAddress?: string;
        bankAccount?: any;
    } | undefined;
}
declare class FileStorage {
    private readData;
    private writeData;
    getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
    getDeletedSubscriptionPlanIds(): Promise<string[]>;
    setSubscriptionPlans(plans: SubscriptionPlan[]): Promise<void>;
    addSubscriptionPlan(plan: SubscriptionPlan): Promise<void>;
    updateSubscriptionPlan(id: string, update: Partial<SubscriptionPlan>): Promise<boolean>;
    deleteSubscriptionPlan(id: string): Promise<boolean>;
    addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    getProducts(userId?: string): Promise<Product[]>;
    getProductById(id: string): Promise<Product | undefined>;
    deleteProduct(id: string): Promise<boolean>;
    updateProduct(id: string, update: Partial<Product>): Promise<boolean>;
    addUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<string>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserById(id: string): Promise<User | undefined>;
    updateUser(id: string, update: Partial<User>): Promise<boolean>;
    deleteUser(id: string): Promise<boolean>;
    addAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<string>;
    getAlerts(userId?: string): Promise<Alert[]>;
    getAllAlerts(): Promise<Alert[]>;
    getAlertById(id: string): Promise<Alert | undefined>;
    updateAlert(id: string, update: Partial<Alert>): Promise<boolean>;
    deleteAlert(id: string): Promise<boolean>;
    addNotification(notificationData: Omit<Notification, 'id' | 'timestamp'>): Promise<string>;
    getNotifications(userId?: string): Promise<Notification[]>;
    getNotificationById(id: string): Promise<Notification | undefined>;
    updateNotification(id: string, update: Partial<Notification>): Promise<boolean>;
    deleteNotification(id: string): Promise<boolean>;
    clearNotifications(userId: string): Promise<void>;
    addPriceHistory(historyData: Omit<PriceHistory, 'id' | 'timestamp'>): Promise<string>;
    getPriceHistory(productId: string): Promise<PriceHistory[]>;
    addPayment(paymentData: Payment): Promise<string>;
    getUserPayments(userId: string): Promise<Payment[]>;
    getPaymentById(id: string): Promise<Payment | undefined>;
    updatePayment(id: string, update: Partial<Payment>): Promise<boolean>;
    addAffiliateTransaction(transactionData: AffiliateTransaction): Promise<string>;
    getAffiliateTransactions(affiliateUserId: string): Promise<AffiliateTransaction[]>;
    getAffiliateReferrals(affiliateUserId: string): Promise<User[]>;
    addPayoutRequest(payoutData: PayoutRequest): Promise<string>;
    getPayoutRequests(affiliateUserId?: string): Promise<PayoutRequest[]>;
    updatePayoutRequest(id: string, update: Partial<PayoutRequest>): Promise<boolean>;
    getUsers(): Promise<User[]>;
}
declare const _default: FileStorage;
export default _default;
//# sourceMappingURL=storage.d.ts.map