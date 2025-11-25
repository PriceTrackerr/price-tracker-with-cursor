# 🏗️ Price Tracker Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "User Interfaces"
        A[Web Browser<br/>React App]
        B[Chrome Extension]
        C[Admin Dashboard]
    end
    
    subgraph "Backend Services"
        D[Express API<br/>Node.js + TypeScript]
        E[Cron Jobs<br/>Price Checker]
        F[Email Service<br/>Nodemailer]
    end
    
    subgraph "External Services"
        G[Supabase<br/>Database + Auth]
        H[Serper API<br/>Product Matching]
        I[ScrapingBee<br/>Web Scraping]
        J[Gmail SMTP<br/>Email Delivery]
        K[LemonSqueezy<br/>Payments - TODO]
    end
    
    subgraph "E-commerce Platforms"
        L[Amazon]
        M[AliExpress]
        N[eBay]
        O[Walmart]
        P[Target]
        Q[Best Buy]
        R[Shein]
    end
    
    A -->|API Calls| D
    B -->|Track Product| D
    C -->|Admin Actions| D
    
    D -->|Store Data| G
    D -->|Search Products| H
    D -->|Scrape Pages| I
    D -->|Send Emails| F
    
    F -->|SMTP| J
    
    E -->|Check Prices| D
    E -->|Trigger Alerts| F
    
    B -->|Extract Data| L
    B -->|Extract Data| M
    B -->|Extract Data| N
    B -->|Extract Data| O
    B -->|Extract Data| P
    B -->|Extract Data| Q
    B -->|Extract Data| R
    
    D -->|Scrape| L
    D -->|Scrape| M
    D -->|Scrape| N
    D -->|Scrape| O
    D -->|Scrape| P
    D -->|Scrape| Q
    D -->|Scrape| R
    
    style K fill:#ff9999
    style A fill:#99ccff
    style B fill:#99ccff
    style C fill:#99ccff
    style D fill:#99ff99
    style G fill:#ffcc99
```

## Data Flow

### 1. Product Tracking Flow
```mermaid
sequenceDiagram
    participant User
    participant Extension
    participant API
    participant Database
    participant Scraper
    
    User->>Extension: Click "Track This Product"
    Extension->>Extension: Extract product data
    Extension->>API: POST /api/products/track
    API->>Database: Save product
    API->>Scraper: Get initial price
    Scraper-->>API: Return price data
    API->>Database: Save price history
    API-->>Extension: Success response
    Extension-->>User: "Product tracked!"
```

### 2. Price Alert Flow
```mermaid
sequenceDiagram
    participant Cron
    participant API
    participant Database
    participant Scraper
    participant Email
    participant User
    
    Cron->>API: Trigger price check
    API->>Database: Get tracked products
    Database-->>API: Product list
    
    loop For each product
        API->>Scraper: Get current price
        Scraper-->>API: Current price
        API->>API: Compare with alert threshold
        
        alt Price dropped below threshold
            API->>Database: Save new price
            API->>Email: Send alert email
            Email->>User: "Price dropped! 🎉"
        end
    end
```

### 3. User Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Supabase
    
    User->>WebApp: Enter credentials
    WebApp->>API: POST /api/users/login
    API->>Supabase: Verify credentials
    Supabase-->>API: JWT token
    API-->>WebApp: Return token + user data
    WebApp->>WebApp: Store token
    WebApp-->>User: Redirect to dashboard
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ TRACKED_PRODUCTS : tracks
    USERS ||--o{ ALERTS : creates
    PRODUCTS ||--o{ TRACKED_PRODUCTS : "is tracked in"
    PRODUCTS ||--o{ PRICE_HISTORY : has
    PRODUCTS ||--o{ PRODUCT_MATCHES : has
    
    USERS {
        uuid id PK
        string email
        string password_hash
        timestamp created_at
        string subscription_tier
    }
    
    PRODUCTS {
        uuid id PK
        string title
        string url
        string platform
        decimal current_price
        string image_url
        timestamp last_checked
    }
    
    TRACKED_PRODUCTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp tracked_at
    }
    
    PRICE_HISTORY {
        uuid id PK
        uuid product_id FK
        decimal price
        timestamp recorded_at
    }
    
    ALERTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        decimal target_price
        boolean is_active
    }
    
    PRODUCT_MATCHES {
        uuid id PK
        uuid product_id FK
        string matched_url
        decimal matched_price
        string platform
    }
```

