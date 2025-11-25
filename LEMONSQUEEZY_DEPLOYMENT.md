# 🚀 LemonSqueezy Payment Integration - Deployment Guide

## ✅ What's Been Completed

### Backend (API)
- ✅ Installed `@lemonsqueezy/lemonsqueezy.js` SDK
- ✅ Created `lemonSqueezyService.ts` with full subscription management
- ✅ Created `/api/subscriptions/*` routes:
  - `POST /create-checkout` - Start payment flow
  - `GET /status` - Get subscription status
  - `POST /cancel` - Cancel subscription
  - `POST /webhook` - Handle LemonSqueezy webhooks
  - `GET /limits` - Get user usage limits
  - `GET /plans` - List available plans
- ✅ Added webhook signature verification
- ✅ Implemented feature gating (AI, export, limits)
- ✅ Added environment variables to `api/.env`

### Frontend (Web App)
- ✅ Created beautiful `Pricing.tsx` page
- ✅ Added route `/pricing` to App.tsx
- ✅ Integrated with backend API
- ✅ Added environment variables to `web-app/.env`

### Database
- ✅ Created migration script `api/migrations/add_subscription_fields.sql`

---

## 📋 Deployment Steps

### Step 1: Run Database Migration

**On Supabase Dashboard:**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `api/migrations/add_subscription_fields.sql`
4. Paste and run the migration
5. Verify success message appears

**What this does:**
- Adds subscription fields to `users` table
- Creates indexes for performance
- Adds helper function for checking limits

---

### Step 2: Update Vercel Environment Variables

**For Backend (API):**

1. Go to Vercel Dashboard → Your API Project
2. Settings → Environment Variables
3. Add the following:

```bash
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiI3MjM5ODU5NjQzZDc5ZmI1OGZjYjkzNDQwYmMzMzM2NjlhN2NkMmFlNjA4OWZmYmVlZDBiNWZhZWJkODRkM2U1MTljZGUxODQ1ZDFlYTc3NiIsImlhdCI6MTc2NDA3MDI2OC43OTE0MTUsIm5iZiI6MTc2NDA3MDI2OC43OTE0MTcsImV4cCI6MjA3OTYwMzA2OC43NzgwNDcsInN1YiI6IjUzNzIwMDIiLCJzY29wZXMiOltdfQ.yR9nJPVlw8GL7mbdWarVRfrumB9gUh2TVLkEbbZOfB0d2oAzKM6-vUAmVTSN5ahBWGU0Gp8SGvbZAUHbLJor3BrS7biSc4mV-Yd0lKrAveB1UCDwNzP0nL-yQM4X4gN_wUe1k7kqzxNCCMNGoMrVR-YGWOh0Fd4j3CIfApkVLRhyNbEz6YtPWXtf02yaGv9A_diCuuRtgyteoKZRkDulgcWk9Y52qsymu9HsdahWO0cZVvEqOvEnoHzdiND43MbgP3cWpGA5fKhKPBBrhhkWZE2XOVFnNwCtnbmJH8bxr-uGWcH0oyF5KTwEupozB_rGv1LA5shIXuWhzFYIn1NaPF2NmnXJiNyM346pvgZ0W-rZZdUQfaJuahsO5F616K3rKud5P4MM5BxAI8qJvstjPVEMS9oAVqCnCQLSklIc_RoWTUEndFpXYqiE4EdOPoVLgcrNXHDh-v5Xufphwj8qNjxoUZJ61OeQebiixNdw0eV5BU0WeuGyLCxdQl6QP-QSqs_agEIYqYLM-uHOQgexoQ5GsjXLB8A2b46ltQ1H1HE_V9wgQODw9QCS395LGLomVHTpZ-j4avYYuEESixgbzoHDYx1T1hs09-r8CmW_S7IX9U9y92KTmoFRpHsyhJoKuLK4PDCPOLnLluscLFOyN43exH_mg8TbIu9kGdMVvKo

LEMONSQUEEZY_WEBHOOK_SECRET=test_webhook

LEMONSQUEEZY_STORE_ID=212646

LEMONSQUEEZY_PRO_MONTHLY_ID=704199

LEMONSQUEEZY_PRO_YEARLY_ID=704210
```

4. **Important**: Click "Redeploy" after adding variables

**For Frontend (Web App):**

1. Go to Vercel Dashboard → Your Web App Project
2. Settings → Environment Variables
3. Add:

```bash
VITE_LEMONSQUEEZY_STORE_ID=212646
```

4. **Important**: Click "Redeploy" after adding

---

### Step 3: Configure LemonSqueezy Webhook

