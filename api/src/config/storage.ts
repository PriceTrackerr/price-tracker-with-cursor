

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname, '../../data/data.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ 
    products: [], 
    users: [], 
    alerts: [], 
    notifications: [], 
    priceHistory: [], 
    payments: [], 
    affiliateTransactions: [], 
    payoutRequests: [], 
    subscriptionPlans: [], 
    subscriptionPlansDeleted: [],
    coupons: [],
    couponStacks: [],
    priceGuarantees: [],
    expertCurators: [],
    sharedWatchlists: [],
    communityVotes: [],
    dealComments: [],
    globalMarketData: [],
    automationRules: []
  }));
}

// ------------------ Interfaces ------------------

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
  matchedProducts?: string[]; // Array of product IDs that match this product
  totalMatches?: number; // Total number of matches found
  previousStockStatus?: 'in_stock' | 'out_of_stock' | 'unknown';
  
  // Enhanced features
  condition?: 'new' | 'used' | 'refurbished' | 'open_box' | 'damaged';
  conditionScore?: number; // 0-100 quality score
  conditionDetails?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  warrantyCoverage?: string;
  returnPolicy?: string;
  
  // Global pricing
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
  
  // Coupon information
  availableCoupons?: CouponInfo[];
  bestStack?: CouponStack;
  finalPrice?: number; // Price after best coupon stack
  
  // Community features
  credibilityScore?: number; // 0-100 deal credibility
  communityRating?: number; // User community rating
  communityVotes?: number;
  isVerified?: boolean; // Verified by expert curators
  
  // Price guarantee tracking
  priceGuarantees?: PriceGuarantee[];
  
  // Automation features
  autoBuyEnabled?: boolean;
  autoBuyTriggerPrice?: number;
  stockVelocity?: number; // Items sold per hour/day
  priceVolatility?: number; // Price change frequency
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
  successRate: number; // Percentage of successful applications
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
  windowDays: number; // Days within which claim can be made
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
  specialties: string[]; // Categories they specialize in
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
  isVerified: boolean; // If from expert curator
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

interface DataFile {
  products: Product[];
  users: User[];
  alerts: Alert[];
  notifications: Notification[];
  priceHistory: PriceHistory[];
  payments: Payment[];
  affiliateTransactions: AffiliateTransaction[];
  payoutRequests: PayoutRequest[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptionPlansDeleted: string[];
  coupons: CouponInfo[];
  couponStacks: CouponStack[];
  priceGuarantees: PriceGuarantee[];
  expertCurators: ExpertCurator[];
  sharedWatchlists: WatchlistShared[];
  communityVotes: CommunityVote[];
  dealComments: DealComment[];
  globalMarketData: GlobalMarketData[];
  automationRules: AutomationRule[];
}

// ------------------ Storage Class ------------------

class FileStorage {
  private readData(): DataFile {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading data file:', error);
      return {
        products: [],
        users: [],
        alerts: [],
        notifications: [],
        priceHistory: [],
        payments: [],
        affiliateTransactions: [],
        payoutRequests: [],
        subscriptionPlans: [],
        subscriptionPlansDeleted: [],
        coupons: [],
        couponStacks: [],
        priceGuarantees: [],
        expertCurators: [],
        sharedWatchlists: [],
        communityVotes: [],
        dealComments: [],
        globalMarketData: [],
        automationRules: []
      } as DataFile;
    }
  }

