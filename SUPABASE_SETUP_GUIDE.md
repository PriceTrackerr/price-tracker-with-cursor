# Supabase Setup Guide for Real Price Tracker

This guide will help you set up Supabase as the database for your Real Price Tracker application.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher
3. **Git**: For version control

## Step 1: Create a Supabase Project

### 1.1 Sign Up/Login
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"

### 1.2 Create Project
1. **Organization**: Select your organization
2. **Name**: Enter a project name (e.g., `price-tracker-db`)
3. **Database Password**: Create a strong password (save this!)
4. **Region**: Choose the closest region to your users
5. **Pricing Plan**: Start with the free plan
6. Click "Create new project"

### 1.3 Wait for Setup
- Supabase will take 1-2 minutes to set up your project
- You'll receive an email when it's ready

## Step 2: Get Your Supabase Credentials

### 2.1 Access Project Settings
1. Go to your project dashboard
2. Click on the gear icon (Settings) in the left sidebar
3. Click "API"

### 2.2 Copy Credentials
You'll need these values:

```
Project URL: https://your-project-id.supabase.co
Anon Key: your-anon-key-here
Service Role Key: your-service-role-key-here
```

**⚠️ Important**: Keep your Service Role Key secret - it has admin privileges!

## Step 3: Set Up Database Schema

### 3.1 Access SQL Editor
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New query"

### 3.2 Run the Schema
1. Copy the entire contents of `backend/supabase-schema.sql`
2. Paste it into the SQL editor
3. Click "Run" to execute the schema

### 3.3 Verify Tables
1. Go to "Table Editor" in the left sidebar
2. You should see all the tables created:
   - users
   - products
   - alerts
   - notifications
   - price_history
   - payments
   - affiliate_transactions
   - payout_requests
   - subscription_plans
   - coupons
   - coupon_stacks
   - price_guarantees
   - expert_curators
   - shared_watchlists
   - community_votes
   - deal_comments
   - global_market_data
   - automation_rules

## Step 4: Configure Environment Variables

### 4.1 Create Environment File
Create or update your `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Selection
USE_SUPABASE=true
USE_LOCAL_DB=false

# Other Configuration
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

### 4.2 For Production (Vercel)
When deploying to Vercel, add these environment variables in your Vercel dashboard:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
USE_SUPABASE=true
USE_LOCAL_DB=false
```

## Step 5: Install Dependencies

### 5.1 Install Supabase Client
```bash
cd backend
npm install @supabase/supabase-js
```

### 5.2 Verify Installation
```bash
npm list @supabase/supabase-js
```

## Step 6: Test the Connection

### 6.1 Start the Backend
```bash
cd backend
npm run dev
```

### 6.2 Check Logs
You should see:
```
✅ Using Supabase as database
🚀 Server running on port 3001
```

### 6.3 Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test database connection
curl http://localhost:3001/test-storage
```

## Step 7: Configure Row Level Security (RLS)

### 7.1 Enable RLS Policies
The schema includes basic RLS policies, but you may want to customize them:

1. Go to "Authentication" → "Policies" in your Supabase dashboard
2. Review and modify policies as needed
3. Test with different user roles

### 7.2 Custom Policies (Optional)
You can create custom policies for specific use cases:

```sql
-- Example: Allow users to view public products
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
USING (is_public = true);

-- Example: Allow users to manage their own data
CREATE POLICY "Users can manage own data" 
ON users FOR ALL 
USING (auth.uid()::text = id::text);
```

## Step 8: Set Up Authentication (Optional)

### 8.1 Enable Email Auth
1. Go to "Authentication" → "Settings"
2. Enable "Email auth"
3. Configure email templates

### 8.2 Configure OAuth (Optional)
1. Go to "Authentication" → "Providers"
2. Enable providers like Google, GitHub, etc.
3. Add your OAuth credentials

## Step 9: Monitor and Optimize

### 9.1 Database Monitoring
1. Go to "Database" → "Logs" to monitor queries
2. Check "Database" → "Usage" for performance metrics
3. Set up alerts for high usage

### 9.2 Performance Optimization
1. Review and optimize slow queries
2. Add indexes for frequently accessed columns
3. Monitor connection pool usage

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify your Supabase URL and keys
   - Check if your IP is allowed (if using IP restrictions)
   - Ensure the project is active

2. **Schema Errors**:
   - Check the SQL syntax in the schema file
   - Verify all extensions are enabled
   - Check for conflicting table names

3. **RLS Policy Issues**:
   - Review your RLS policies
   - Test with different user roles
   - Check the Supabase logs for policy violations

4. **Performance Issues**:
   - Add indexes for frequently queried columns
   - Optimize your queries
   - Consider upgrading your Supabase plan

### Debug Commands

```bash
# Test Supabase connection
curl -X GET "https://your-project-id.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"

# Check environment variables
node -e "console.log(process.env.SUPABASE_URL)"

# Test database operations
npm run test:supabase
```

## Migration from File Storage

### 9.1 Export Current Data
If you have existing data in file storage:

```bash
# Export current data
node scripts/export-to-json.js

# Import to Supabase
node scripts/import-from-json.js
```

### 9.2 Verify Migration
1. Check that all data was imported correctly
2. Test all API endpoints
3. Verify relationships between tables

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Service Role Key**: Keep it secure and rotate regularly
3. **RLS Policies**: Always enable RLS for user data
4. **API Keys**: Use different keys for different environments
5. **Backup**: Set up regular database backups

## Next Steps

1. **Set up monitoring**: Configure alerts and logging
2. **Optimize performance**: Add indexes and optimize queries
3. **Scale up**: Upgrade your Supabase plan as needed
4. **Backup strategy**: Set up automated backups
5. **Security audit**: Review and update security policies

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Real Price Tracker Issues](https://github.com/your-repo/issues)

---

**🎉 Congratulations!** Your Real Price Tracker is now using Supabase as the database. You have a scalable, secure, and performant database solution. 