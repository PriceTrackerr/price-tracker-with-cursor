// Popup functionality for the extension
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const trackProductBtn = document.getElementById('trackProduct') as HTMLButtonElement;
    const openDashboardBtn = document.getElementById('openDashboard') as HTMLButtonElement;
    const refreshDataBtn = document.getElementById('refreshData') as HTMLButtonElement;

    const loadingOverlay = document.getElementById('loadingOverlay') as HTMLDivElement;
    const viewAllBtn = document.querySelector('.view-all-btn') as HTMLButtonElement;
    const footerBtn = document.querySelector('.footer-btn') as HTMLButtonElement;
    
    const productsCard = document.querySelector('.products-card') as HTMLDivElement;
    const alertsCard = document.querySelector('.alerts-card') as HTMLDivElement;
    const savedCard = document.querySelector('.saved-card') as HTMLDivElement;

    // API base URL - use deployed backend
    const API_BASE_URL = 'https://price-tracker-with-cursor-web-app-s.vercel.app/api';
    const WEBAPP_BASE_URL = 'https://price-tracker-with-cursor-web-app.vercel.app';

    // Real data storage
    let userStats = {
        trackedProducts: 0,
        activeAlerts: 0,
        totalSaved: 0
    };

    let recentProducts: any[] = [];
    let allProducts: any[] = [];
    let isUserLoggedIn = false;
    let showAllProducts = false;

    // Initialize popup
    async function initializePopup() {
        console.log('Initializing popup...');
        try {
            // Always try to sync token from web app first
            console.log('Syncing token from web app...');
            await syncTokenFromWebApp();
            
            // Get the latest token (either from storage or newly synced)
            const token = await getStoredToken();
            console.log('Token available:', !!token);
            
            if (token) {
                await checkUserAuthentication();
                console.log('Authentication checked, isUserLoggedIn:', isUserLoggedIn);
                
                if (isUserLoggedIn) {
                    await fetchUserStats();
                    console.log('User stats fetched:', userStats);
                    
                    await fetchRecentProducts();
                    console.log('Recent products fetched:', recentProducts.length);
                } else {
                    // Token exists but authentication failed - clear data and show login
                    await clearExtensionData();
                    showLoginPrompt();
                }
            } else {
                // No token found - clear any old data and show login
                await clearExtensionData();
                showLoginPrompt();
            }
            
            setupEventListeners();
            updateUI();
            console.log('Popup initialization complete');
        } catch (error) {
            console.error('Error initializing popup:', error);
            await clearExtensionData();
            showLoginPrompt();
        }
    }

    // Show login prompt when user is not authenticated
    function showLoginPrompt() {
        const productsList = document.querySelector('.products-list');
        if (productsList) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔐</div>
                    <p>Please log in to track products</p>
                    <p class="empty-subtitle">Your data will sync across devices</p>
                    <button class="btn btn-primary" id="loginBtn" style="margin-top: 12px;">
                        Log In
                    </button>
                    <button class="btn" id="pasteTokenBtn" style="margin-top: 8px; margin-left: 8px;">
                        Paste Token Manually
                    </button>
                </div>
            `;
            
            // Add login button event listener
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    chrome.tabs.create({ url: WEBAPP_BASE_URL });
                });
            }

            // Manual token paste for fallback
            const pasteBtn = document.getElementById('pasteTokenBtn');
            if (pasteBtn) {
                pasteBtn.addEventListener('click', async () => {
                    try {
                        const token = window.prompt('Paste access token (token):');
                        if (!token) return;
                        const refreshToken = window.prompt('Paste refresh token (optional):') || '';
                        await chrome.storage.local.set({ authToken: token, refreshToken });
                        showSuccessMessage('Token saved. You can track now.');
                        await refreshExtensionData();
                    } catch (e) {
                        showErrorMessage('Failed to save token');
                    }
                });
            }
        }
        
        // Update stats to show zeros
        userStats = { trackedProducts: 0, activeAlerts: 0, totalSaved: 0 };
        updateStats();
    }


    // Show banned user message
    function showBannedUserMessage() {
        const productsList = document.querySelector('.products-list');
        if (productsList) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🚫</div>
                    <p>Account Suspended</p>
                    <p class="empty-subtitle">Your account has been suspended due to policy violations. Please contact support for assistance.</p>
                    <button class="btn btn-primary" id="contactSupportBtn" style="margin-top: 12px;">
                        Contact Support
                    </button>
                </div>
            `;
            
            // Add contact support button event listener
            const contactSupportBtn = document.getElementById('contactSupportBtn');
            if (contactSupportBtn) {
                contactSupportBtn.addEventListener('click', () => {
                    chrome.tabs.create({ url: `mailto:support@pricetracker.com?subject=Account%20Suspension%20Inquiry&body=Hello,%20I%20would%20like%20to%20inquire%20about%20my%20account%20suspension.%20Please%20provide%20more%20information%20about%20why%20my%20account%20was%20suspended%20and%20how%20I%20can%20resolve%20this%20issue.` });
                });
            }
        }
        
        // Update stats to show zeros
        userStats = { trackedProducts: 0, activeAlerts: 0, totalSaved: 0 };
        updateStats();
    }

    // Check if user is logged in
    async function checkUserAuthentication() {
        try {
            const token = await getStoredToken();
            if (token) {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    const currentUserId = userData.user?.id;
                    
                    // Check if user has changed
                    const storedUserData = await chrome.storage.local.get(['userData']);
                    if (storedUserData.userData) {
                        try {
                            const storedUser = JSON.parse(storedUserData.userData);
                            if (storedUser.id !== currentUserId) {
                                console.log('User changed, clearing old data');
                                await clearExtensionData();
                                return;
                            }
                        } catch (error) {
                            console.log('Error parsing stored user data');
                        }
                    }
                    
                    isUserLoggedIn = true;
                    console.log('Authentication check: User logged in');
                } else if (response.status === 403) {
                    // User is banned
                    isUserLoggedIn = false;
                    console.log('Authentication check: User is banned');
                    await clearExtensionData();
                    showBannedUserMessage();
                } else if (response.status === 401) {
                    // Try to refresh the token once, then retry /users/me
                    console.log('Auth check 401, attempting refresh...');
                    const refreshed = await (async () => {
                        try {
                            const stored = await new Promise<any>(resolve => chrome.storage.local.get(['refreshToken'], resolve));
                            const rt = stored?.refreshToken as string | undefined;
                            if (!rt) return null;
                            const resp = await fetch(`${API_BASE_URL}/users/refresh`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken: rt })
                            });
                            if (!resp.ok) return null;
                            const data = await resp.json();
                            const newToken = data?.data?.token as string | undefined;
                            if (newToken) {
                                await chrome.storage.local.set({ authToken: newToken });
                                return newToken;
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })();
                    if (refreshed) {
                        const retry = await fetch(`${API_BASE_URL}/users/me`, {
                            headers: {
                                'Authorization': `Bearer ${refreshed}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (retry.ok) {
                            isUserLoggedIn = true;
                            console.log('Authentication check: User logged in (after refresh)');
                            return;
                        }
                    }
                    isUserLoggedIn = false;
                    console.log('Authentication check: User not logged in');
                    await clearExtensionData();
                } else {
                    isUserLoggedIn = false;
                    console.log('Authentication check: User not logged in');
                    await clearExtensionData();
                }
            } else {
                isUserLoggedIn = false;
                console.log('No token found');
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            isUserLoggedIn = false;
            await clearExtensionData();
        }
    }

    // Clear all extension data
    async function clearExtensionData() {
        try {
            await chrome.storage.local.remove(['authToken', 'userData']);
            // Clear cached data
            userStats = { trackedProducts: 0, activeAlerts: 0, totalSaved: 0 };
            recentProducts = [];
            allProducts = [];
            isUserLoggedIn = false;
            console.log('Extension data cleared');
        } catch (error) {
            console.error('Error clearing extension data:', error);
        }
    }

    // Get stored token; if missing, attempt refresh via refreshToken
    async function getStoredToken(): Promise<string | null> {
        const stored = await new Promise<any>(resolve => chrome.storage.local.get(['authToken','refreshToken'], resolve));
        if (stored?.authToken) {
            console.log('Token found in extension storage');
            return stored.authToken as string;
        }
        console.log('No token in extension storage, attempting refresh...');
        if (stored?.refreshToken) {
            try {
                const resp = await fetch(`${API_BASE_URL}/users/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: stored.refreshToken })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const newToken = data?.data?.token as string | undefined;
                    if (newToken) {
                        await chrome.storage.local.set({ authToken: newToken });
                        console.log('Token refreshed via API');
                        return newToken;
                    }
                }
            } catch (e) {
                console.log('Refresh attempt failed');
            }
        }
        return null;
    }

    // Manual token sync function
    async function syncTokenFromWebApp() {
        try {
            console.log('Attempting to sync token from web app...');
            
            // Ensure we have host permission for the web app origin
            try {
                const granted = await (chrome.permissions as any).request?.({
                    origins: [`${WEBAPP_BASE_URL}/*`]
                });
                if (granted) {
                    console.log('Host permission granted for web app');
                }
            } catch (e) {
                console.log('Permission request failed or not supported:', e);
            }

            // Try to get token from web app's localStorage via content script
            let tabs = await chrome.tabs.query({ url: `${WEBAPP_BASE_URL}/*` });
            
            if (tabs.length === 0) {
                console.log('No existing web app tab found, opening background tab...');
                const created = await chrome.tabs.create({ url: WEBAPP_BASE_URL, active: false });
                // Wait for page to finish loading (up to ~6s)
                for (let i = 0; i < 24; i++) {
                    try {
                        const info = await chrome.tabs.get(created.id!);
                        if ((info as any).status === 'complete') break;
                    } catch {}
                    await new Promise(r => setTimeout(r, 250));
                }
                tabs = [created];
            }

            if (tabs.length > 0) {
                const tab = tabs[0];
                try {
                    const result = await chrome.scripting.executeScript({
                        target: { tabId: tab.id! },
                        func: () => {
                            const token = localStorage.getItem('token');
                            const refreshToken = localStorage.getItem('refreshToken');
                            const user = localStorage.getItem('user');
                            return { token, refreshToken, user };
                        }
                    });
                    if (result && result[0] && result[0].result) {
                        const { token, refreshToken, user } = result[0].result;
                        if (token) {
                            await chrome.storage.local.set({ 
                                authToken: token,
                                refreshToken,
                                userData: user 
                            });
                            console.log('Token and user data synced from web app');
                            // If we created this tab, close it quietly
                            if (tabs.length === 1 && tab.active === false) {
                                try { await chrome.tabs.remove(tab.id!); } catch {}
                            }
                            return token;
                        }
                    }
                    // Close background tab if we created it and failed to read token
                    if (tabs.length === 1 && tab.active === false) {
                        try { await chrome.tabs.remove(tab.id!); } catch {}
                    }
                } catch (error) {
                    console.log('Could not access web app tab:', error);
                }
            }
            
            console.log('No web app tab found or could not access localStorage');
            return null;
        } catch (error) {
            console.error('Error syncing token:', error);
            return null;
        }
    }

    // Refresh extension data
    async function refreshExtensionData() {
        console.log('Refreshing extension data...');
        try {
            await checkUserAuthentication();
            if (isUserLoggedIn) {
                await fetchUserStats();
                await fetchRecentProducts();
                updateUI();
                console.log('Extension data refreshed successfully');
            } else {
                showLoginPrompt();
            }
        } catch (error) {
            console.error('Error refreshing extension data:', error);
        }
    }

    // Fetch user stats from backend
    async function fetchUserStats() {
        try {
            const token = await getStoredToken();
            if (!token) {
                // Use default values if not logged in
                userStats = { trackedProducts: 0, activeAlerts: 0, totalSaved: 0 };
                console.log('No token available for stats fetch');
                return;
            }

            console.log('Fetching user stats with token...');

            // Fetch products count
            const productsResponse = await fetch(`${API_BASE_URL}/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                const products = productsData.data ? productsData.data : productsData;
                userStats.trackedProducts = products.length || 0;
                console.log('Products count:', userStats.trackedProducts);
            } else {
                console.error('Failed to fetch products:', productsResponse.status);
                if (productsResponse.status === 401) {
                    // Token is invalid, clear it and show login prompt
                    await clearExtensionData();
                    showLoginPrompt();
                    return;
                } else if (productsResponse.status === 403) {
                    // User is banned
                    await clearExtensionData();
                    showBannedUserMessage();
                    return;
                }
            }

            // Fetch alerts count
            const alertsResponse = await fetch(`${API_BASE_URL}/alerts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (alertsResponse.ok) {
                const alertsData = await alertsResponse.json();
                const alerts = alertsData.data ? alertsData.data : alertsData;
                userStats.activeAlerts = alerts.filter((alert: any) => alert.isActive).length || 0;
                console.log('Active alerts count:', userStats.activeAlerts);
            } else {
                console.error('Failed to fetch alerts:', alertsResponse.status);
            }

            // Calculate total saved based on actual data
            // For now, we'll calculate based on price drops or use 0
            // This should be replaced with actual savings calculation from backend
            userStats.totalSaved = 0; // Will be calculated from actual price drops
            console.log('Total saved calculated:', userStats.totalSaved);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            userStats = { trackedProducts: 0, activeAlerts: 0, totalSaved: 0 };
        }
    }

    // Fetch recent products from backend
    async function fetchRecentProducts() {
        try {
            const token = await getStoredToken();
            if (!token) {
                allProducts = [];
                recentProducts = [];
                return;
            }

            const response = await fetch(`${API_BASE_URL}/products?limit=10&sort=createdAt`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const productsData = await response.json();
                const products = productsData.data ? productsData.data : productsData;
                allProducts = products;
                // Sort by date (newest first) and show only 10 products
                recentProducts = products
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10);
            } else {
                allProducts = [];
                recentProducts = [];
                if (response.status === 401) {
                    // Token is invalid, clear it and show login prompt
                    await clearExtensionData();
                    showLoginPrompt();
                } else if (response.status === 403) {
                    // User is banned
                    await clearExtensionData();
                    showBannedUserMessage();
                }
            }
        } catch (error) {
            console.error('Error fetching recent products:', error);
            allProducts = [];
            recentProducts = [];
        }
    }

    // Update UI with real data
    function updateUI() {
        console.log('Updating UI with stats:', userStats);
        updateStats();
        updateRecentProducts();
        console.log('UI update complete');
    }

    // Update stats display
    function updateStats() {
        console.log('Updating stats display...');
        const statNumbers = document.querySelectorAll('.stat-number');
        console.log('Found stat numbers:', statNumbers.length);
        
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = userStats.trackedProducts.toString();
            statNumbers[1].textContent = userStats.activeAlerts.toString();
            statNumbers[2].textContent = `$${userStats.totalSaved.toFixed(2)}`;
            console.log('Stats updated:', {
                products: userStats.trackedProducts,
                alerts: userStats.activeAlerts,
                saved: userStats.totalSaved
            });
        } else {
            console.error('Not enough stat number elements found');
        }
    }

    // Update recent products display
    function updateRecentProducts() {
        const productsList = document.querySelector('.products-list');
        if (!productsList) return;

        // Clear existing products
        productsList.innerHTML = '';

        if (recentProducts.length === 0) {
            // Show empty state
            productsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <p>No products tracked yet</p>
                    <p class="empty-subtitle">Start tracking to see them here</p>
                </div>
            `;
            return;
        }

        // Add products
        recentProducts.forEach((product, index) => {
            const productCard = createProductCard(product, index);
            productsList.appendChild(productCard);
        });

        // Add "View All" button if there are more products
        if (allProducts.length > 5 && !showAllProducts) {
            const viewAllButton = document.createElement('div');
            viewAllButton.className = 'view-all-products-btn';
            viewAllButton.innerHTML = `
                <button class="btn btn-secondary" style="width: 100%; margin-top: 12px;">
                    <span>View All ${allProducts.length} Products</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12,5 19,12 12,19"></polyline>
                    </svg>
                </button>
            `;
            productsList.appendChild(viewAllButton);

            // Add click event
            viewAllButton.querySelector('button')?.addEventListener('click', () => {
                showAllProducts = true;
                recentProducts = allProducts;
                updateRecentProducts();
            });
        }
    }

    // Create product card element
    function createProductCard(product: any, index: number) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-product-id', product._id || product.id);

        const productImage = product.imageUrl || product.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop';
        const productTitle = product.title || product.name || 'Unknown Product';
        const productPlatform = product.platform || 'Unknown Platform';
        const productPrice = product.currentPrice || product.price || 0;

        card.innerHTML = `
            <div class="product-image">
                <img src="${productImage}" alt="${productTitle}" loading="lazy">
            </div>
            <div class="product-info">
                <h4 class="product-title">${productTitle}</h4>
                <p class="product-platform">${productPlatform.charAt(0).toUpperCase() + productPlatform.slice(1)}</p>
                <p class="product-price">$${productPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
        `;

        // Add click event
        card.addEventListener('click', () => {
            handleProductClick(product._id || product.id);
        });

        return card;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Track product button
        if (trackProductBtn) {
            trackProductBtn.addEventListener('click', handleTrackProduct);
        }
        
        // Refresh data button
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', handleRefreshData);
        }



        // Open dashboard button
        if (openDashboardBtn) {
            openDashboardBtn.addEventListener('click', handleOpenDashboard);
        }

        // View all button
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', handleViewAll);
        }

        // Footer button
        if (footerBtn) {
            footerBtn.addEventListener('click', handleSettings);
        }

        // Sync token button


        // Stats cards
        if (productsCard) {
            productsCard.addEventListener('click', handleProductsCardClick);
        }

        if (alertsCard) {
            alertsCard.addEventListener('click', handleAlertsCardClick);
        }

        if (savedCard) {
            savedCard.addEventListener('click', handleSavedCardClick);
        }
    }



    // Handle track product
    let lastTrackClickAt = 0;
    async function handleTrackProduct() {
        const now = Date.now();
        if (now - lastTrackClickAt < 2000) {
          return;
        }
        lastTrackClickAt = now;
        if (!trackProductBtn) return;

        // Show loading state
        showLoading(true);
        trackProductBtn.disabled = true;
        
        const btnText = trackProductBtn.querySelector('.btn-text') as HTMLElement;
        const btnIcon = trackProductBtn.querySelector('svg') as SVGElement;
        
        if (btnText) btnText.textContent = 'Tracking...';
        if (btnIcon) btnIcon.style.animation = 'spin 1s linear infinite';

        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url) {
                console.log('Attempting to track product on:', tab.url);
                
                // First, try to inject the content script if it's not already there
                try {
                    console.log('Attempting to inject content script...');
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id! },
                        files: ['content.js']
                    });
                    console.log('Content script injected successfully');
                } catch (injectError) {
                    console.log('Content script may already be injected:', injectError);
                }
                
                // Wait a moment for the content script to load
                console.log('Waiting for content script to load...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // First, test the connection
                try {
                    console.log('Testing connection to content script...');
                    const testResponse = await chrome.tabs.sendMessage(tab.id!, {
                        type: 'TEST_CONNECTION'
                    });
                    console.log('Test connection response:', testResponse);
                } catch (testError) {
                    console.error('Test connection failed:', testError);
                    showErrorMessage('Content script not loaded. Please refresh the page and try again.');
                    return;
                }
                
                // Send message to content script to track product with timeout
                console.log('Sending trackProduct message...');
                
                // Send the track product message and wait for response with longer timeout
                const response = await Promise.race([
                    chrome.tabs.sendMessage(tab.id!, {
                        action: 'trackProduct',
                        url: tab.url
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 15000)
                    )
                ]);

                console.log('Track product response:', response);

                console.log('Track product response:', response);
                
                // Check if the response indicates success
                if (response && (
                    (response as any).success === true || 
                    (response as any).data || 
                    (response as any).message?.includes('successfully') ||
                    (response as any).message?.toLowerCase()?.includes('already tracked')
                )) {
                    const message = (response as any).message?.toLowerCase()?.includes('already tracked')
                      ? 'Already tracked — opening dashboard'
                      : ((response as any).message || 'Product tracked successfully!');
                    showSuccessMessage(message);
                    
                    // Refresh data after tracking
                    await refreshExtensionData();
                    // Optional: open dashboard when already tracked
                    if ((response as any).message?.toLowerCase()?.includes('already tracked')) {
                      try { chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/products` }); } catch {}
                    }
                } else {
                    // Check if there's an error message
                    const errorMsg = (response as any)?.error || 'Failed to track product';
                    console.log('Showing error message:', errorMsg);
                    showErrorMessage(errorMsg);
                }
            } else {
                showErrorMessage('Could not access current page');
            }
        } catch (error) {
            console.error('Error tracking product:', error);
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Check if it's a timeout error
            if (errorMessage === 'Timeout') {
                showErrorMessage('Request timed out. Please refresh the page and try again.');
            } else if (errorMessage.includes('Could not establish connection')) {
                showErrorMessage('Extension not working on this page. Please try refreshing the page or visit a supported product page.');
            } else {
                showErrorMessage('Failed to track product. Make sure you are on a supported product page (Amazon, AliExpress, eBay, Walmart, or Shein).');
            }
        } finally {
            // Reset button state
            showLoading(false);
            trackProductBtn.disabled = false;
            if (btnText) btnText.textContent = 'Track This Product';
            if (btnIcon) btnIcon.style.animation = '';
            // allow next click after short delay
            setTimeout(() => { lastTrackClickAt = 0; }, 500);
        }
    }





    // Handle refresh data
    async function handleRefreshData() {
        if (!refreshDataBtn) return;
        
        // Show loading state
        refreshDataBtn.style.animation = 'spin 1s linear infinite';
        refreshDataBtn.disabled = true;
        
        try {
            // Force clear all data first
            await clearExtensionData();
            await refreshExtensionData();
            showSuccessMessage('Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            showErrorMessage('Failed to refresh data');
        } finally {
            // Reset button state
            refreshDataBtn.style.animation = '';
            refreshDataBtn.disabled = false;
        }
    }

    // Handle open dashboard
    async function handleOpenDashboard() {
        console.log('Opening dashboard, checking authentication...');
        
        if (isUserLoggedIn) {
            console.log('User is logged in, opening dashboard');
            chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/dashboard` });
        } else {
            console.log('User not logged in, opening landing page');
            chrome.tabs.create({ url: WEBAPP_BASE_URL });
        }
    }

    // Handle view all products
    function handleViewAll() {
        chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/products` });
    }

    // Handle settings
    function handleSettings() {
        chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/settings` });
    }

    

    // Handle product click
      function handleProductClick(productId: string) {
    console.log('Product clicked:', productId);
    const url = `${WEBAPP_BASE_URL}/products?highlight=${productId}`;
    console.log('Opening URL:', url);
    // Navigate to products page with product ID for highlighting
    chrome.tabs.create({ url });
  }

    // Handle stats card clicks
    function handleProductsCardClick() {
        chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/products` });
    }

    function handleAlertsCardClick() {
        chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/alerts` });
    }

    function handleSavedCardClick() {
        // Could navigate to a savings/analytics page
        chrome.tabs.create({ url: `${WEBAPP_BASE_URL}/analytics` });
    }

    // Show loading overlay
    function showLoading(show: boolean) {
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('show');
            } else {
                loadingOverlay.classList.remove('show');
            }
        }
    }

    // Show success message
    function showSuccessMessage(message: string) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Show error message
    function showErrorMessage(message: string) {
        // Create temporary error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Debug function to manually clear extension data
    async function debugClearData() {
        console.log('Manually clearing extension data...');
        await clearExtensionData();
        showSuccessMessage('Extension data cleared!');
        // Reinitialize popup
        await initializePopup();
    }

    // Add debug function to window for testing
    if (typeof window !== 'undefined') {
        (window as any).debugClearExtensionData = debugClearData;
    }

    // Initialize popup when DOM is loaded
    initializePopup();
});