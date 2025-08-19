console.log('✅ Price Tracker content script loaded on', window.location.href);
console.log('✅ Content script matches pattern:', window.location.hostname);
console.log('✅ Content script ready to receive messages');

// Inject injected.js into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  (this as HTMLScriptElement).remove();
};
(document.head || document.documentElement).appendChild(script);



// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔍 Content script received message:', message);
  
  // Test message handler
  if (message.type === 'TEST_CONNECTION') {
    console.log('✅ Test connection successful');
    sendResponse({ success: true, message: 'Content script is working!' });
    return true;
  }
  
  if (message.type === 'GET_PRODUCT_INFO') {
    // Relay the message to the injected script
    window.postMessage({ type: 'GET_PRODUCT_INFO' }, '*');

    // Listen for the response from the injected script
    function handleResponse(event: MessageEvent) {
      if (
        event.source === window &&
        event.data &&
        event.data.type === 'PRODUCT_INFO_RESPONSE'
      ) {
        window.removeEventListener('message', handleResponse);
        sendResponse({
          success: event.data.success,
          data: event.data.data,
        });
      }
    }
    window.addEventListener('message', handleResponse);

    // Indicate async response
    return true;
  }
  
  if (message.action === 'trackProduct') {
    console.log('Content script: Handling trackProduct action');
    
    // Get product info from the injected script
    console.log('Content script: Sending trackProduct action to injected script');
    window.postMessage({ action: 'trackProduct' }, '*');

    // Listen for the response from the injected script
    function handleProductResponse(event: MessageEvent) {
      console.log('Content script: Received message from injected script:', event.data);
      if (
        event.source === window &&
        event.data &&
        event.data.type === 'TRACK_PRODUCT_RESPONSE'
      ) {
        console.log('Content script: Processing TRACK_PRODUCT_RESPONSE');
        window.removeEventListener('message', handleProductResponse);
        
        if (event.data.success && event.data.data) {
          console.log('Content script: Product info extracted successfully:', event.data.data);
          
          // Send the product data to the backend
          trackProductToBackend(event.data.data).then(result => {
            sendResponse(result);
          }).catch(error => {
            console.error('Content script: Error tracking product:', error);
            sendResponse({ success: false, error: error.message || 'Unknown error' });
          });
        } else {
          console.error('Content script: Failed to extract product info');
          sendResponse({ success: false, error: 'Failed to extract product info' });
        }
      }
    }
    window.addEventListener('message', handleProductResponse);

    // Set a timeout to ensure we respond even if something goes wrong
    setTimeout(() => {
      if (sendResponse) {
        sendResponse({ success: false, error: 'Timeout waiting for product info' });
      }
    }, 10000); // Increased timeout for cross-platform search

    // Indicate async response
    return true;
  }
});

// Function to send product data to backend
async function trackProductToBackend(productInfo: any): Promise<any> {
  try {
    // Get auth token from storage
    const result = await chrome.storage.local.get(['authToken']);
    const token = result.authToken;
    
    if (!token) {
      console.error('No auth token found');
      return { success: false, error: 'No authentication token found. Please log in first.' };
    }

    // Send to backend (let backend handle cross-platform matching)
    const response = await fetch('http://localhost:3001/api/products/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        url: productInfo.url,
        title: productInfo.title,
        price: productInfo.price,
        currency: productInfo.currency,
        platform: productInfo.platform,
        imageUrl: productInfo.imageUrl,
        stockStatus: productInfo.stockStatus,
        discountInfo: productInfo.discountInfo
      })
    });

    if (response.ok) {
      console.log('Product tracked successfully');
      return { 
        success: true,
        message: 'Product tracked successfully!'
      };
    } else if (response.status === 409) {
      // 409 means product already exists for this user
      console.log('Product already tracked for this user');
      return { 
        success: true,
        message: 'Product already tracked!'
      };
    } else if (response.status === 403) {
      // 403 means user is banned
      console.log('User is banned');
      let errorMessage = 'Account has been suspended';
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      return { 
        success: false,
        error: errorMessage
      };
    } else {
      console.error('Failed to track product:', response.status, response.statusText);
      // Try to get error message from response
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      return { 
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('Error tracking product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
