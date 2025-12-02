# Price Tracker Mobile App

React Native mobile app for Price Tracker with Expo, built with TypeScript and dark theme.

## Tech Stack

- **Expo SDK 52** - React Native framework
- **TypeScript** - Type safety
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation (Stack + Tabs)
- **Supabase** - Backend & Authentication
- **Expo Notifications** - Push notifications
- **LemonSqueezy** - Payment processing

## Features

- 🌑 **Dark Mode Only** - Beautiful dark theme (#020617 background)
- 🔐 **Authentication** - Sign in/up with Supabase
- 📊 **Dashboard** - Track products and view stats
- 🔔 **Alerts** - Manage price alerts
- 👑 **Pro Upgrades** - LemonSqueezy integration
- 📈 **Price Charts** - Historical price tracking

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
LEMON_SQUEEZY_STORE_ID=212646
```

3. **Run the App**

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   └── ProScreen.tsx
│   ├── navigation/
│   │   └── index.tsx
│   └── services/
│       └── supabase.ts
├── global.css
├── App.tsx
├── app.json
├── tailwind.config.js
├── metro.config.js
└── package.json
```

## Dark Theme Colors

- **Background**: `#020617` (slate-950)
- **Card**: `#0f172a` (slate-900)
- **Border**: `#1e293b` (slate-800)
- **Primary**: `#6366f1` (indigo-500)

## Navigation

- **Auth Stack**: Login Screen
- **Main Tabs**:
  - Dashboard (Home)
  - Alerts (Bell)
  - Pro (Crown)
- **Modal Stack**: Product Details

## API Integration

The app integrates with the same backend API as the web app:
- Authentication via Supabase Auth
- Product tracking
- Price alerts
- Pro subscription via LemonSqueezy

## Notes

- App icon: Shopping bag with price tag 🛍️
- Splash screen: Dark blue background with white logo
- StatusBar: Light content (white text)
- All screens use dark theme only

## Development

This app was built to match the web app's premium dark aesthetic with:
- Gradient cards
- Glassmorphism effects
- Smooth animations
- Clean typography
- Consistent spacing

## License

MIT
