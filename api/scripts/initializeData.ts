#!/usr/bin/env ts-node

import db from '../src/config/storage';
import { Product } from '../src/config/storage';

async function initializeData() {
  console.log('🚀 Initializing Price Tracker with sample data...');

  // Sample products with advanced features
  const sampleProducts: Product[] = [
    {
      id: 'product-1',
      url: 'https://amazon.com/iphone-14-pro',
      title: 'iPhone 14 Pro 128GB - Space Black',
      price: 999,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-space-black-select?wid=470&hei=556&fmt=png-alpha&.v=1660753040833',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: 'new',
      conditionScore: 95,
      sellerRating: 4.8,
      sellerReviewCount: 15420,
      warrantyCoverage: 'Full 1-year Apple warranty',
      returnPolicy: '30-day hassle-free returns',
      credibilityScore: 87,
      communityRating: 4.2,
      communityVotes: 234,
      isVerified: true,
      finalPrice: 849,
      stockVelocity: 45,
      priceVolatility: 0.15
    },
    {
      id: 'product-2',
      url: 'https://amazon.com/macbook-pro-m2',
      title: 'MacBook Pro 14-inch M2 Pro - Space Gray',
      price: 1999,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: 'new',
      conditionScore: 98,
      sellerRating: 4.9,
      sellerReviewCount: 8932,
      warrantyCoverage: 'Full 1-year Apple warranty + AppleCare eligible',
      returnPolicy: '14-day return policy',
      credibilityScore: 92,
      communityRating: 4.6,
      communityVotes: 156,
      isVerified: true,
      finalPrice: 1749,
      stockVelocity: 23,
      priceVolatility: 0.08
    },
    {
      id: 'product-3',
      url: 'https://amazon.com/nintendo-switch-oled',
      title: 'Nintendo Switch OLED Model - White',
      price: 349,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/ncom/software/switch/70010000000025/7137262b5a64d921e193653f8aa0b722925abc5680380ca0e18a5cfd91697f58',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: 'new',
      conditionScore: 94,
      sellerRating: 4.7,
      sellerReviewCount: 12543,
      warrantyCoverage: '1-year Nintendo warranty',
      returnPolicy: '30-day return policy',
      credibilityScore: 83,
      communityRating: 4.3,
      communityVotes: 89,
      isVerified: true,
      finalPrice: 299,
      stockVelocity: 67,
      priceVolatility: 0.12
    },
    {
      id: 'product-4',
      url: 'https://ebay.com/iphone-13-used',
      title: 'iPhone 13 128GB - Blue (Used - Excellent)',
      price: 549,
      currency: 'USD',
      platform: 'ebay',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-blue-select-2021?wid=470&hei=556&fmt=png-alpha&.v=1629842709000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: 'used',
      conditionScore: 82,
      conditionDetails: 'Excellent condition, minor wear on corners, screen perfect',
      sellerRating: 4.6,
      sellerReviewCount: 2341,
      warrantyCoverage: 'No warranty (used item)',
      returnPolicy: '14-day return policy',
      credibilityScore: 76,
      communityRating: 3.9,
      communityVotes: 45,
      isVerified: false,
      finalPrice: 499,
      stockVelocity: 12,
      priceVolatility: 0.23
    },
    {
      id: 'product-5',
      url: 'https://amazon.com/airpods-pro-2nd-gen',
      title: 'Apple AirPods Pro (2nd Generation)',
      price: 249,
      currency: 'USD',
      platform: 'amazon',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803972361',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      stockStatus: 'in_stock',
      condition: 'new',
      conditionScore: 96,
      sellerRating: 4.8,
      sellerReviewCount: 18765,
      warrantyCoverage: 'Full 1-year Apple warranty',
      returnPolicy: '30-day hassle-free returns',
      credibilityScore: 89,
      communityRating: 4.4,
      communityVotes: 312,
      isVerified: true,
      finalPrice: 199,
      stockVelocity: 89,
      priceVolatility: 0.18
    }
  ];

  try {
    console.log('📦 Adding sample products...');
    for (const product of sampleProducts) {
      await db.addProduct(product);
      console.log(`   ✅ Added: ${product.title}`);
    }

    console.log('\n🎯 Creating sample alerts...');
    // Add some sample alerts
    await db.addAlert({
      productId: 'product-1',
      productTitle: 'iPhone 14 Pro 128GB - Space Black',
      userId: 'demo-user',
      targetPrice: 899,
      currentPrice: 999,
      email: 'user@example.com',
      isActive: true
    });

    await db.addAlert({
      productId: 'product-2',
      productTitle: 'MacBook Pro 14-inch M2 Pro - Space Gray',
      userId: 'demo-user',
      targetPrice: 1699,
      currentPrice: 1999,
      email: 'user@example.com',
      isActive: true
    });

    console.log('   ✅ Added sample price alerts');

    console.log('\n🔔 Creating sample notifications...');
    await db.addNotification({
      userId: 'demo-user',
      alertId: 'alert-1',
      productId: 'product-1',
      productTitle: 'iPhone 14 Pro 128GB - Space Black',
      previousPrice: 999,
      currentPrice: 849,
      priceDrop: 150,
      type: 'price_drop',
      isRead: false
    });

    console.log('   ✅ Added sample notifications');

    console.log('\n🎉 Sample data initialization complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${sampleProducts.length} products added`);
    console.log(`   • 2 price alerts created`);
    console.log(`   • 1 notification added`);
    console.log('\n🚀 Your Price Tracker is ready to use!');

  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
}

if (require.main === module) {
  initializeData();
}

export { initializeData }; 