# Backend Scripts

This directory contains utility scripts for managing the price tracker backend.

## 🛠️ Essential Scripts

### `checkEnv.js`
- **Purpose**: Validates environment variables and configuration
- **Usage**: `node scripts/checkEnv.js`
- **When to use**: Before starting the server to ensure proper setup

### `resetPriceDrops.js`
- **Purpose**: Resets all users' seen price drops to 0
- **Usage**: `node scripts/resetPriceDrops.js`
- **When to use**: When you want to reset price drop counters for all users

### `deleteUser.js`
- **Purpose**: Deletes a user and all their associated data
- **Usage**: `node scripts/deleteUser.js <email>`
- **When to use**: For user management and cleanup

### `removeProductMatching.js`
- **Purpose**: Removes product matching data
- **Usage**: `node scripts/removeProductMatching.js`
- **When to use**: For cleaning up product matching data

## 📊 Data Management Scripts

### `clearAndCreatePriceDrops.js`
- **Purpose**: Clears all price drops and creates new ones for testing
- **Usage**: `node scripts/clearAndCreatePriceDrops.js`
- **When to use**: For testing price drop functionality

### `createPriceDrops.js`
- **Purpose**: Creates price drops for all products
- **Usage**: `node scripts/createPriceDrops.js`
- **When to use**: For testing price drop detection

### `createPriceDropsForUser.js`
- **Purpose**: Creates price drops for a specific user
- **Usage**: `node scripts/createPriceDropsForUser.js <email>`
- **When to use**: For testing price drops for a specific user

### `createProductsForUser.js`
- **Purpose**: Creates test products for a specific user
- **Usage**: `node scripts/createProductsForUser.js <email>`
- **When to use**: For testing with sample products

## 📧 Email Testing Scripts

### `sendTestEmail.js`
- **Purpose**: Sends a test email
- **Usage**: `node scripts/sendTestEmail.js`
- **When to use**: For testing email functionality

### `triggerPriceDrop.js`
- **Purpose**: Triggers a price drop notification
- **Usage**: `node scripts/triggerPriceDrop.js`
- **When to use**: For testing price drop notifications

## 🚀 Quick Start

1. **Check environment**: `node scripts/checkEnv.js`
2. **Reset price drops**: `node scripts/resetPriceDrops.js`
3. **Create test data**: `node scripts/createPriceDrops.js`

## 📝 Notes

- All scripts require the backend to be properly configured
- Test scripts should be used carefully in production
- Data management scripts modify the database directly 