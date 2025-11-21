// extension/src/background.ts

import browser from 'webextension-polyfill';

// Minimal background script for Manifest V3
browser.runtime.onInstalled.addListener(() => {
  console.log('Price Tracker extension installed.');
});

let lastNotificationData: any = null;

// Request notification permission
chrome.runtime.onInstalled.addListener(() => {
  // Request notification permission when extension is installed
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// Handle messages from web app for token synchronization
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_TOKEN') {
    console.log('Received token sync request from web app');
    // Store the token in extension storage
    chrome.storage.local.set({ authToken: request.token }, () => {
      console.log('Token synced to extension storage');
      sendResponse({ success: true });
    });
    return true; // Indicate async response
  }

  if (request.type === 'SYNC_REFRESH_TOKEN') {
    console.log('Received refresh token sync request from web app');
    chrome.storage.local.set({ refreshToken: request.refreshToken }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'LOGOUT') {
    console.log('Received logout request from web app');
    // Clear all extension data
    chrome.storage.local.clear(() => {
      console.log('Extension data cleared on logout');
      sendResponse({ success: true });
    });
    return true; // Indicate async response
  }
  
  // Handle product tracking via background to avoid CORS issues
  if (request.type === 'TRACK_PRODUCT') {
    const { token, productInfo } = request.payload || {};
    const API_BASE_URL = 'https://price-tracker-with-cursor-web-app-s.vercel.app/api';
    if (!token) {
      sendResponse({ success: false, error: 'Missing auth token' });
      return true;
    }
    fetch(`${API_BASE_URL}/products/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productInfo)
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          sendResponse({ success: true, data });
        } else {
          const err = await res.json().catch(() => ({}));
          sendResponse({ success: false, error: err.message || 'Failed to track product' });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, error: err?.message || 'Network error' });
      });
    return true;
  }

  
  if (request.type === 'PRICE_DROP_ALERT') {
    const { productTitle, currentPrice, previousPrice, productUrl } = request.data;
    
    // Create browser notification using Chrome's notification API
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-48.png'),
      title: '💰 Price Drop Alert!',
      message: `${productTitle} is now $${currentPrice} (was $${previousPrice})`,
      buttons: [
        { title: 'View Product' },
        { title: 'Dismiss' }
      ],
      requireInteraction: true
    }, (notificationId) => {
      // Store notification data for click handling
      chrome.storage.local.set({ 
        [`notification_${notificationId}`]: { productUrl, productTitle }
      });
    });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.storage.local.get([`notification_${notificationId}`], (result) => {
    const notificationData = result[`notification_${notificationId}`];
    if (notificationData?.productUrl) {
      chrome.tabs.create({ url: notificationData.productUrl });
    }
    // Clean up stored data
    chrome.storage.local.remove([`notification_${notificationId}`]);
  });
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.storage.local.get([`notification_${notificationId}`], (result) => {
    const notificationData = result[`notification_${notificationId}`];
    
    if (buttonIndex === 0) { // "View Product" button
      if (notificationData?.productUrl) {
        chrome.tabs.create({ url: notificationData.productUrl });
      }
    }
    // Clean up stored data
    chrome.storage.local.remove([`notification_${notificationId}`]);
  });
});

// Ensure content script is injected when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if the URL matches our supported sites
    const supportedSites = [
      'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.com.au',
      'aliexpress.com', 'aliexpress.us',
      'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es', 'ebay.ca', 'ebay.com.au',
      'walmart.com', 'walmart.ca',
      'shein.com', 'us.shein.com', 'shein.co.uk', 'de.shein.com', 'fr.shein.com', 'it.shein.com', 'es.shein.com'
    ];
    
    const isSupportedSite = supportedSites.some(site => tab.url!.includes(site));
    
    if (isSupportedSite) {
      console.log('Injecting content script for:', tab.url);
      // The content script should be automatically injected via manifest,
      // but we can also inject it programmatically if needed
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).catch(err => {
        console.log('Content script already injected or failed:', err);
      });
    }
  }
});

