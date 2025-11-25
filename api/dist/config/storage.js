"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_FILE = process.env.VERCEL ? '/tmp/data.json' : path_1.default.join(__dirname, '../../data/data.json');
const dataDir = path_1.default.dirname(DATA_FILE);
try {
    if (dataDir && dataDir !== '/' && !fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
}
catch (_) {
}
if (!fs_1.default.existsSync(DATA_FILE)) {
    try {
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify({
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
    catch (error) {
    }
}
class FileStorage {
    readData() {
        try {
            const data = fs_1.default.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
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
            };
        }
    }
    writeData(data) {
        try {
            console.log('[FileStorage] Writing data:', JSON.stringify(data, null, 2));
            fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error writing data file:', error);
            throw error;
        }
    }
    async getSubscriptionPlans() {
        const data = this.readData();
        return data.subscriptionPlans || [];
    }
    async getDeletedSubscriptionPlanIds() {
        const data = this.readData();
        return data.subscriptionPlansDeleted || [];
    }
    async setSubscriptionPlans(plans) {
        const data = this.readData();
        data.subscriptionPlans = plans;
        this.writeData(data);
    }
    async addSubscriptionPlan(plan) {
        const data = this.readData();
        data.subscriptionPlans = data.subscriptionPlans || [];
        data.subscriptionPlans.push(plan);
        this.writeData(data);
    }
    async updateSubscriptionPlan(id, update) {
        const data = this.readData();
        data.subscriptionPlans = data.subscriptionPlans || [];
        const idx = data.subscriptionPlans.findIndex(p => p.id === id);
        if (idx === -1) {
            if (!update || !update.name || !update.interval || typeof update.price !== 'number' || !update.features) {
                return false;
            }
            const newPlan = {
                id,
                name: update.name,
                price: update.price,
                currency: update.currency || 'USD',
                interval: update.interval,
                features: update.features
            };
            data.subscriptionPlans.push(newPlan);
            this.writeData(data);
            return true;
        }
        data.subscriptionPlans[idx] = { ...data.subscriptionPlans[idx], ...update };
        this.writeData(data);
        return true;
    }
    async deleteSubscriptionPlan(id) {
        const data = this.readData();
        const before = (data.subscriptionPlans || []).length;
        data.subscriptionPlans = (data.subscriptionPlans || []).filter(p => p.id !== id);
        data.subscriptionPlansDeleted = data.subscriptionPlansDeleted || [];
        if (!data.subscriptionPlansDeleted.includes(id)) {
            data.subscriptionPlansDeleted.push(id);
        }
        this.writeData(data);
        const after = (data.subscriptionPlans || []).length;
        return before !== after || data.subscriptionPlansDeleted.includes(id);
    }
    async addProduct(productData) {
        console.log('[FileStorage] addProduct called with:', productData);
        const data = this.readData();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const now = new Date().toISOString();
        const product = { id, ...productData, stockStatus: productData.stockStatus || 'unknown', discountInfo: productData.discountInfo ?? undefined, createdAt: now, updatedAt: now };
        data.products.push(product);
        this.writeData(data);
        console.log('[FileStorage] Product added:', product);
        return id;
    }
    async getProducts(userId) {
        const data = this.readData();
        if (!userId)
            return data.products;
        return data.products.filter(p => p.userId === userId);
    }
    async getProductById(id) {
        const data = this.readData();
        return data.products.find(p => p.id === id);
    }
    async deleteProduct(id) {
        const data = this.readData();
        const initialLength = data.products.length;
        data.products = data.products.filter(p => p.id !== id);
        this.writeData(data);
        return data.products.length !== initialLength;
    }
    async updateProduct(id, update) {
        const data = this.readData();
        const product = data.products.find(p => p.id === id);
        if (!product)
            return false;
        Object.assign(product, update);
        this.writeData(data);
        return true;
    }
    async addUser(userData) {
        console.log('[FileStorage] addUser called with:', userData);
        const data = this.readData();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const now = new Date().toISOString();
        const user = { id, ...userData, createdAt: now, lastLogin: now };
        data.users.push(user);
        this.writeData(data);
        console.log('[FileStorage] User added:', user);
        return id;
    }
    async getUserByEmail(email) {
        console.log('[FileStorage] getUserByEmail called for:', email);
        const data = this.readData();
        console.log('[FileStorage] Users in file:', data.users);
        return data.users.find(u => u.email === email);
    }
    async getUserById(id) {
        const data = this.readData();
        return data.users.find(u => u.id === id);
    }
    async updateUser(id, update) {
        const data = this.readData();
        const user = data.users.find(u => u.id === id);
        if (!user)
            return false;
        Object.assign(user, update);
        this.writeData(data);
        return true;
    }
    async deleteUser(id) {
        const data = this.readData();
        const initialLength = data.users.length;
        data.users = data.users.filter(u => u.id !== id);
        this.writeData(data);
        return data.users.length !== initialLength;
    }
    async addAlert(alertData) {
        const data = this.readData();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const now = new Date().toISOString();
        const alert = { id, ...alertData, createdAt: now };
        data.alerts.push(alert);
        this.writeData(data);
        return id;
    }
    async getAlerts(userId) {
        const data = this.readData();
        return userId ? data.alerts.filter(a => a.userId === userId) : data.alerts;
    }
    async getAllAlerts() {
        const data = this.readData();
        return data.alerts.filter(a => a.isActive);
    }
    async getAlertById(id) {
        const data = this.readData();
        return data.alerts.find(a => a.id === id);
    }
    async updateAlert(id, update) {
        const data = this.readData();
        const alert = data.alerts.find(a => a.id === id);
        if (!alert)
            return false;
        Object.assign(alert, update);
        this.writeData(data);
        return true;
    }
    async deleteAlert(id) {
        const data = this.readData();
        const initialLength = data.alerts.length;
        data.alerts = data.alerts.filter(a => a.id !== id);
        this.writeData(data);
        return data.alerts.length !== initialLength;
    }
    async addNotification(notificationData) {
        const data = this.readData();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const now = new Date().toISOString();
        const notification = { id, ...notificationData, timestamp: now };
        data.notifications.push(notification);
        this.writeData(data);
        return id;
    }
    async getNotifications(userId) {
        const data = this.readData();
        return userId ? data.notifications.filter(n => n.userId === userId) : data.notifications;
    }
    async getNotificationById(id) {
        const data = this.readData();
        return data.notifications.find(n => n.id === id);
    }
    async updateNotification(id, update) {
        const data = this.readData();
        const notification = data.notifications.find(n => n.id === id);
        if (!notification)
            return false;
        Object.assign(notification, update);
        this.writeData(data);
        return true;
    }
    async deleteNotification(id) {
        const data = this.readData();
        const initialLength = data.notifications.length;
        data.notifications = data.notifications.filter(n => n.id !== id);
        this.writeData(data);
        return data.notifications.length !== initialLength;
    }
    async clearNotifications(userId) {
        const data = this.readData();
        data.notifications = data.notifications.filter((n) => n.userId !== userId);
        this.writeData(data);
    }
    async addPriceHistory(historyData) {
        const data = this.readData();
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const now = new Date().toISOString();
        const history = { id, ...historyData, timestamp: now };
        data.priceHistory.push(history);
        this.writeData(data);
        return id;
    }
    async getPriceHistory(productId) {
        const data = this.readData();
        return data.priceHistory.filter(h => h.productId === productId);
    }
    async addPayment(paymentData) {
        const data = this.readData();
        data.payments.push(paymentData);
        this.writeData(data);
        return paymentData.id;
    }
    async getUserPayments(userId) {
        const data = this.readData();
        return data.payments.filter(p => p.userId === userId);
    }
    async getPaymentById(id) {
        const data = this.readData();
        return data.payments.find(p => p.id === id);
    }
    async updatePayment(id, update) {
        const data = this.readData();
        const payment = data.payments.find(p => p.id === id);
        if (!payment)
            return false;
        Object.assign(payment, update);
        this.writeData(data);
        return true;
    }
    async addAffiliateTransaction(transactionData) {
        const data = this.readData();
        data.affiliateTransactions.push(transactionData);
        this.writeData(data);
        return transactionData.id;
    }
    async getAffiliateTransactions(affiliateUserId) {
        const data = this.readData();
        return data.affiliateTransactions.filter(t => t.affiliateUserId === affiliateUserId);
    }
    async getAffiliateReferrals(affiliateUserId) {
        const data = this.readData();
        const transactions = data.affiliateTransactions.filter(t => t.affiliateUserId === affiliateUserId);
        const referredUserIds = transactions.map(t => t.referredUserId);
        return data.users.filter(u => referredUserIds.includes(u.id));
    }
    async addPayoutRequest(payoutData) {
        const data = this.readData();
        data.payoutRequests.push(payoutData);
        this.writeData(data);
        return payoutData.id;
    }
    async getPayoutRequests(affiliateUserId) {
        const data = this.readData();
        return affiliateUserId
            ? data.payoutRequests.filter(p => p.affiliateUserId === affiliateUserId)
            : data.payoutRequests;
    }
    async updatePayoutRequest(id, update) {
        const data = this.readData();
        const request = data.payoutRequests.find(p => p.id === id);
        if (!request)
            return false;
        Object.assign(request, update);
        this.writeData(data);
        return true;
    }
    async getUsers() {
        const data = this.readData();
        return data.users;
    }
}
exports.default = new FileStorage();
//# sourceMappingURL=storage.js.map