## Technology Stack Breakdown

### Frontend Stack
```
React 18
├── TypeScript (Type safety)
├── Vite (Build tool)
├── React Router (Navigation)
├── Tailwind CSS (Styling)
├── Recharts (Price charts)
├── Lucide React (Icons)
├── React Hot Toast (Notifications)
└── React i18next (Internationalization)
```

### Backend Stack
```
Node.js + Express
├── TypeScript
├── Supabase Client (Database)
├── Axios (HTTP requests)
├── Cheerio (HTML parsing)
├── Playwright (Browser automation)
├── Node-cron (Scheduled tasks)
├── Nodemailer (Email)
├── JWT (Authentication)
├── Helmet (Security)
└── Express Rate Limit (API protection)
```

### Extension Stack
```
Chrome MV3
├── TypeScript
├── Webpack (Bundler)
└── Chrome APIs (Storage, Tabs, etc.)
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Create new account
- `POST /api/users/login` - User login
- `POST /api/users/refresh` - Refresh JWT token
- `POST /api/users/forgot-password` - Password reset request
- `POST /api/users/reset-password` - Reset password

### Products
- `GET /api/products` - Get user's tracked products
- `POST /api/products/track` - Track new product
- `DELETE /api/products/:id` - Untrack product
- `GET /api/products/:id/history` - Get price history

### Alerts
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### Product Matching
- `POST /api/product-matching/search` - Search for product matches
- `GET /api/product-matching/:productId` - Get matches for product

### Payments (To Be Implemented)
- `POST /api/payments/create-checkout` - Create checkout session
- `POST /api/payments/webhook` - Handle payment webhooks
- `GET /api/payments/subscription` - Get subscription status

## Deployment Architecture

```mermaid
graph LR
    subgraph "Vercel - Frontend"
        A[Web App<br/>React Build]
    end
    
    subgraph "Vercel - Backend"
        B[API<br/>Express Server]
    end
    
    subgraph "Supabase Cloud"
        C[PostgreSQL<br/>Database]
        D[Auth Service]
    end
    
    subgraph "Chrome Web Store"
        E[Extension<br/>Published]
    end
    
    A -->|API Calls| B
    B -->|Queries| C
    B -->|Auth| D
    E -->|API Calls| B
```

## Environment Variables

### Backend (api/.env)
```bash
# Database
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

# Authentication
JWT_SECRET=...

# Email
GMAIL_USER=...
GMAIL_APP_PASSWORD=...

# Scraping
SERPER_API_KEY=...
SCRAPINGBEE_KEY=...

# Payments (To Add)
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
```

### Frontend (web-app/.env)
```bash
VITE_API_BASE=https://...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

## Security Features

1. **Authentication**: JWT tokens with Supabase Auth
2. **Rate Limiting**: Prevents API abuse
3. **Helmet**: Security headers
4. **CORS**: Controlled cross-origin requests
5. **Environment Variables**: Secrets not in code
6. **Row Level Security**: Database-level permissions

## Performance Optimizations

1. **Caching**: In-memory cache for product matches
2. **Compression**: Gzip compression on API responses
3. **Lazy Loading**: React components loaded on demand
4. **Database Indexing**: Fast queries on Supabase
5. **CDN**: Static assets served via Vercel CDN

---

This architecture supports:
- ✅ Scalability (serverless deployment)
- ✅ Security (multiple layers)
- ✅ Performance (caching + CDN)
- ✅ Reliability (managed services)
- ✅ Maintainability (TypeScript + modular code)
