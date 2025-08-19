# Real Price Tracker - Development Guide

## 🎯 Project Overview

Real Price Tracker is a comprehensive price tracking solution with:
- **Chrome Extension**: One-click price tracking on Amazon and AliExpress
- **Web Dashboard**: Beautiful interface for managing tracked products
- **Backend API**: Robust server for data storage and price monitoring
- **Smart Alerts**: Price drop notifications and alerts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome        │    │   Web Dashboard │    │   Backend API   │
│   Extension     │◄──►│   (React)       │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
│ • Product       │    │ • Dashboard     │    │ • REST API      │
│   Detection     │    │ • Charts        │    │ • Web Scraping  │
│ • Price         │    │ • Alerts        │    │ • Notifications │
│   Tracking      │    │ • Settings      │    │ • Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Root level
npm install

# Extension
cd extension && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# Web App
cd web-app && npm install && cd ..
```

### 2. Set Up Database

```bash
# Install PostgreSQL
# Create database
createdb price_tracker

# Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

### 3. Start Development Servers

```bash
# Start backend (Terminal 1)
cd backend && npm run dev

# Start web app (Terminal 2)
cd web-app && npm run dev

# Build extension (Terminal 3)
cd extension && npm run build
```

### 4. Load Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist` folder

## 📁 Project Structure

```
price-tracker/
├── extension/                 # Chrome Extension
│   ├── src/
│   │   ├── background.ts     # Service worker
│   │   ├── content.ts        # Content script
│   │   ├── popup.ts          # Extension popup
│   │   ├── injected.ts       # Page injection
│   │   └── icons/            # Extension icons
│   ├── manifest.json         # Extension manifest
│   └── webpack.config.js     # Build configuration
├── web-app/                  # React Web Dashboard
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── index.html           # Main HTML
│   └── vite.config.ts       # Vite configuration
├── backend/                  # Node.js API Server
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration
│   │   └── types/           # TypeScript types
│   └── migrations/          # Database migrations
└── docs/                    # Documentation
```

## 🔧 Development Workflow

### Chrome Extension Development

1. **Background Script** (`extension/src/background.ts`)
   - Handles extension lifecycle
   - Manages price tracking
   - Sends notifications

2. **Content Script** (`extension/src/content.ts`)
   - Injects into product pages
   - Extracts product information
   - Adds tracking buttons

3. **Popup** (`extension/src/popup.ts`)
   - Extension popup interface
   - Shows tracked products
   - Manages alerts

### Web Dashboard Development

1. **Components** (`web-app/src/components/`)
   - Reusable UI components
   - Layout components
   - Form components

2. **Pages** (`web-app/src/pages/`)
   - Dashboard overview
   - Product management
   - Alert settings

3. **Services** (`web-app/src/services/`)
   - API communication
   - WebSocket connections
   - Data management

### Backend API Development

1. **Routes** (`backend/src/routes/`)
   - REST API endpoints
   - Request validation
   - Response formatting

2. **Services** (`backend/src/services/`)
   - Business logic
   - Web scraping
   - Price monitoring

3. **Database** (`backend/src/config/`)
   - Database connection
   - Migrations
   - Query builders

## 🛠️ Key Features Implementation

### 1. Product Detection

```typescript
// extension/src/injected.ts
class ProductExtractor {
  extractAmazonProductInfo(): ProductInfo | null {
    // Extract product ID from URL
    const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    
    // Extract title, price, image
    const title = document.querySelector('#productTitle')?.textContent;
    const price = document.querySelector('.a-price-whole')?.textContent;
    
    return { id, title, price, platform: 'amazon' };
  }
}
```

### 2. Price Tracking

```typescript
// backend/src/services/priceTracker.ts
class PriceTracker {
  async checkPrice(productId: string): Promise<PriceUpdate> {
    const product = await this.getProduct(productId);
    const currentPrice = await this.scrapePrice(product.url);
    
    if (currentPrice !== product.price) {
      await this.updatePrice(productId, currentPrice);
      await this.checkAlerts(productId, currentPrice);
    }
  }
}
```

### 3. Real-time Updates

```typescript
// web-app/src/hooks/useWebSocket.ts
const useWebSocket = (productId: string) => {
  const [price, setPrice] = useState<number>();
  
  useEffect(() => {
    const socket = io('ws://localhost:3001');
    socket.emit('join-room', productId);
    
    socket.on('price-update', (data) => {
      setPrice(data.price);
    });
    
    return () => socket.disconnect();
  }, [productId]);
};
```

## 🧪 Testing

### Extension Testing
```bash
cd extension
npm run test
```

### Backend Testing
```bash
cd backend
npm run test
```

### Web App Testing
```bash
cd web-app
npm run test
```

## 📊 Database Schema

```sql
-- Products table
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  url TEXT NOT NULL,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT '$',
  platform VARCHAR(20) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price history table
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) REFERENCES products(id),
  price DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) REFERENCES products(id),
  target_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Extension Deployment
1. Build extension: `cd extension && npm run build`
2. Zip `dist` folder
3. Upload to Chrome Web Store

### Backend Deployment
1. Set up production environment variables
2. Build: `cd backend && npm run build`
3. Deploy to your preferred hosting (Heroku, AWS, etc.)

### Web App Deployment
1. Build: `cd web-app && npm run build`
2. Deploy `dist` folder to static hosting (Vercel, Netlify, etc.)

## 🔍 Debugging

### Extension Debugging
1. Open Chrome DevTools
2. Go to Extensions tab
3. Click "background page" for background script
4. Use `console.log` in content scripts

### Backend Debugging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check logs
tail -f logs/app.log
```

### Web App Debugging
1. Open browser DevTools
2. Check Network tab for API calls
3. Use React DevTools extension

## 📈 Performance Optimization

### Extension
- Lazy load content scripts
- Cache product data
- Minimize DOM queries

### Backend
- Implement caching (Redis)
- Use connection pooling
- Optimize database queries

### Web App
- Code splitting
- Lazy load components
- Optimize bundle size

## 🔐 Security Considerations

1. **Input Validation**: Validate all user inputs
2. **Rate Limiting**: Prevent API abuse
3. **CORS**: Configure proper CORS policies
4. **HTTPS**: Use HTTPS in production
5. **Environment Variables**: Never commit secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Support

If you need help:
1. Check the documentation
2. Look at existing issues
3. Create a new issue with details
4. Join our community

Happy coding! 🎉 