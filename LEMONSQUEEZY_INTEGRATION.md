# 💳 LemonSqueezy Payment Integration - COMPLETE GUIDE

## ✅ Current Status

- ✅ LemonSqueezy SDK installed
- ✅ Payment service created (`lemonSqueezyService.ts`)
- ✅ API routes implemented (`/api/subscriptions/*`)
- ✅ Pricing page built (`Pricing.tsx`)
- ✅ Subscription page updated
- ✅ Environment variables configured
- ⏳ **DATABASE MIGRATION NEEDED** (You need to do this!)
- ✅ Webhooks configured

---

## 🗄️ DATABASE MIGRATION - START HERE!

### What is Database Migration?

A database migration is a script that updates your database structure (adds new tables, columns, etc.). We need to add subscription-related columns to your `users` table in Supabase so we can track who has paid and what plan they're on.

### 📍 Where is the SQL File?

The SQL migration file is located at:
```
api/migrations/add_subscription_fields.sql
```

### 🚀 How to Run the Migration (Step-by-Step)

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Click on your **Price Tracker** project
3. In the left sidebar, click **SQL Editor**

#### Step 2: Copy the SQL Script
1. Open the file: `api/migrations/add_subscription_fields.sql`
2. Copy **ALL** the content (Ctrl+A, then Ctrl+C)

#### Step 3: Run the Migration
1. In Supabase SQL Editor, click **New Query**
2. Paste the SQL script you copied
3. Click **Run** (or press Ctrl+Enter)
4. You should see: ✅ **"Success. No rows returned"**

#### Step 4: Verify It Worked
1. In Supabase, go to **Table Editor**
2. Click on the `users` table
3. You should now see these NEW columns:
   - `subscription_tier` (default: 'free')
   - `subscription_status`
   - `subscription_id`
   - `lemon_squeezy_customer_id`
   - `subscription_ends_at`
   - `subscription_renews_at`

### ✅ What the Migration Does

The SQL script will:
1. **Add 6 new columns** to your `users` table
2. **Create indexes** for faster database queries
3. **Set all existing users** to 'free' tier by default
4. **Create a helper function** to check subscription limits
5. **Add comments** to document what each column does

### ⚠️ Important Notes

- ✅ Safe to run multiple times (uses `IF NOT EXISTS`)
- ✅ Won't delete any existing data
- ✅ All existing users automatically get 'free' tier
- ✅ Takes less than 1 second to complete

---

## 🎯 Your Subscription Plans

### Free Tier
- **Price**: $0 (forever)
- **Products**: 5 tracked per day
- **Notifications**: 1 per day
- **AI Recommendations**: ❌ No
- **Export Data**: ❌ No

### Pro Monthly
- **Price**: $4.99/month
- **Variant ID**: `1112137`
- **Products**: Unlimited
- **Notifications**: Unlimited
- **AI Recommendations**: ✅ Yes
- **Export Data**: ✅ Yes
- **Trial**: 7 days free

### Pro Yearly
- **Price**: $39.99/year
- **Variant ID**: `1112146`
- **Products**: Unlimited
- **Notifications**: Unlimited
- **AI Recommendations**: ✅ Yes
- **Export Data**: ✅ Yes
- **Trial**: 7 days free
- **Savings**: $20/year!

---

## 🔧 Environment Variables

### Backend (`api/.env`)
```bash
# LemonSqueezy Configuration
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiI2MzIwYTYyMTJlNjhlMTM4ODc3N2JjN2MyYjhiYmEzZTY3YjMxOTE0MDUxNzZhN2YzZjgyNGQ1N2JmZWQzNWZhOTE1YTg2Y2QwMTA5NzI5YSIsImlhdCI6MTc2NDE2MTY5Ny4yMzgyOTYsIm5iZiI6MTc2NDE2MTY5Ny4yMzgyOTgsImV4cCI6MjA3OTY5NDQ5Ny4yMjU4NDcsInN1YiI6IjUzNzIwMDIiLCJzY29wZXMiOltdfQ.UhI6So3cq8MB1pcwS8GvynoY9uZpi6EvX6fJruB0hclXMwskL3UZkRhKMUJJZ0NALgI49S63UyDZkLvhy8GkkZj0Lz-H-FRrT6_eCbo5Q_a-90fEVrzSwWzh0VZ5ZFrgivyd4yyxfv4xhp5f9zoXIPgSoR5LdjtOIfHlbQh1h2bjhqJdOzbEuC3CLqFE51MOO417AtzfkXe092EgTmz5sPpuodNVKcAEHv-UHm5PRXn6WSO8cBEhZN0joWOj_puYF5LT_0M4TvvC0b2j-6CUbYk5a7LTnDODSIbCevhATi5c137y9ARrrLhip9pLjBFEYxlAH-1UuTNI_jdfu1hdUc064n2dIvM3e3ZH4rmAGkvfsJ8HQdU33P4n6T89M9kBcSZ1zTlEq8vFF4l7kt13zuKYefvH4CBjXrgMNsnCeCQmYNlvyXaMchUD46zgpDNvEAcP5odZ_JNxEbkU9UzuK5LAGJZRYiVqWn8b8CnmnEvXVhOT7B3d3eeNoTGUHS-L0Q54UDvDXyYQNmEyo8Fr-jedjozYVvdk8zhRgUmD_4gzUtBvA0hTzVPDEJmny10A_J7ILOydiMQ5YN-u0tJO4tZmi0oph_UWrzQ0t11hDD2TUqQyqAyjOrWa1ffIcVG26HH4CLeXdVcloR6LfKTCKb7nN-tiyWoOHBOzYmYhKq8
LEMONSQUEEZY_WEBHOOK_SECRET=price-tracker-web_hookJaLvj0HixlqBwN
LEMONSQUEEZY_STORE_ID=212646

# Variant IDs (NOT Product IDs!)
LEMONSQUEEZY_PRO_MONTHLY_ID=1112137
LEMONSQUEEZY_PRO_YEARLY_ID=1112146
```