  private writeData(data: DataFile): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing data file:', error);
      throw error;
    }
  }

  // ------------------ Subscription ------------------

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const data = this.readData();
    return data.subscriptionPlans || [];
  }

  async getDeletedSubscriptionPlanIds(): Promise<string[]> {
    const data = this.readData();
    return data.subscriptionPlansDeleted || [];
  }

  async setSubscriptionPlans(plans: SubscriptionPlan[]): Promise<void> {
    const data = this.readData();
    data.subscriptionPlans = plans;
    this.writeData(data);
  }

  async addSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
    const data = this.readData();
    data.subscriptionPlans = data.subscriptionPlans || [];
    data.subscriptionPlans.push(plan);
    this.writeData(data);
  }

  async updateSubscriptionPlan(id: string, update: Partial<SubscriptionPlan>): Promise<boolean> {
    const data = this.readData();
    const idx = (data.subscriptionPlans || []).findIndex(p => p.id === id);
    if (idx === -1) return false;
    data.subscriptionPlans[idx] = { ...data.subscriptionPlans[idx], ...update };
    this.writeData(data);
    return true;
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    const data = this.readData();
    data.subscriptionPlans = (data.subscriptionPlans || []).filter(p => p.id !== id);
    data.subscriptionPlansDeleted = data.subscriptionPlansDeleted || [];
    if (!data.subscriptionPlansDeleted.includes(id)) data.subscriptionPlansDeleted.push(id);
    this.writeData(data);
    return true;
  }

  // ------------------ Products ------------------

  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = this.readData();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();
    const product: Product = { id, ...productData, createdAt: now, updatedAt: now };
    data.products.push(product);
    this.writeData(data);
    return id;
  }

  async getProducts(userId?: string): Promise<Product[]> {
    const data = this.readData();
    return userId ? data.products.filter(p => p.userId === userId) : data.products;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const data = this.readData();
    return data.products.find(p => p.id === id);
  }

  async updateProduct(id: string, update: Partial<Product>): Promise<boolean> {
    const data = this.readData();
    const product = data.products.find(p => p.id === id);
    if (!product) return false;
    Object.assign(product, update);
    this.writeData(data);
    return true;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const data = this.readData();
    const initialLength = data.products.length;
    data.products = data.products.filter(p => p.id !== id);
    this.writeData(data);
    return data.products.length !== initialLength;
  }

  // ------------------ Users ------------------

  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<string> {
    const data = this.readData();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();
    const user: User = { id, ...userData, createdAt: now, lastLogin: now };
    data.users.push(user);
    this.writeData(data);
    return id;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const data = this.readData();
    return data.users.find(u => u.email === email);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const data = this.readData();
    return data.users.find(u => u.id === id);
  }

  async updateUser(id: string, update: Partial<User>): Promise<boolean> {
    const data = this.readData();
    const user = data.users.find(u => u.id === id);
    if (!user) return false;
    Object.assign(user, update);
    this.writeData(data);
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const data = this.readData();
    const initialLength = data.users.length;
    data.users = data.users.filter(u => u.id !== id);
    this.writeData(data);
    return data.users.length !== initialLength;
  }

  async getUsers(): Promise<User[]> {
    const data = this.readData();
    return data.users;
  }

  // ------------------ Alerts ------------------

  async addAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
    const data = this.readData();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();
    const alert: Alert = { id, ...alertData, createdAt: now };
    data.alerts.push(alert);
    this.writeData(data);
    return id;
  }

  async getAlerts(userId?: string): Promise<Alert[]> {
    const data = this.readData();
    return userId ? data.alerts.filter(a => a.userId === userId) : data.alerts;
  }

  async updateAlert(id: string, update: Partial<Alert>): Promise<boolean> {
    const data = this.readData();
    const alert = data.alerts.find(a => a.id === id);
    if (!alert) return false;
    Object.assign(alert, update);
    this.writeData(data);
    return true;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const data = this.readData();
    const initialLength = data.alerts.length;
    data.alerts = data.alerts.filter(a => a.id !== id);
    this.writeData(data);
    return data.alerts.length !== initialLength;
  }

  // ------------------ Notifications ------------------

  async addNotification(notificationData: Omit<Notification, 'id' | 'timestamp'>): Promise<string> {
    const data = this.readData();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();
    const notification: Notification = { id, ...notificationData, timestamp: now };
    data.notifications.push(notification);
    this.writeData(data);
    return id;
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    const data = this.readData();
    return userId ? data.notifications.filter(n => n.userId === userId) : data.notifications;
  }

  async updateNotification(id: string, update: Partial<Notification>): Promise<boolean> {
    const data = this.readData();
    const notification = data.notifications.find(n => n.id === id);
    if (!notification) return false;
    Object.assign(notification, update);
    this.writeData(data);
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const data = this.readData();
    const initialLength = data.notifications.length;
    data.notifications = data.notifications.filter(n => n.id !== id);
    this.writeData(data);
    return data.notifications.length !== initialLength;
  }

  async clearNotifications(userId: string): Promise<void> {
    const data = this.readData();
    data.notifications = data.notifications.filter(n => n.userId !== userId);
    this.writeData(data);
  }

  // ------------------ Price History ------------------

  async addPriceHistory(historyData: Omit<PriceHistory, 'id' | 'timestamp'>): Promise<string> {
    const data = this.readData();
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();
    const history: PriceHistory = { id, ...historyData, timestamp: now };
    data.priceHistory.push(history);
    this.writeData(data);
    return id;
  }

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    const data = this.readData();
    return data.priceHistory.filter(h => h.productId === productId);
  }

  // ------------------ Payments ------------------

  async addPayment(paymentData: Payment): Promise<string> {
    const data = this.readData();
    data.payments.push(paymentData);
    this.writeData(data);
    return paymentData.id;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    const data = this.readData();
    return data.payments.filter(p => p.userId === userId);
  }

  async updatePayment(id: string, update: Partial<Payment>): Promise<boolean> {
    const data = this.readData();
    const payment = data.payments.find(p => p.id === id);
    if (!payment) return false;
    Object.assign(payment, update);
    this.writeData(data);
    return true;
  }

  // ------------------ Affiliate ------------------

  async addAffiliateTransaction(transactionData: AffiliateTransaction): Promise<string> {
    const data = this.readData();
    data.affiliateTransactions.push(transactionData);
    this.writeData(data);
    return transactionData.id;
  }

  async getAffiliateTransactions(affiliateUserId: string): Promise<AffiliateTransaction[]> {
    const data = this.readData();
    return data.affiliateTransactions.filter(t => t.affiliateUserId === affiliateUserId);
  }

  async getAffiliateReferrals(affiliateUserId: string): Promise<User[]> {
    const data = this.readData();
    const transactions = data.affiliateTransactions.filter(t => t.affiliateUserId === affiliateUserId);
    const referredUserIds = transactions.map(t => t.referredUserId);
    return data.users.filter(u => referredUserIds.includes(u.id));
  }

  async addPayoutRequest(payoutData: PayoutRequest): Promise<string> {
    const data = this.readData();
    data.payoutRequests.push(payoutData);
    this.writeData(data);
    return payoutData.id;
  }

  async getPayoutRequests(affiliateUserId?: string): Promise<PayoutRequest[]> {
    const data = this.readData();
    return affiliateUserId 
      ? data.payoutRequests.filter(p => p.affiliateUserId === affiliateUserId)
      : data.payoutRequests;
  }

  async updatePayoutRequest(id: string, update: Partial<PayoutRequest>): Promise<boolean> {
    const data = this.readData();
    const request = data.payoutRequests.find(p => p.id === id);
    if (!request) return false;
    Object.assign(request, update);
    this.writeData(data);
    return true;
  }
}

// ------------------ Export ------------------

export default new FileStorage();
