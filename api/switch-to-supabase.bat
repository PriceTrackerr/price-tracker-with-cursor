@echo off
echo Switching to Supabase for Production...

REM Create .env file with Supabase settings
echo # Production Mode - Use Supabase > .env
echo USE_LOCAL_DB=false >> .env
echo USE_SUPABASE=true >> .env
echo. >> .env
echo # OpenAI API (Free $5 credits monthly) >> .env
echo OPENAI_API_KEY=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 >> .env
echo. >> .env
echo # Currency APIs (Free tiers) >> .env
echo EXCHANGERATE_API_KEY=a324c5eff0ce0c104d1df9e5 >> .env
echo FIXER_API_KEY=9527c9f75f096d300c62548e5f8a6044 >> .env
echo CURRENCYLAYER_API_KEY=b10917875fb4eea15bc42446ae5f5ae0 >> .env
echo. >> .env
echo # eBay API (Under review - add when ready) >> .env
echo EBAY_CLIENT_ID=MichaelA-PriceTra-PRD-c9d072d4d-5c6bbbb8 >> .env
echo EBAY_CLIENT_SECRET=PRD-9d072d4d02bc-d7fa-4e10-b02d-3447 >> .env
echo. >> .env
echo # Other Platform APIs >> .env
echo AMAZON_ASSOCIATE_TAG=pricetrack0f8-20 >> .env
echo. >> .env
echo # AliExpress via RapidAPI (optional) >> .env
echo RAPIDAPI_KEY=12ddfcd1a1msh8c271248bb814c5p1eedf8jsnf495dd75c6ea >> .env
echo. >> .env
echo # Reddit API (for community features) >> .env
echo REDDIT_CLIENT_ID=HYMT_fJhg2tIZlJvSuSyAA >> .env
echo REDDIT_CLIENT_SECRET=lkIYhLBvlW3aA_u7iYonKoUG6oyzkA >> .env
echo. >> .env
echo # Existing Backend Keys >> .env
echo GMAIL_USER=realpricetracker94@gmail.com >> .env
echo GMAIL_APP_PASSWORD=idze uxqv qeag lvdn >> .env
echo JWT_SECRET=mysecret5499 >> .env
echo. >> .env
echo # Add your Supabase credentials here: >> .env
echo # SUPABASE_URL=your_supabase_url >> .env
echo # SUPABASE_SERVICE_ROLE_KEY=your_service_role_key >> .env
echo # SUPABASE_ANON_KEY=your_anon_key >> .env

echo ✅ Supabase configuration created!
echo.
echo IMPORTANT: You need to add your Supabase credentials to the .env file:
echo - SUPABASE_URL
echo - SUPABASE_SERVICE_ROLE_KEY  
echo - SUPABASE_ANON_KEY
echo.
echo Then start the server with: npm run dev
echo.
pause 