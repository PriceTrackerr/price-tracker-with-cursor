# 💳 LemonSqueezy Payment Integration Guide

## Overview

This guide will help you integrate LemonSqueezy payments into your Price Tracker application.

## 📋 Prerequisites

- [x] LemonSqueezy account created
- [x] Account approved (✅ You mentioned you were approved yesterday!)
- [ ] API keys obtained
- [ ] Products/pricing plans created in LemonSqueezy dashboard

## 🎯 What We'll Build

### Subscription Tiers (Example)
You can customize these based on your business model:

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/month | • Track up to 5 products<br/>• Basic price alerts<br/>• Email notifications |
| **Pro** | $9.99/month | • Unlimited products<br/>• Advanced alerts<br/>• Price history charts<br/>• Priority support |
| **Premium** | $19.99/month | • Everything in Pro<br/>• API access<br/>• Bulk import<br/>• Custom webhooks |

## 🔑 Step 1: Get Your LemonSqueezy API Keys

### Where to Find Them:
1. Log in to [LemonSqueezy Dashboard](https://app.lemonsqueezy.com)
2. Go to **Settings** → **API**
3. Create a new API key
4. Copy the key (you'll only see it once!)

### What You'll Need:
- **API Key**: For making API calls
- **Store ID**: Your store identifier
- **Webhook Secret**: For verifying webhook signatures

## 🛠️ Step 2: Create Products in LemonSqueezy

### In LemonSqueezy Dashboard:
1. Go to **Products** → **New Product**
2. Create each subscription tier:
   - **Name**: "Pro Plan"
   - **Price**: $9.99
   - **Billing**: Monthly/Yearly
   - **Description**: What's included

3. Note the **Product ID** for each plan

## 📝 Step 3: Configuration

### Add to `api/.env`:
```bash
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here

# Product IDs (from LemonSqueezy dashboard)
LEMONSQUEEZY_PRO_PLAN_ID=12345
LEMONSQUEEZY_PREMIUM_PLAN_ID=12346
```

### Add to `web-app/.env`:
```bash
# LemonSqueezy Store ID (public, safe to expose)
VITE_LEMONSQUEEZY_STORE_ID=your_store_id_here
```

## 🏗️ Step 4: Implementation Plan

### Backend Changes

#### 1. Install LemonSqueezy SDK
```bash
cd api
npm install @lemonsqueezy/lemonsqueezy.js
```

#### 2. Create Payment Service (`api/src/services/lemonSqueezyService.ts`)
- Create checkout sessions
- Manage subscriptions
- Handle webhooks
- Verify payments

#### 3. Create Payment Routes (`api/src/routes/payments.ts`)
- `POST /api/payments/create-checkout` - Start checkout
- `GET /api/payments/subscription` - Get subscription status
- `POST /api/payments/webhook` - Handle LemonSqueezy webhooks
- `POST /api/payments/cancel` - Cancel subscription
- `POST /api/payments/update` - Update payment method

#### 4. Update Database Schema
Add subscription fields to users table:
```sql
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20);
ALTER TABLE users ADD COLUMN subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_ends_at TIMESTAMP;
```

#### 5. Add Middleware (`api/src/middleware/subscription.ts`)
- Check subscription status
- Enforce tier limits
- Handle expired subscriptions

### Frontend Changes

#### 1. Create Pricing Page (`web-app/src/pages/Pricing.tsx`)
- Display subscription tiers
- Feature comparison
- "Upgrade" buttons

#### 2. Create Subscription Management (`web-app/src/pages/Subscription.tsx`)
- Current plan display
- Upgrade/downgrade options
- Cancel subscription
- Payment history

#### 3. Add Subscription Context (`web-app/src/contexts/SubscriptionContext.tsx`)
- Store subscription state
- Check feature access
- Enforce limits

#### 4. Update Dashboard
- Show subscription status
- Display usage limits (e.g., "3/5 products tracked")
- Upgrade prompts when limits reached

## 🔄 Step 5: Webhook Setup

### In LemonSqueezy Dashboard:
1. Go to **Settings** → **Webhooks**
2. Add new webhook endpoint:
   - **URL**: `https://your-api.vercel.app/api/payments/webhook`
   - **Events**: Select all subscription events

### Events to Handle:
- `subscription_created` - New subscription
- `subscription_updated` - Plan changed
- `subscription_cancelled` - Subscription cancelled
- `subscription_resumed` - Subscription reactivated
- `subscription_expired` - Subscription ended
- `subscription_payment_success` - Payment received
- `subscription_payment_failed` - Payment failed

## 🧪 Step 6: Testing

### Test Mode:
LemonSqueezy provides test mode for development:
1. Use test API keys
2. Use test credit cards
3. Verify webhook delivery

### Test Cases:
- [ ] Create new subscription
- [ ] Upgrade plan
- [ ] Downgrade plan
- [ ] Cancel subscription
- [ ] Handle failed payment
- [ ] Webhook processing
- [ ] Access control (free vs pro features)

## 🚀 Step 7: Deployment

### Environment Variables:
Make sure to add LemonSqueezy keys to:
- Vercel (for production API)
- Local `.env` files (for development)

### Webhook URL:
Update webhook URL in LemonSqueezy to point to production:
```
https://your-production-api.vercel.app/api/payments/webhook
```

## 📊 Feature Gating Examples

### Limit Product Tracking:
```typescript
// Check if user can track more products
if (user.subscription_tier === 'free' && trackedProducts.length >= 5) {
  throw new Error('Free tier limited to 5 products. Upgrade to Pro!');
}
```

### Premium Features:
```typescript
// Check if user has access to feature
if (feature === 'api_access' && user.subscription_tier !== 'premium') {
  throw new Error('API access requires Premium subscription');
}
```

## 💡 User Flow Example

### New User Journey:
1. User signs up (Free tier)
2. Tracks 5 products
3. Tries to track 6th product
4. Sees upgrade prompt
5. Clicks "Upgrade to Pro"
6. Redirected to LemonSqueezy checkout
7. Completes payment
8. Webhook updates subscription status
9. User can now track unlimited products

## 🎨 UI Components Needed

### 1. Pricing Cards
```
┌─────────────────┐
│   FREE PLAN     │
│   $0/month      │
│                 │
│ ✓ 5 products    │
│ ✓ Basic alerts  │
│                 │
│  [Current Plan] │
└─────────────────┘
```

### 2. Upgrade Modal
```
You've reached your limit!
━━━━━━━━━━━━━━━━━━━━━
Free: 5/5 products tracked

Upgrade to Pro for unlimited tracking!

[Upgrade Now] [Maybe Later]
```

### 3. Subscription Badge
```
Dashboard Header:
[Your Plan: Pro ⭐] [Manage Subscription]
```

## 📞 What I Need From You

To implement this, please provide:

1. **LemonSqueezy API Key**
   - From Settings → API in LemonSqueezy dashboard

2. **Store ID**
   - Also in Settings → API

3. **Pricing Strategy**
   - What tiers do you want? (Free, Pro, Premium?)
   - What prices? ($9.99/month, $19.99/month?)
   - What features in each tier?

4. **Product IDs**
   - After creating products in LemonSqueezy, give me the IDs

## 🎯 Next Steps

Once you provide the above information, I will:

1. ✅ Install LemonSqueezy SDK
2. ✅ Create payment service
3. ✅ Add payment routes
4. ✅ Update database schema
5. ✅ Build pricing page
6. ✅ Add subscription management
7. ✅ Implement feature gating
8. ✅ Set up webhooks
9. ✅ Test everything
10. ✅ Deploy to production

## 📚 Resources

- [LemonSqueezy Documentation](https://docs.lemonsqueezy.com)
- [LemonSqueezy API Reference](https://docs.lemonsqueezy.com/api)
- [LemonSqueezy.js SDK](https://github.com/lmsqueezy/lemonsqueezy.js)

---

**Ready to start?** Just provide your LemonSqueezy credentials and pricing strategy, and I'll implement everything! 🚀
