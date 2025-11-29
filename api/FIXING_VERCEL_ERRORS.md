# Fixing Vercel Cron Errors

## Errors Found
1. ❌ `column products.last_checked does not exist` - Database migration not run
2. ⚠️ `All providers failed` - Price scraper can't find some products

## Fixes Applied

### 1. Database Migration (Run This First!)

**Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/_/sql

Run the updated migration in `api/migrations/add_last_checked_column.sql`:
- Adds `last_checked` column to products table
- Creates index for performance
- Seeds existing products with timestamp (prevents all updating at once)

### 2. Improved Cron Error Handling

**Updated `api/src/routes/cron.ts`**:
- Wraps `searchProducts()` in try-catch
- If provider fails, logs warning and updates `last_checked` anyway
- Prevents products from getting stuck in infinite retry loop
- Better error messages for debugging

## How It Works Now

**Before (Broken)**:
```
Product scrape → Provider fails → Error thrown → last_checked NOT updated → Retries forever
```

**After (Fixed)**:
```
Product scrape → Provider fails → Log warning → Update last_checked → Skip to next product
```

## Next Steps

1. **Run the migration** in Supabase SQL Editor
2. **Redeploy API** to Vercel (migration is in code, it will auto-deploy)
3. **Test cron**: Visit `your-api.vercel.app/api/cron/update-prices`

The "All providers failed" warning will still appear but won't break the cron job anymore.
