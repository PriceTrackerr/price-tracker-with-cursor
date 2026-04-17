Problem Summary:

The checkout flow worked perfectly when the backend was hosted on Vercel.
After moving the backend to Render.com, the frontend (still on Vercel) now shows "A processing error occurred" when trying to create a Lemon Squeezy checkout.
The backend endpoint /api/subscriptions/create-checkout is actually working correctly — Render logs show status 201, a valid checkout URL is generated and extracted.
All environment variables were copied correctly from Vercel to Render.
Supabase and Groq API calls are working fine on Render.
The only change was switching the backend hosting from Vercel to Render.

Root Cause:
This is almost certainly a CORS issue caused by the cross-origin request (Vercel frontend → Render backend). Same-origin worked on Vercel, but now different domains require proper CORS headers.
Task:
Fix the CORS configuration and ensure the checkout response is properly handled.
Please provide:

Backend fixes (Render side):
Add proper CORS middleware that allows the Vercel frontend domain: https://price-tracker-with-cursor-web-app.vercel.app
Also allow http://localhost:3000 for local development
Handle OPTIONS preflight requests
Update the /api/subscriptions/create-checkout route with better error handling and clear JSON response

Frontend fixes (Vercel side):
Show the correct fetch call to the new Render backend URL
Properly extract the checkout url from the response
Open the checkout using the recommended Lemon Squeezy method (preferably overlay if possible, or redirect)

Give me:
Exact code to add/replace in the backend (including CORS setup)
Exact updated code for the frontend checkout button/handler
Any redeploy instructions


Assume the backend is Node.js + Express (adjust if it's different). Keep the solution minimal, clean, and focused only on fixing the "processing error".
Make it production-ready and include comments where helpful.