# Real Price Tracker - Setup Guide

This guide will help you set up and run the Real Price Tracker project step by step.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for backend)
- Chrome browser (for extension)

## Project Structure

```
price-tracker/
├── extension/          # Chrome Extension
├── web-app/           # React Web Dashboard
├── backend/           # Node.js API Server
└── docs/             # Documentation
```

## Step 1: Install Dependencies

### Root Dependencies
```bash
npm install
```

### Extension Dependencies
```bash
cd extension
npm install
```

### Backend Dependencies
```bash
cd backend
npm install
```

### Web App Dependencies
```bash
cd web-app
npm install
```

## Step 2: Database Setup

1. Install PostgreSQL if you haven't already
2. Create a new database:
```sql
CREATE DATABASE price_tracker;
```

3. Set up environment variables in `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=price_tracker
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Step 3: Build and Run

### Backend API
```bash
cd backend
npm run dev
```
The API will be available at http://localhost:3001

### Web Dashboard
```bash
cd web-app
npm run dev
```
The web app will be available at http://localhost:3000

### Chrome Extension
```bash
cd extension
npm run build
```

Then load the extension in Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## Step 4: Usage

### Chrome Extension
1. Visit any Amazon or AliExpress product page
2. Click the "Track Price" button that appears
3. Set price alerts in the popup
4. View tracked products in the extension popup

### Web Dashboard
1. Open http://localhost:3000
2. View your tracked products
3. Set up price alerts
4. View price history charts

## Development Commands

### Root Level
```bash
npm run dev              # Start both backend and web app
npm run build            # Build all projects
npm run install:all      # Install all dependencies
```

### Extension
```bash
cd extension
npm run dev              # Watch mode for development
npm run build            # Build for production
```

### Backend
```bash
cd backend
npm run dev              # Start with nodemon
npm run build            # Build TypeScript
npm run migrate          # Run database migrations
```

### Web App
```bash
cd web-app
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=price_tracker
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

### Web App (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in the respective .env files
2. **Database connection failed**: Check PostgreSQL is running and credentials are correct
3. **Extension not loading**: Make sure you're loading the `dist` folder, not `src`
4. **CORS errors**: Check the CORS configuration in backend/src/index.ts

### Database Issues
```bash
# Reset database
cd backend
npm run migrate:rollback
npm run migrate
npm run seed
```

### Build Issues
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps

1. **Add Authentication**: Implement user registration and login
2. **Database Migrations**: Create proper database schema
3. **Web Scraping**: Implement actual price scraping logic
4. **Email Notifications**: Set up email alerts
5. **Deployment**: Deploy to production servers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter any issues, please:
1. Check the troubleshooting section
2. Look at the console logs
3. Create an issue with detailed information

Happy coding! 🚀 