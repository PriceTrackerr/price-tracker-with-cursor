@echo off
echo Switching to Local Storage for Development...

REM Create .env file with local storage settings
echo # Development Mode - Use Local Storage > .env
echo USE_LOCAL_DB=true >> .env
echo USE_SUPABASE=false >> .env
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

echo ✅ Local storage configuration created!
echo.
echo Now you can start the server with: npm run dev
echo The server will use local file storage instead of Supabase.
echo.
pause 