# Real Price Tracker

A Chrome Extension and web tool that helps online shoppers track prices, view price history, and get alerts when prices drop.

## Features

- 🛒 **One-Click Tracking**: Track any product on Amazon and AliExpress with a single click
- 📊 **Price History Charts**: Visualize price trends over time
- 🔔 **Smart Alerts**: Get notified when prices drop to your target
- 🔍 **Price Comparison**: Compare prices across different platforms
- 💰 **Affiliate Integration**: Built-in affiliate deals for monetization

## Project Structure

```
price-tracker/
├── extension/          # Chrome Extension
├── web-app/            # Web Dashboard (React)
├── backend/            # API Server (Node.js + Express + Firebase)
└── setup.md            # Step-by-step setup guide
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Firestore (NoSQL, serverless)
- **Chrome Extension**: Manifest V3
- **Real-time**: Firestore real-time updates

## Quick Start

1. Clone the repository
2. Install dependencies in each folder (`backend`, `web-app`, `extension`)
3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Create a Firestore database (in test mode for development)
   - Download your service account key and save it as `backend/src/config/serviceAccountKey.json`
   - Copy the example config in `backend/src/config/firebase.ts` and fill in your credentials
4. Start the backend: `npm run dev` (from the `backend` folder)
5. Start the web app: `npm run dev` (from the `web-app` folder)
6. Load the extension in Chrome

## Development Roadmap

- [x] Project setup and structure
- [ ] Chrome Extension core functionality
- [ ] Web scraping for Amazon and AliExpress
- [ ] Backend API development (with Firestore)
- [ ] Web dashboard UI
- [ ] Price tracking algorithms
- [ ] Notification system
- [ ] Affiliate integration
- [ ] Testing and deployment

## Contributing

This project is under active development. Feel free to contribute! 