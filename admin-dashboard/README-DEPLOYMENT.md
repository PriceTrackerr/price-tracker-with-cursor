# Admin Dashboard Deployment Guide

## Environment Variables

To deploy the admin-dashboard on Vercel, you need to set the following environment variable:

### Required Environment Variable

**VITE_API_URL**: The base URL of your backend API
- Production: `https://price-tracker-with-cursor-web-app-s.vercel.app`
- Development: `http://localhost:3001` (optional, defaults to this if not set)

### How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://price-tracker-with-cursor-web-app-s.vercel.app`
   - **Environment**: Production, Preview, Development (select all)
4. Save and redeploy

## API Configuration

The admin-dashboard uses a centralized API utility (`src/utils/api.ts`) that:
- Automatically uses the production API URL in production builds
- Falls back to `VITE_API_URL` environment variable if set
- Uses localhost in development mode

All API calls in the codebase use the `apiUrl()` helper function to ensure correct URLs.

## Deployment Domains

- **Admin Dashboard**: `price-tracker-with-cursor.vercel.app`
- **Web App**: `price-tracker-with-cursor-web-app.vercel.app`
- **Backend API**: `price-tracker-with-cursor-web-app-s.vercel.app`

## Login Credentials

Default admin credentials:
- **Email**: `realpricetracker94@gmail.com`
- **Password**: `admin123`

## Troubleshooting

If you can't sign in after deployment:

1. **Check Environment Variables**: Ensure `VITE_API_URL` is set in Vercel
2. **Check Browser Console**: Look for CORS errors or API connection issues
3. **Verify API Endpoint**: Test the login endpoint directly:
   ```
   POST https://price-tracker-with-cursor.onrender.com/api/users/login
   ```
4. **Check Network Tab**: Verify that API calls are going to the correct domain