1. Go to LemonSqueezy Dashboard: https://app.lemonsqueezy.com
2. Navigate to **Settings** → **Webhooks**
3. Click **+ Add Webhook**
4. Configure:
   - **URL**: `https://price-tracker-with-cursor-web-app-s.vercel.app/api/subscriptions/webhook`
   - **Signing Secret**: `test_webhook`
   - **Events to subscribe**: Select ALL subscription events:
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
     - `subscription_resumed`
     - `subscription_expired`
     - `subscription_payment_success`
     - `subscription_payment_failed`
5. Click **Save**

---

### Step 4: Test the Integration

#### Test 1: View Pricing Page
1. Go to: https://price-tracker-with-cursor-web-app.vercel.app/pricing
2. Verify you see Free and Pro plans
3. Verify pricing shows correctly:
   - Free: $0/forever
   - Pro: $4.99/monthly (with 7-day trial)

#### Test 2: Start Checkout (Test Mode)
1. Log in to your app
2. Go to `/pricing`
3. Click "Upgrade to Pro" on the Pro plan
4. Should redirect to LemonSqueezy checkout page
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout

#### Test 3: Verify Webhook
1. After test checkout, check your database
2. User's `subscription_tier` should be `'pro'`
3. User's `subscription_status` should be `'active'` or `'on_trial'`

#### Test 4: Check Limits
1. Go to: `https://price-tracker-with-cursor-web-app-s.vercel.app/api/subscriptions/limits?userId=YOUR_USER_ID`
2. Should return:
```json
{
  "success": true,
  "limits": {
    "products": {
      "current": 0,
      "limit": 10,
      "canTrack": true
    },
    "notifications": {
      "current": 0,
      "limit": 10,
      "canSend": true
    },
    "features": {
      "aiRecommendation": true,
      "exportData": true
    },
    "tier": "pro"
  }
}
```

---

## 🎯 Subscription Tiers

### Free Tier
- **Price**: $0 (forever)
- **Products**: 5 per day
- **Notifications**: 1 per day
- **AI Recommendations**: ❌ No
- **Export Data**: ❌ No

### Pro Tier
- **Price**: $4.99/month or $39.99/year
- **Trial**: 7 days free
- **Products**: 10 tracked
- **Notifications**: 10 per day
- **AI Recommendations**: ✅ Yes
- **Export Data**: ✅ Yes

---

## 🔧 How It Works

### User Flow
1. User visits `/pricing`
2. Clicks "Upgrade to Pro"
3. Redirected to LemonSqueezy checkout
4. Completes payment
5. LemonSqueezy sends webhook to `/api/subscriptions/webhook`
6. Backend updates user's subscription in database
7. User gets Pro features immediately

### Feature Gating
The backend checks subscription tier before allowing:
- **AI Recommendations**: `lemonSqueezyService.checkFeatureAccess(userId, 'aiRecommendation')`
- **Export Data**: `lemonSqueezyService.checkFeatureAccess(userId, 'exportData')`
- **Product Tracking**: `lemonSqueezyService.checkProductLimit(userId)`
- **Notifications**: `lemonSqueezyService.checkNotificationLimit(userId)`

---

## 🐛 Troubleshooting

### Webhook Not Working
1. Check webhook URL is correct
2. Verify signing secret matches
3. Check Vercel logs for errors
4. Test webhook manually from LemonSqueezy dashboard

### Checkout Not Redirecting
1. Verify `LEMONSQUEEZY_STORE_ID` is set correctly
2. Check `LEMONSQUEEZY_PRO_MONTHLY_ID` exists
3. Check browser console for errors
4. Verify user is logged in

### Subscription Not Updating
1. Check database migration ran successfully
2. Verify webhook is configured
3. Check Vercel API logs
4. Manually check `users` table in Supabase

---

## 📝 Next Steps

### Required Before Launch
1. ✅ Run database migration
2. ✅ Add environment variables to Vercel
3. ✅ Configure LemonSqueezy webhook
4. ⏳ Test checkout flow end-to-end
5. ⏳ Add "Upgrade" prompts when limits reached
6. ⏳ Update dashboard to show current plan
7. ⏳ Add subscription management to Settings page

### Optional Enhancements
- Add yearly plan option
- Add "Manage Subscription" button
- Show usage progress bars
- Add upgrade prompts in product tracking
- Email notifications for subscription events

---

## 🎉 You're Ready!

Once you complete the deployment steps above, your payment system will be live! Users can:
- View pricing at `/pricing`
- Upgrade to Pro with 7-day trial
- Get AI recommendations (Pro only)
- Export data (Pro only)
- Track more products (10 vs 5)
- Receive more notifications (10 vs 1)

**Need help?** Check the Vercel logs or LemonSqueezy dashboard for debugging.
