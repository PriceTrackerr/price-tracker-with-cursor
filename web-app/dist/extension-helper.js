// Extension helper script for webapp
(function() {
    console.log('Extension helper script loaded');
    
    // Listen for messages from the extension
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        
        if (event.data.type === 'GET_AUTH_TOKEN') {
            const token = localStorage.getItem('token');
            window.postMessage({
                type: 'AUTH_TOKEN_RESPONSE',
                token: token
            }, '*');
        }
    });
    
    // Also listen for chrome extension messages
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getAuthToken') {
                const token = localStorage.getItem('token');
                sendResponse({ token: token });
            }
            return true;
        });
    }
})(); 