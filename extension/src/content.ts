// Content script for Buyhatke-style product comparison
console.log('🔍 Price Tracker Content Script Loaded');

// Inject the injected script into the page
function injectScript() {
  console.log('🔍 Injecting script into page...');
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = () => {
    console.log('🔍 Injected script loaded successfully');
  };
  script.onerror = (error) => {
    console.error('🔍 Failed to load injected script:', error);
  };
  (document.head || document.documentElement).appendChild(script);
}

// Inject script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
} else {
  injectScript();
}

// Core types - matching injected.ts interface
interface ProductInfo {
  id: string;
  url: string;
  title: string;
  price: number | null;
  currency: string;
  platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
  imageUrl?: string;
  stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
  discountInfo?: string;
}

// Extension only tracks products - no comparison overlay

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔍 Content script received message:', message);
  
  // Handle test connection
  if (message.type === 'TEST_CONNECTION') {
    console.log('🔍 Content script responding to test connection');
    sendResponse({ success: true, message: 'Content script is ready' });
    return false; // Synchronous response
  }
  
  if (message.action === 'getProductInfo') {
    window.postMessage({ type: 'GET_PRODUCT_INFO' }, '*');
    
    function handleResponse(event: MessageEvent) {
      if (event.source === window && event.data?.type === 'PRODUCT_INFO_RESPONSE') {
        window.removeEventListener('message', handleResponse);
        sendResponse({ success: event.data.success, data: event.data.data });
      }
    }
    
    window.addEventListener('message', handleResponse);
    setTimeout(() => {
      window.removeEventListener('message', handleResponse);
      sendResponse({ success: false, error: 'Timeout' });
    }, 5000);
    return true; // Keep connection alive for async response
  }
  
  if (message.action === 'trackProduct') {
    console.log('🔍 Content script handling trackProduct request');
    
    // Wait a bit for injected script to be ready
    setTimeout(() => {
      console.log('🔍 Content script sending trackProduct message to injected script');
      window.postMessage({ action: 'trackProduct' }, '*');
    }, 100);
    
    function handleTrackResponse(event: MessageEvent) {
      console.log('🔍 Content script received message:', event.data);
      if (event.source === window && event.data?.type === 'TRACK_PRODUCT_RESPONSE') {
        window.removeEventListener('message', handleTrackResponse);
        console.log('🔍 Content script processing TRACK_PRODUCT_RESPONSE');
        
        if (event.data.success && event.data.data) {
          console.log('🔍 Content script calling trackProductToBackend');
          trackProductToBackend(event.data.data).then(result => {
            console.log('🔍 Content script backend result:', result);
            // Ensure consistent response structure
            const response = {
              success: result.success,
              data: result.data,
              message: result.success ? 'Product tracked successfully!' : result.error,
              error: result.error
            };
            console.log('🔍 Content script sending response:', response);
            sendResponse(response);
          }).catch(error => {
            console.log('🔍 Content script backend error:', error);
            // Don't show notification here - let popup handle it
            sendResponse({ 
              success: false, 
              error: error.message,
              message: 'Failed to track product'
            });
          });
        } else {
          console.log('🔍 Content script extraction failed');
          // Don't show notification here - let popup handle it
          sendResponse({ 
            success: false, 
            error: 'Failed to extract product info',
            message: 'Failed to extract product info'
          });
        }
      }
    }
    
    window.addEventListener('message', handleTrackResponse);
    setTimeout(() => {
      console.log('🔍 Content script trackProduct timeout');
      window.removeEventListener('message', handleTrackResponse);
      // Don't show notification here - let popup handle it
      sendResponse({ 
        success: false, 
        error: 'Timeout',
        message: 'Request timed out'
      });
    }, 10000);
    return true; // Keep connection alive for async response
  }
  
  // Default response for unknown messages
  sendResponse({ 
    success: false, 
    error: 'Unknown message type',
    message: 'Unknown message type'
  });
  return false; // Synchronous response
});

// Track product to backend - ONLY track, no popup
async function trackProductToBackend(productInfo: ProductInfo): Promise<any> {
  try {
    console.log('🔍 [Content Script] Starting trackProductToBackend');
    console.log('🔍 [Content Script] Product info:', productInfo);
    
    const result = await chrome.storage.local.get(['authToken']);
    const token = result.authToken;
    
    console.log('🔍 [Content Script] Token found:', !!token);
    
    if (!token) {
      console.log('🔍 [Content Script] No authentication token found');
      return { success: false, error: 'No authentication token found. Please log in to the web app first.' };
    }

    console.log('🔍 [Content Script] Sending track request to background...');
    const response = await chrome.runtime.sendMessage({
      type: 'TRACK_PRODUCT',
      payload: {
        token,
        productInfo
      }
    });

    console.log('🔍 [Content Script] Background response:', response);

    if (response && response.success) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response?.error || 'Failed to track product' };
    }
  } catch (error: any) {
    console.log('🔍 [Content Script] Network error:', error);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}

// Simple notification for successful tracking
function showTrackingNotification(message: string, isSuccess: boolean = true) {
  // Remove existing notification
  const existing = document.querySelector('#price-tracker-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification
  const notification = document.createElement('div');
  notification.id = 'price-tracker-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${isSuccess ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${isSuccess ? '✅' : '❌'}</span>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  // Slide in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Auto-hide after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 4000);
}

console.log('🎯 Price Tracker Extension Ready - Manual tracking only!');
