@echo off
echo ========================================
echo Real Price Tracker - Supabase Setup
echo ========================================
echo.

echo Step 1: Installing Supabase dependencies...
cd backend
npm install @supabase/supabase-js
echo.

echo Step 2: Checking environment variables...
if not exist .env (
    echo Creating .env file...
    echo # Supabase Configuration > .env
    echo SUPABASE_URL=https://your-project-id.supabase.co >> .env
    echo SUPABASE_ANON_KEY=your-anon-key-here >> .env
    echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here >> .env
    echo. >> .env
    echo # Database Selection >> .env
    echo USE_SUPABASE=true >> .env
    echo USE_LOCAL_DB=false >> .env
    echo. >> .env
    echo # Other Configuration >> .env
    echo NODE_ENV=development >> .env
    echo PORT=3001 >> .env
    echo JWT_SECRET=your-super-secret-jwt-key >> .env
    echo FRONTEND_URL=http://localhost:3000 >> .env
    echo.
    echo ⚠️  Please update the .env file with your actual Supabase credentials
) else (
    echo .env file already exists
)
echo.

echo Step 3: Building the project...
npm run build
echo.

echo Step 4: Setup Complete!
echo.
echo Next steps:
echo 1. Create a Supabase project at https://supabase.com
echo 2. Get your project URL and API keys
echo 3. Update the .env file with your credentials
echo 4. Run the SQL schema in your Supabase dashboard
echo 5. Test the connection with: npm run dev
echo.
echo See SUPABASE_SETUP_GUIDE.md for detailed instructions
echo.

pause 