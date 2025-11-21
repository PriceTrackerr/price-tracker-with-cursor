# Project Tech Stack Overview

## Frontend
- **Framework**: React 18 (TypeScript) with Vite tooling.
- **Routing & State**: `react-router-dom` for routing, React Context for auth/session state.
- **Styling & UI**: Tailwind CSS utility classes, custom components, `lucide-react` icons, `react-hot-toast` notifications.
- **Charts & Visualization**: `recharts` for price history and analytics.
- **Internationalization**: `react-i18next`.
- **Build Tools**: Vite, ESLint, TypeScript, Vitest (unit tests).

## Backend
- **Runtime**: Node.js (Express).
- **Language**: TypeScript compiled to JavaScript for deployment.
- **Database**: Supabase Postgres with Row Level Security and custom tables such as `products`, `tracked_products`, `product_matches`, `global_product_matches`.
- **Auth**: Supabase Auth (email/password + OAuth providers) with JWT tokens; refresh flow exposed via `/api/users/refresh`.
- **External Services**:
  - **Serper (Google Shopping)** for real product search and match scraping.
  - **Gmail SMTP via Nodemailer** for transactional emails (welcome, price-drop alerts, password reset).
- **Caching & Matching**:
  - In-memory match-count cache inside `/api/products`.
  - Shared `global_product_matches` table for Buyhatke-style Serper results.
- **APIs**: REST endpoints under `/api`, including authentication, products, alerts, product matching, and subscription features.

## Browser Extension
- **Platform**: Chrome MV3 extension (TypeScript with Webpack bundling).
- **Functionality**: Captures product data directly from supported stores, talks to the backend via authenticated fetch calls, and syncs tokens through Chrome storage messaging.

## Deployment & Infrastructure
- **Hosting**: Vercel (separate deployments for `web-app` frontend and `api` backend).
- **Environment Variables**:
  - Frontend `VITE_*` vars (e.g., `VITE_API_BASE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - Backend secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SERPER_API_KEY`, SMTP creds, `APP_BASE_URL`, etc.).
- **Build Pipeline**: Vercel automatically runs `npm install` + build scripts for each project.

## Languages & Tooling Summary
- **TypeScript** everywhere (frontend, backend, extension) with strict typings.
- **SQL** for Supabase migrations / schema DRY scripts.
- **Shell scripts / batch files** for local setup (e.g., `switch-to-local.bat`, `setup-supabase.sh`).

This setup gives your teammates a quick snapshot of the full stack, deployment model, and key third-party dependencies. Feel free to share this document as-is.*** End Patch

