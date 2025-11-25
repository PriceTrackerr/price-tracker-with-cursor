# 🛒 Price Tracker - Project Overview

Welcome to your Price Tracker project! This document provides a comprehensive overview of your application.

## 📋 Project Summary

A full-stack price tracking application that helps users monitor prices across 7 major e-commerce platforms:
- **Amazon** 🛍️
- **AliExpress** 🌐
- **eBay** 🏪
- **Walmart** 🏬
- **Target** 🎯
- **Best Buy** 💻
- **Shein** 👗

## 🏗️ Architecture

### 1. **Web Application** (`/web-app`)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router DOM
- **Charts**: Recharts for price history visualization
- **Notifications**: React Hot Toast
- **i18n**: React i18next for internationalization

**Key Features**:
- User authentication & profile management
- Product dashboard with price history
- Price alert management
- Multi-language support
- Responsive design

### 2. **Backend API** (`/api`)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Email**: Nodemailer with Gmail SMTP
- **Scraping**: Serper API, ScrapingBee, Playwright
- **Cron Jobs**: Node-cron for scheduled price checks

**Key Features**:
- RESTful API endpoints
- Product tracking & matching
- Price alert system
- Email notifications
- Rate limiting & security (Helmet)
- Real-time updates (Socket.io)

### 3. **Chrome Extension** (`/extension`)
- **Platform**: Chrome Manifest V3
- **Build Tool**: Webpack
- **Language**: TypeScript

**Key Features**:
- One-click product tracking from supported platforms
- Automatic product data extraction
- Syncs with backend via authenticated API calls
- Chrome storage for token management

### 4. **Admin Dashboard** (`/admin-dashboard`)
- Administrative interface for managing users, products, and system settings

## 📊 Database Schema (Supabase)

### Core Tables:
- `users` - User accounts and profiles
- `products` - Tracked products
- `tracked_products` - User-product tracking relationships
- `product_matches` - Product matching data
- `global_product_matches` - Shared product match cache
- `price_history` - Historical price data
- `alerts` - Price alert configurations

## 🔑 Current Configuration

### Environment Variables

**Backend** (`api/.env`):
- ✅ Supabase configured
- ✅ Gmail SMTP configured
- ✅ Serper API for product matching
- ✅ ScrapingBee for web scraping
- ✅ eBay API credentials
- ✅ Amazon Associate tag
- ⚠️ **ISSUE**: Merge conflict detected (lines 55-67)

**Frontend** (`web-app/.env`):
- ✅ API base URL configured
- ✅ Supabase credentials configured

## 🚀 Deployment

### Current Setup:
- **Frontend**: Vercel (`https://price-tracker-with-cursor-web-app.vercel.app`)
- **Backend**: Vercel (`https://price-tracker-with-cursor-web-app-s.vercel.app/api`)
- **Database**: Supabase Cloud

### Build Commands:
```bash
# Install all dependencies
npm install

# Run development servers
npm run dev  # Runs both backend and web-app

# Build for production
npm run build  # Builds all workspaces

# Build individual components
npm run build:web
npm run build:backend
npm run build:extension
```

## 🐛 Known Issues

1. **Merge conflict in `api/.env`** - Needs resolution
2. **Payment integration pending** - LemonSqueezy integration required
3. **Testing needed** - All platforms need verification
4. **Extension testing** - Verify functionality across all 7 platforms

## 📦 Next Steps

### Priority 1: Fix Critical Issues
1. Resolve `.env` merge conflict
2. Test all platform scrapers
3. Verify extension functionality

### Priority 2: Payment Integration
1. Set up LemonSqueezy account
2. Create subscription plans
3. Implement payment endpoints
4. Add subscription UI

### Priority 3: Testing & Launch
1. End-to-end testing
2. Bug fixes
3. Documentation
4. Chrome Web Store submission

## 📞 Contact

**Email**: realpricetracker94@gmail.com

---

**Status**: 🚧 Under Active Development
**Target Launch**: Soon™