### Frontend (`web-app/.env`)
```bash
VITE_LEMONSQUEEZY_STORE_ID=212646
```

### Vercel Environment Variables
Make sure you've added these to BOTH:
- **API Project** on Vercel (all 5 variables above)
- **Web App Project** on Vercel (just the VITE_LEMONSQUEEZY_STORE_ID)

---

## 🔔 Webhook Configuration

### Webhook URL
```
https://price-tracker-with-cursor.onrender.com/api/subscriptions/webhook
```

### Webhook Secret
```
price-tracker-web_hookJaLvj0HixlqBwN
```

### Events to Subscribe
Make sure these are ALL checked in LemonSqueezy:
- ✅ `subscription_created`
- ✅ `subscription_updated`
- ✅ `subscription_cancelled`
- ✅ `subscription_resumed`
- ✅ `subscription_expired`
- ✅ `subscription_payment_success`
- ✅ `subscription_payment_failed`

---

## 🧪 Testing the Payment Flow

### Step 1: Deploy Your Changes
```bash
git add .
git commit -m "Add LemonSqueezy payment integration"
git push
```

### Step 2: Test Checkout
1. Go to your live site: `https://your-site.vercel.app/subscription`
2. Click **"Upgrade to Pro"** on Monthly or Yearly plan
3. Open browser console (F12) to see logs
4. You should be redirected to LemonSqueezy checkout page

### Step 3: Complete Test Payment
1. Use LemonSqueezy test mode
2. Complete the checkout
3. Check your Supabase `users` table
4. Your `subscription_tier` should change from `'free'` to `'pro'`

### Step 4: Verify Webhook
1. Go to LemonSqueezy Dashboard → Webhooks
2. Check the webhook delivery logs
3. Should show successful delivery (200 OK)

---

## 🎨 How It Works

### User Flow
```
1. User clicks "Upgrade to Pro"
   ↓
2. Frontend calls: POST /api/subscriptions/create-checkout
   ↓
3. Backend creates LemonSqueezy checkout session
   ↓
4. User redirected to LemonSqueezy payment page
   ↓
5. User completes payment
   ↓
6. LemonSqueezy sends webhook to your API
   ↓
7. Backend updates user's subscription_tier to 'pro'
   ↓
8. User now has unlimited features! 🎉
```

### Feature Gating
The backend automatically enforces limits:
- **Free users**: 5 products/day, 1 notification/day
- **Pro users**: Unlimited products, unlimited notifications, AI, export

---

## 📁 Files Created/Modified

### Created Files
- ✅ `api/src/services/lemonSqueezyService.ts` - Payment logic
- ✅ `api/src/routes/subscriptions.ts` - API endpoints
- ✅ `api/migrations/add_subscription_fields.sql` - Database migration
- ✅ `web-app/src/pages/Pricing.tsx` - Pricing page
- ✅ `web-app/src/vite-env.d.ts` - TypeScript definitions

### Modified Files
- ✅ `api/.env` - Added LemonSqueezy credentials
- ✅ `web-app/.env` - Added Store ID
- ✅ `api/src/index.ts` - Registered subscription routes
- ✅ `web-app/src/App.tsx` - Added /pricing route
- ✅ `web-app/src/pages/Subscription.tsx` - Updated with new plans

---

## ❓ Troubleshooting

### Checkout button doesn't redirect
1. Check browser console for errors
2. Verify environment variables are set in Vercel
3. Make sure you redeployed after adding env vars

### Webhook not working
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check Vercel API logs for errors

### Database migration failed
1. Make sure you're connected to the right Supabase project
2. Check if columns already exist (safe to run again)
3. Look for error message in SQL Editor

---

## 🎯 Next Steps

1. ✅ **Run Database Migration** (see above)
2. ✅ Verify webhook is configured
3. ✅ Deploy to Vercel
4. ✅ Test checkout flow
5. ✅ Celebrate! 🎉

---

## 📚 Resources

- [LemonSqueezy Documentation](https://docs.lemonsqueezy.com)
- [LemonSqueezy API Reference](https://docs.lemonsqueezy.com/api)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)

---

**Need help?** Check the console logs or Vercel deployment logs for detailed error messages!
