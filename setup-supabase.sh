#!/bin/bash

echo "========================================"
echo "Real Price Tracker - Supabase Setup"
echo "========================================"
echo

echo "Step 1: Installing Supabase dependencies..."
cd backend
npm install @supabase/supabase-js
echo

echo "Step 2: Checking environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
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
EOF
    echo
    echo "⚠️  Please update the .env file with your actual Supabase credentials"
else
    echo ".env file already exists"
fi
echo

echo "Step 3: Building the project..."
npm run build
echo

echo "Step 4: Setup Complete!"
echo
echo "Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Get your project URL and API keys"
echo "3. Update the .env file with your credentials"
echo "4. Run the SQL schema in your Supabase dashboard"
echo "5. Test the connection with: npm run dev"
echo
echo "See SUPABASE_SETUP_GUIDE.md for detailed instructions"
echo

read -p "Press Enter to continue..." 