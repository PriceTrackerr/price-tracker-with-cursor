# Payment System Setup Guide

## 🎯 Recommended Payment Methods for International Customers

Based on your international customer base, here are the **best payment methods** for your customers:

### 1. **Stripe (Highly Recommended for International)**
- **Why it's best**: Most popular payment processor globally
- **Pros**: Supports 135+ currencies, excellent developer experience, competitive fees
- **Cons**: Requires business verification
- **Website**: https://stripe.com/

### 2. **PayPal (For International Customers)**
- **Why it's good**: Global reach, trusted worldwide
- **Pros**: Works everywhere, easy integration, familiar to users
- **Cons**: Higher fees than Stripe

### 3. **Additional Options**
- **Apple Pay/Google Pay**: Through Stripe integration
- **Local Payment Methods**: Stripe supports regional payment methods

## 🚀 Quick Setup

### 1. Environment Variables

Add these to your `backend/.env` file:

```env
# Stripe (Recommended for International)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# PayPal (For International Customers)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Change to 'live' for production

# Frontend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

### 2. Payment Gateway Registration

#### Stripe Setup (Recommended)
1. Go to [Stripe.com](https://stripe.com/)
2. Sign up for a business account
3. Complete business verification
4. Get your API keys from the dashboard
5. Set up webhook URL: `https://yourdomain.com/api/webhooks/stripe`
6. Install Stripe: `npm install stripe`

#### PayPal Setup
1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Create a PayPal Business account
3. Create a new app in the developer dashboard
4. Get your Client ID and Secret
5. Set up webhook URL: `https://yourdomain.com/api/webhooks/paypal`

## 🎉 Free Period Strategy

### **First 6 Months: Completely FREE**
- **All users get Premium features for 6 months**
- **No payment required**
- **Build user base and prove value**
- **After 6 months, users choose a paid plan**

## 💰 Future Subscription Plans (After Free Period)

### Free Plan (After Trial)
- **Price**: $0/month
- **Features**: 10 tracked products, limited alerts (1-2/month), 30-day history

### Basic Monthly
- **Price**: $3.00/month
- **Features**: 50 tracked products, daily alerts, 60-day history

### Basic Yearly (Save 17%)
- **Price**: $30.00/year
- **Features**: Same as monthly plan but with annual discount

### Premium Monthly
- **Price**: $8.00/month
- **Features**: 200 tracked products, instant alerts, 365-day history, data export, priority support

### Premium Yearly (Save 17%)
- **Price**: $80.00/year
- **Features**: Same as monthly plan but with annual discount

### **Competitive Pricing Strategy:**
- **Free Plan**: $0/month (10 products, limited alerts)
- **Basic**: $3.00/month (50 products, daily alerts)
- **Premium**: $8.00/month (200 products, instant alerts)
- **Annual discounts**: 17% savings
- **Free period**: 6 months to build trust

## 🔗 API Endpoints

### Subscription Management
- `GET /api/payments/plans` - Get available subscription plans
- `GET /api/payments/subscription` - Get current user subscription
- `POST /api/payments/subscribe` - Initialize subscription payment
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/cancel` - Cancel subscription

### Affiliate System
- `GET /api/payments/affiliate/dashboard` - Get affiliate dashboard
- `POST /api/payments/affiliate/enable` - Enable affiliate program
- `POST /api/payments/affiliate/payout` - Request payout

### Webhooks
- `POST /api/webhooks/stripe` - Stripe payment webhook
- `POST /api/webhooks/paypal` - PayPal payment webhook

## 🛠️ Implementation Steps

### 1. Install Dependencies
```bash
cd backend
npm install uuid @types/uuid stripe
```

### 2. Test Payment Flow
1. Start your backend server
2. Create a test user
3. Try subscribing with different payment methods
4. Check webhook processing

### 3. Production Deployment
1. Set up SSL certificates (required for webhooks)
2. Configure production environment variables
3. Set up proper webhook URLs
4. Test with small amounts first

## 🔒 Security Considerations

### Webhook Security
- Implement proper signature verification for each payment gateway
- Use HTTPS for all webhook endpoints
- Validate payment amounts and currencies
- Log all webhook events for debugging

### Data Protection
- Encrypt sensitive payment data
- Follow PCI DSS guidelines if handling credit cards
- Implement proper error handling
- Regular security audits

## 💡 Best Practices

### For Ethiopian Customers
1. **Prioritize Chapa** - It's the most trusted local option
2. **Offer ETB pricing** - Local currency is preferred
3. **Provide clear instructions** - Many users are new to online payments
4. **Support multiple banks** - Different users prefer different banks

### For International Customers
1. **Use PayPal** - Most recognized globally
2. **Offer USD pricing** - International standard
3. **Clear pricing** - No hidden fees
4. **Multiple currencies** - Consider adding EUR support

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving payments**
   - Check webhook URL is accessible
   - Verify signature verification
   - Check server logs for errors

2. **Payment not completing**
   - Verify API keys are correct
   - Check payment gateway dashboard
   - Test with sandbox mode first

3. **Subscription not activating**
   - Check webhook processing
   - Verify user database updates
   - Check payment status in database

### Support Contacts

- **Chapa**: tech@chapa.co
- **PayPal**: Developer support portal
- **WeBirr**: Contact through their website

## 📈 Monitoring

### Key Metrics to Track
- Payment success rate by method
- Average subscription value
- Affiliate commission payouts
- Webhook delivery success rate
- Customer support tickets

### Recommended Tools
- Payment gateway dashboards
- Server monitoring (Uptime Robot)
- Error tracking (Sentry)
- Analytics (Google Analytics)

## 🎯 Next Steps

1. **Set up payment gateways** following the guide above
2. **Test with small amounts** before going live
3. **Implement frontend components** for subscription management
4. **Add affiliate dashboard** for partners
5. **Set up monitoring** and alerting
6. **Plan marketing strategy** for premium features

## 💰 Revenue Optimization

### Pricing Strategy
- Start with competitive pricing
- Offer annual discounts
- Consider freemium model
- A/B test different price points

### Affiliate Program
- 10% commission rate
- Minimum $50 payout
- Multiple payout methods
- Automated tracking

### Customer Retention
- Email marketing for renewals
- Feature usage analytics
- Customer feedback collection
- Loyalty programs

This payment system is designed to work optimally for your Ethiopian location while also supporting international customers. The combination of Chapa (local), PayPal (international), and WeBirr (alternative) gives you comprehensive coverage for different customer segments. 