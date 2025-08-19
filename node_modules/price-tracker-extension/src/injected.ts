// Injected script for Price Tracker
// This script runs in the context of the web page

console.log('[Injected] Price Tracker injected script loaded on', window.location.href);

interface ProductInfo {
  id: string;
  url: string;
  title: string;
  price: number | null;
  currency: string;
  platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
  imageUrl?: string;
  stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
  discountInfo?: string; // Added for discount & promotion tracking
}

class ProductExtractor {
  private platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';

  constructor() {
    console.log('🔍 [ProductExtractor] Constructor called');
    this.platform = this.detectPlatform();
    console.log('🔍 [ProductExtractor] Platform set to:', this.platform);
  }

  private detectPlatform(): 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target' {
    const hostname = window.location.hostname.toLowerCase();
    console.log('🔍 [Platform Detection] Hostname:', hostname);
    
    if (hostname.includes('amazon')) {
      console.log('🔍 [Platform Detection] Detected: Amazon');
      return 'amazon';
    } else if (hostname.includes('aliexpress')) {
      console.log('🔍 [Platform Detection] Detected: AliExpress');
      return 'aliexpress';
    } else if (hostname.includes('ebay')) {
      console.log('🔍 [Platform Detection] Detected: eBay');
      return 'ebay';
    } else if (hostname.includes('walmart')) {
      console.log('🔍 [Platform Detection] Detected: Walmart');
      return 'walmart';
    } else if (hostname.includes('shein')) {
      console.log('🔍 [Platform Detection] Detected: Shein');
      return 'shein';
    } else if (hostname.includes('bestbuy')) {
      console.log('🔍 [Platform Detection] Detected: Best Buy');
      return 'bestbuy';
    } else if (hostname.includes('target')) {
      console.log('🔍 [Platform Detection] Detected: Target');
      return 'target';
    }
    console.log('🔍 [Platform Detection] Default fallback: Amazon');
    return 'amazon'; // Default fallback
  }

  public async extractProductInfo(): Promise<ProductInfo | null> {
    switch (this.platform) {
      case 'amazon':
        return await this.extractAmazonProductInfo();
      case 'aliexpress':
        return await this.extractAliExpressProductInfo();
      case 'ebay':
        return await this.extractEbayProductInfo();
      case 'walmart':
        return await this.extractWalmartProductInfo();
      case 'shein':
        return await this.extractSheinProductInfo();
      case 'bestbuy':
        return await this.extractBestBuyProductInfo();
      case 'target':
        return await this.extractTargetProductInfo();
      default:
        return null;
    }
  }

  public async extractAmazonProductInfo(): Promise<ProductInfo | null> {
    try {
      // Support multiple URL formats for ASIN
      let productId = null;
      const urlPatterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i
      ];
      for (const pattern of urlPatterns) {
        const match = window.location.pathname.match(pattern);
        if (match) {
          productId = match[1];
          break;
        }
      }
      // Fallback: try meta og:url
      if (!productId) {
        const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
        if (ogUrl && ogUrl.content) {
          const ogMatch = ogUrl.content.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
          if (ogMatch) productId = ogMatch[1];
        }
      }
      if (!productId) return null;

      // Robust title extraction
      let title = '';
      const titleSelectors = [
        '#productTitle',
        'span#title',
        'h1.a-size-large.a-spacing-none',
        'h1',
        'meta[name="title"]',
        'meta[property="og:title"]'
      ];
      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || '';
      }
          if (title) break;
        }
      }

      // Robust price extraction
        let priceString = '';
      const priceSelectors = [
        '.a-price .a-offscreen',
        '.a-price .a-offscreen:not([data-a-strike])',
        '.a-price-whole',
        '.a-price-fraction',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#priceblock_saleprice',
        '.a-color-price',
        '.a-size-medium.a-color-price',
        '.a-offscreen'
      ];
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent && el.offsetParent !== null) {
          priceString = el.textContent.trim();
          if (priceString.match(/[$€£¥₹]/)) break;
        }
      }
      // Fallback: scan all .a-offscreen
      if (!priceString) {
        const candidates = Array.from(document.querySelectorAll('.a-offscreen')) as HTMLElement[];
        for (const el of candidates) {
          if (el.textContent && el.offsetParent !== null && el.textContent.match(/[$€£¥₹]/)) {
            priceString = el.textContent.trim();
            break;
          }
        }
      }
      const price = priceString ? parseFloat(priceString.replace(/[^0-9.]/g, '')) : null;
      if (price === null || isNaN(price)) {
        console.warn('[Injected] Could not extract a valid price from string:', priceString);
      }

      const imageUrl =
        (document.getElementById('landingImage') as HTMLImageElement)?.src ||
        (document.querySelector('#imgTagWrapperId img') as HTMLImageElement)?.src ||
        (document.querySelector('img[data-old-hires]') as HTMLImageElement)?.src ||
        (document.querySelector('img[src*="images/I/"]') as HTMLImageElement)?.src ||
        '';

      const currencyMatch = priceString.match(/[$€£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : '$';

      // Stock/availability extraction for Amazon
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      const stockSelectors = [
        '#availability .a-declarative .a-size-medium',
        '#availability .a-size-medium',
        '#availability .a-color-success',
        '#availability',
        '#outOfStock',
        '.availability .a-declarative .a-size-medium',
        '.availability .a-size-medium',
        '.availability .a-color-success',
        '.availability',
      ];
      for (const sel of stockSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('in stock')) {
            stockStatus = 'in_stock';
            break;
          } else if (text.includes('out of stock') || text.includes('unavailable')) {
            stockStatus = 'out_of_stock';
            break;
          }
        }
      }

      // Discount & promotion extraction for Amazon
      let discountInfo = '';
      const discountSelectors = [
        '.savingsPercentage',
        '.couponBadge',
        '.a-size-base.a-color-price',
        '.a-span12 .a-color-price',
        '.a-row .a-color-price',
        '.a-section .a-color-price',
        '.a-size-medium.a-color-price',
        '.a-size-base.a-color-price',
        '.a-price .a-text-strike',
        '.a-price .a-color-price',
        '.a-price .a-text-bold',
        '.a-price .a-text-price',
        '.a-price .a-text-discount',
        '.a-price .a-text-promo',
        '.a-price .a-text-coupon',
        '.a-price .a-text-deal',
        '.a-price .a-text-saving',
        '.a-price .a-text-off',
        '.a-price .a-text-save',
        '.a-price .a-text-promotion',
        '.a-price .a-text-cashback',
        '.a-price .a-text-bonus',
        '.a-price .a-text-reward',
        '.a-price .a-text-voucher',
        '.a-price .a-text-gift',
        '.a-price .a-text-coupon',
        '.a-price .a-text-cashback',
        '.a-price .a-text-bonus',
        '.a-price .a-text-reward',
        '.a-price .a-text-voucher',
        '.a-price .a-text-gift',
        '.a-price .a-text-coupon',
        '.a-price .a-text-cashback',
        '.a-price .a-text-bonus',
        '.a-price .a-text-reward',
        '.a-price .a-text-voucher',
        '.a-price .a-text-gift',
        '.a-price .a-text-coupon',
        '.a-price .a-text-cashback',
        '.a-price .a-text-bonus',
        '.a-price .a-text-reward',
        '.a-price .a-text-voucher',
        '.a-price .a-text-gift',
      ];
      for (const sel of discountSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent && el.offsetParent !== null) {
          discountInfo = el.textContent.trim();
          if (discountInfo) break;
        }
      }
      // Fallback: look for keywords in all visible elements
      if (!discountInfo) {
        const allEls = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
        for (const el of allEls) {
          if (el.offsetParent !== null && el.textContent) {
            const text = el.textContent.trim();
            if (/save|coupon|deal|promotion|discount|off|cashback|bonus|reward|voucher|gift/i.test(text) && text.length < 64) {
              discountInfo = text;
              break;
            }
          }
        }
      }

      return {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'amazon',
        imageUrl,
        stockStatus,
        discountInfo: discountInfo || undefined,
      };
    } catch (error) {
      console.error('Error extracting Amazon product info:', error);
      return null;
    }
  }

  // AliExpress extraction is now async and uses waitForElement
  public async extractAliExpressProductInfo(): Promise<ProductInfo | null> {
    try {
      const urlMatch = window.location.pathname.match(/\/item\/(\d+)\.html/);
      if (!urlMatch) return null;
      const productId = urlMatch[1];

      // Wait for the title element
      const titleEl =
        (await waitForElement('h1[data-pl="product-title"]')) ||
        (await waitForElement('.product-title-text')) ||
        (await waitForElement('h1.product-title')) ||
        (await waitForElement('div.product-title')) ||
        (await waitForElement('h1'));

      const title = titleEl?.innerText?.trim() || '';

      // Log the extracted title for debugging
      console.log('[Injected] Extracted AliExpress product title:', title);

      // Enhanced price extraction for AliExpress
      let priceString = '';
      
      // Try multiple selectors for price
      const priceSelectors = [
        '.product-price-value',
        '.product-price-current',
        '.product-price',
        '.price-current',
        '.price-value',
        '[data-pl="product-price"]',
        '.product-info-price .price',
        '.product-price-info .price',
        '.price-box .price',
        '.product-price-box .price',
        '.product-price-current .price',
        '.product-price-value .price',
        '.price-current .price',
        '.price-value .price'
      ];
      
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element?.textContent) {
          priceString = element.textContent.trim();
          console.log(`[Injected] Found price with selector ${selector}:`, priceString);
          break;
        }
      }
      
      // If still no price, try to find any element with price-like text
      if (!priceString) {
        const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
        for (const element of allElements) {
          const text = element.textContent?.trim() || '';
          // Look for patterns like "US $0.30" or "$0.30" or "0.30"
          const priceMatch = text.match(/(?:US\s*\$|[\$€£¥₹])\s*([\d,]+\.?\d*)/);
          if (priceMatch && text.length < 50) { // Avoid very long text
            priceString = priceMatch[0];
            console.log('[Injected] Found price in text:', priceString);
            break;
          }
        }
      }
      
      console.log('[Injected] Final AliExpress price string:', priceString);

      const price = priceString ? parseFloat(priceString.replace(/[^0-9.]/g, '')) : null;

      // Improved image extraction: get the currently visible main product image
      function getVisibleImage(selector: string): string | undefined {
        const imgs = Array.from(document.querySelectorAll(selector)) as HTMLImageElement[];
        const visible = imgs.find(img => img.offsetParent !== null && img.src);
        return visible?.src;
      }

      let imageUrl =
        getVisibleImage('.magnifier-image') ||
        getVisibleImage('.product-main-image-wrapper img') ||
        getVisibleImage('.images-view-list .images-view-item.selected img') ||
        getVisibleImage('.images-view-list .images-view-item img') ||
        getVisibleImage('.product-image img') ||
        getVisibleImage('img[src*=".jpg"]') ||
        getVisibleImage('img[src*=".jpeg"]') ||
        getVisibleImage('img[src*=".png"]') ||
        getVisibleImage('img') ||
        '';
      // Remove thumbnail or unrelated images by checking for gallery or main image classes
      if (imageUrl && imageUrl.includes('_50x50.jpg')) {
        // Try to get the larger version
        imageUrl = imageUrl.replace('_50x50.jpg', '');
      }

      const currencyMatch = priceString.match(/[$€£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : '$';

      // Stock/availability extraction for AliExpress
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      // Scan all spans for 'only X left'
      const allSpans = Array.from(document.querySelectorAll('span')) as HTMLElement[];
      console.log('[AliExpress Stock Debug] All span texts:', allSpans.map(s => s.textContent));
      let foundStock = false;
      for (const span of allSpans) {
        const text = span.textContent?.trim().toLowerCase() || '';
        console.log('[AliExpress Stock Debug] Checking span text:', text);
        const match = text.match(/only\s*(\d+)\s*left/);
        if (match) {
          const qty = parseInt(match[1], 10);
          console.log('[AliExpress Stock Debug] Found "only X left":', qty, 'in text:', text);
          if (qty > 0) {
            stockStatus = 'in_stock';
            console.log('[AliExpress Stock Debug] Set stockStatus to in_stock');
            foundStock = true;
            break;
          } else {
            stockStatus = 'out_of_stock';
            console.log('[AliExpress Stock Debug] Set stockStatus to out_of_stock');
            foundStock = true;
            break;
          }
        }
        // NEW: Match 'X available'
        const availableMatch = text.match(/(\d+)\s*available/);
        if (availableMatch) {
          const qty = parseInt(availableMatch[1], 10);
          console.log('[AliExpress Stock Debug] Found "X available":', qty, 'in text:', text);
          if (qty > 0) {
            stockStatus = 'in_stock';
            console.log('[AliExpress Stock Debug] Set stockStatus to in_stock (available)');
            foundStock = true;
            break;
          } else {
            stockStatus = 'out_of_stock';
            console.log('[AliExpress Stock Debug] Set stockStatus to out_of_stock (available)');
            foundStock = true;
            break;
          }
        }
        if (text.includes('sold out')) {
          stockStatus = 'out_of_stock';
          console.log('[AliExpress Stock Debug] Found "sold out" in text:', text);
          foundStock = true;
          break;
        }
      }
      if (!foundStock) {
        console.log('[AliExpress Stock Debug] No stock info found in spans, falling back to previous selectors');
        // fallback to previous selectors
        const stockSelectors = [
          '.product-quantity-tip',
          '.product-quantity-info',
          '.product-quantity',
          '.quantity-tip',
          '.quantity-info',
          '.quantity',
          '.product-status',
          '.product-availability',
        ];
        for (const sel of stockSelectors) {
          const el = document.querySelector(sel) as HTMLElement;
          if (el && el.textContent) {
            const text = el.textContent.trim().toLowerCase();
            console.log('[AliExpress Stock Debug] Fallback selector', sel, 'text:', text);
            if (text.includes('in stock') || text.includes('available')) {
              stockStatus = 'in_stock';
              console.log('[AliExpress Stock Debug] Set stockStatus to in_stock (fallback)');
              break;
            } else if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
              stockStatus = 'out_of_stock';
              console.log('[AliExpress Stock Debug] Set stockStatus to out_of_stock (fallback)');
              break;
            }
          }
        }
      }

      // Discount & promotion extraction for AliExpress
      let discountInfo = '';
      const discountSelectors = [
        '.product-discount',
        '.product-promotion',
        '.store-promotion-tag',
        '.store-promotion-content',
        '.product-promotion-tag',
        '.product-promotion-content',
        '.product-coupon',
        '.product-coupon-tag',
        '.product-coupon-content',
        '.product-coupon-info',
        '.product-coupon-desc',
        '.product-coupon-title',
        '.product-coupon-value',
        '.product-coupon-amount',
        '.product-coupon-label',
        '.product-coupon-text',
        '.product-coupon-discount',
        '.product-coupon-promo',
        '.product-coupon-saving',
        '.product-coupon-off',
        '.product-coupon-save',
        '.product-coupon-promotion',
        '.product-coupon-cashback',
        '.product-coupon-bonus',
        '.product-coupon-reward',
        '.product-coupon-voucher',
        '.product-coupon-gift',
      ];
      for (const sel of discountSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent && el.offsetParent !== null) {
          discountInfo = el.textContent.trim();
          if (discountInfo) break;
        }
      }
      // Fallback: look for keywords in all visible elements
      if (!discountInfo) {
        const allEls = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
        for (const el of allEls) {
          if (el.offsetParent !== null && el.textContent) {
            const text = el.textContent.trim();
            if (/% off|save|coupon|deal|promotion|discount|off|cashback|bonus|reward|voucher|gift/i.test(text) && text.length < 64) {
              discountInfo = text;
              break;
            }
          }
        }
      }

      return {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'aliexpress',
        imageUrl,
        stockStatus,
        discountInfo: discountInfo || undefined,
      };
    } catch (error) {
      console.error('Error extracting AliExpress product info:', error);
      return null;
    }
  }

  public async extractEbayProductInfo(): Promise<ProductInfo | null> {
    try {
      const match = window.location.pathname.match(/\/itm\/(\d+)/);
      const productId = match ? match[1] : window.location.pathname;
      const title = (document.querySelector('#itemTitle') as HTMLElement)?.innerText?.replace('Details about\xa0', '').trim() || document.title;
      // Price extraction
      let priceString =
        (document.querySelector('.x-price-primary .ux-textspans') as HTMLElement)?.innerText ||
        (document.querySelector('.x-bin-price__content .ux-textspans') as HTMLElement)?.innerText ||
        (document.querySelector('#prcIsum') as HTMLElement)?.innerText ||
        (document.querySelector('#prcIsum_bidPrice') as HTMLElement)?.innerText ||
        (document.querySelector('.x-price-approx__price') as HTMLElement)?.innerText ||
        (document.querySelector('.display-price') as HTMLElement)?.innerText ||
        (document.querySelector('.x-price-approx__value') as HTMLElement)?.innerText ||
        (document.querySelector('.item-price') as HTMLElement)?.innerText ||
        '';
      if (!priceString) {
        // Try meta tag
        const metaPrice = document.querySelector('meta[itemprop="price"]') as HTMLMetaElement;
        if (metaPrice && metaPrice.content) priceString = metaPrice.content;
      }
      if (!priceString) {
        // Try to find a price in visible text nodes
        const currencyRegex = /[$€£¥₹][0-9][0-9,.]*/g;
        const el = document.body;
        const matches = el.textContent?.match(currencyRegex);
        if (matches && matches.length > 0) {
          priceString = matches[0];
        }
      }
      console.log('[Injected][eBay] Extracted price string:', priceString);
      const price = extractPriceNumber(priceString);
      console.log('[Injected][eBay] Parsed price:', price);
      if (price === null || isNaN(price)) {
        console.warn('[Injected][eBay] Could not extract a valid price from string:', priceString);
      }
      // Improved image extraction for eBay
      let imageUrl = '';
      
      // First, try to get the main product image with data-zoom-src (highest quality)
      const mainImg = document.querySelector('img[data-zoom-src*="ebayimg.com"]') as HTMLImageElement;
      if (mainImg && mainImg.dataset.zoomSrc) {
        imageUrl = mainImg.dataset.zoomSrc;
      }
      
      // If no data-zoom-src, try to get the highest quality from srcset
      if (!imageUrl) {
        const imgWithSrcset = document.querySelector('img[srcset*="ebayimg.com"]') as HTMLImageElement;
        if (imgWithSrcset && imgWithSrcset.srcset) {
          const srcsetParts = imgWithSrcset.srcset.split(',').map(s => s.trim());
          // Find the highest resolution image (last one in srcset)
          const highestRes = srcsetParts[srcsetParts.length - 1];
          if (highestRes) {
            imageUrl = highestRes.split(' ')[0]; // Get URL part before space
          }
        }
      }
      
      // Fallback to any eBay image with alt text (product images usually have descriptive alt)
      if (!imageUrl) {
        const productImgs = Array.from(document.querySelectorAll('img[src*="ebayimg.com"]')) as HTMLImageElement[];
        const mainProductImg = productImgs.find(img => 
          img.alt && 
          img.alt.length > 10 && // Descriptive alt text
          img.offsetParent !== null && // Visible
          !img.src.includes('_50x50') && // Not thumbnail
          !img.src.includes('_140') // Not small thumbnail
        );
        if (mainProductImg) {
          imageUrl = mainProductImg.src;
        }
      }
      
      // Final fallback to meta og:image
      if (!imageUrl) {
        const metaImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (metaImg && metaImg.content) imageUrl = metaImg.content;
      }
      const currencyMatch = priceString.match(/[$€£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : '$';
      // Stock/availability extraction for eBay
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      const stockSelectors = [
        '#qtySubTxt',
        '#qtySubTxt span',
        '.d-item-availability-msg',
        '.vi-qtyS-hot-red',
        '.vi-qtyS',
        '.d-item-availability',
        '.d-item-availability-msg',
        '.d-item-availability__msg',
        '.d-item-availability__status',
        '.d-item-availability__qty',
        '.d-item-availability__qty span',
        '.d-item-availability__qty strong',
        '.d-item-availability__qty b',
        '.d-item-availability__qty',
        '.d-item-availability__msg',
        '.d-item-availability__status',
        '.d-item-availability__qty',
        '.d-item-availability__qty span',
        '.d-item-availability__qty strong',
        '.d-item-availability__qty b',
      ];
      for (const sel of stockSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('in stock') || text.includes('available')) {
            stockStatus = 'in_stock';
            break;
          } else if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
            stockStatus = 'out_of_stock';
            break;
          }
        }
      }
      // Fallback: check Buy It Now/Add to cart button
      if (stockStatus === 'unknown') {
        const buyBtn = document.querySelector('button#binBtn_btn, button#atcRedesignId_btn, button[aria-label*="Buy It Now"], button[aria-label*="Add to cart"], button[title*="Buy It Now"], button[title*="Add to cart"]') as HTMLButtonElement;
        if (buyBtn && !buyBtn.disabled && buyBtn.offsetParent !== null) {
          stockStatus = 'in_stock';
        } else {
          // If button is missing or disabled, check for out of stock text
          const oosText = document.body.innerText.toLowerCase();
          if (oosText.includes('out of stock') || oosText.includes('sold out') || oosText.includes('unavailable')) {
            stockStatus = 'out_of_stock';
          }
        }
      }
      return {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'ebay',
        imageUrl,
        stockStatus,
      };
    } catch (error) {
      console.error('Error extracting eBay product info:', error);
      return null;
    }
  }

  public async extractWalmartProductInfo(): Promise<ProductInfo | null> {
    try {
      const match = window.location.pathname.match(/\/ip\/(\d+)/);
      const productId = match ? match[1] : window.location.pathname;
      const title = (document.querySelector('h1.prod-ProductTitle') as HTMLElement)?.innerText?.trim() || document.title;
      // Try multiple selectors for price
      let priceString =
        (document.querySelector('span[itemprop="price"]') as HTMLElement)?.innerText ||
        (document.querySelector('span.price-characteristic') as HTMLElement)?.innerText ||
        (document.querySelector('span[data-automation-id="product-price"]') as HTMLElement)?.innerText ||
        (document.querySelector('.price-group') as HTMLElement)?.getAttribute('aria-label') ||
        (document.querySelector('.w_iUH7') as HTMLElement)?.innerText ||
        (document.querySelector('.w_iUH7 span') as HTMLElement)?.innerText ||
        '';
      if (!priceString) {
        // Try meta tag
        const metaPrice = document.querySelector('meta[itemprop="price"]') as HTMLMetaElement;
        if (metaPrice && metaPrice.content) priceString = metaPrice.content;
      }
      if (!priceString) {
        // Try to find a price in visible text nodes
        const currencyRegex = /[$€£¥₹][0-9][0-9,.]*/g;
        const el = document.body;
        const matches = el.textContent?.match(currencyRegex);
        if (matches && matches.length > 0) {
          priceString = matches[0];
        }
      }
      console.log('[Injected][Walmart] Extracted price string:', priceString);
      const price = extractPriceNumber(priceString);
      console.log('[Injected][Walmart] Parsed price:', price);
      if (price === null || isNaN(price)) {
        console.warn('[Injected][Walmart] Could not extract a valid price from string:', priceString);
      }
      // Improved image extraction for Walmart
      let imageUrl = '';
      
      // First, try to get the main product image with class="db" (main product image)
      const mainImg = document.querySelector('img.db[src*="walmartimages.com"]') as HTMLImageElement;
      if (mainImg && mainImg.src) {
        imageUrl = mainImg.src;
      }
      
      // If no class="db" image, try to find the hero image (main product image)
      if (!imageUrl) {
        // Look for images near the hero image span
        const heroSpan = document.querySelector('span.w_iUH7') as HTMLElement;
        if (heroSpan) {
          // Find the closest img element to the hero span
          const heroImg = heroSpan.closest('div')?.querySelector('img[src*="walmartimages.com"]') as HTMLImageElement;
          if (heroImg && heroImg.src) {
            imageUrl = heroImg.src;
          }
        }
      }
      
      // Try other specific selectors
      if (!imageUrl) {
        const specificImgs = [
          document.querySelector('img[alt][src*="walmartimages.com"]') as HTMLImageElement,
          document.querySelector('img.prod-hero-image-image') as HTMLImageElement,
          document.querySelector('img[data-testid="product-image"]') as HTMLImageElement,
          document.querySelector('img[data-fs-element="media-image-primary"]') as HTMLImageElement
        ];
        
        for (const img of specificImgs) {
          if (img && img.src && img.offsetParent !== null) {
            imageUrl = img.src;
            break;
          }
        }
      }
      
      // Fallback: find any Walmart image with descriptive alt text and proper format
      if (!imageUrl) {
        const walmartImgs = Array.from(document.querySelectorAll('img[src*="walmartimages.com"]')) as HTMLImageElement[];
        const mainProductImg = walmartImgs.find(img => 
          img.alt && 
          img.alt.length > 10 && // Descriptive alt text
          img.offsetParent !== null && // Visible
          !img.src.includes('_50x50') && // Not thumbnail
          !img.src.includes('_140') && // Not small thumbnail
          !img.src.includes('logo') && // Not logo
          !img.alt.toLowerCase().includes('logo') && // Alt text doesn't contain logo
          img.src.includes('odnHeight') // Main product image format
        );
        if (mainProductImg) {
          imageUrl = mainProductImg.src;
        }
      }
      
      // Final fallback to meta og:image
      if (!imageUrl) {
        const metaImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (metaImg && metaImg.content) imageUrl = metaImg.content;
      }
      const currencyMatch = priceString.match(/[$€£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : '$';
      // Improved stock/availability extraction for Walmart
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      const stockSelectors = [
        '.prod-blitz-copy-message',
        '.prod-ProductOffer-oosMsg',
        '.prod-ProductOffer-fulfillmentMsg',
        '.prod-ProductOffer-fulfillmentMsg span',
        '.prod-ProductOffer-fulfillmentMsg strong',
        '.prod-ProductOffer-fulfillmentMsg b',
        '.prod-ProductOffer-fulfillmentMsg',
        '.prod-ProductOffer-fulfillmentMsg span',
        '.prod-ProductOffer-fulfillmentMsg strong',
        '.prod-ProductOffer-fulfillmentMsg b',
        '.prod-ProductOffer-oosMsg',
        '.prod-ProductOffer-oosMsg span',
        '.prod-ProductOffer-oosMsg strong',
        '.prod-ProductOffer-oosMsg b',
        '.prod-blitz-copy-message',
        '.prod-blitz-copy-message span',
        '.prod-blitz-copy-message strong',
        '.prod-blitz-copy-message b',
        '.prod-blitz-copy-message',
      ];
      for (const sel of stockSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('in stock') || text.includes('available') || text.includes('pickup today')) {
            stockStatus = 'in_stock';
            break;
          } else if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
            stockStatus = 'out_of_stock';
            break;
          }
        }
      }
      // New: Check for 'Only X left', 'Limited stock', etc.
      if (stockStatus === 'unknown') {
        const limitedStock = Array.from(document.querySelectorAll('span, div')).find(el => {
          const text = el.textContent?.toLowerCase() || '';
          return (text.match(/only \d+ left/) || text.includes('limited stock') || text.includes('few left') || text.includes('low stock')) && (el as HTMLElement).offsetParent !== null;
        });
        if (limitedStock) {
          stockStatus = 'in_stock';
        }
      }
      // Improved: Check for any visible button/span/div with 'add to cart' in text or aria-label
      if (stockStatus === 'unknown') {
        const addToCart = Array.from(document.querySelectorAll('button, span, div')).find(el => {
          const text = el.textContent?.toLowerCase() || '';
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          return ((text.includes('add to cart') || aria.includes('add to cart')) && (el as HTMLElement).offsetParent !== null);
        });
        if (addToCart) {
          stockStatus = 'in_stock';
        }
      }
      // Out of stock fallback
      if (stockStatus === 'unknown') {
        const oosText = document.body.innerText.toLowerCase();
        if (oosText.includes('out of stock') || oosText.includes('sold out') || oosText.includes('unavailable')) {
          stockStatus = 'out_of_stock';
        }
      }
      return {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'walmart',
        imageUrl,
        stockStatus,
      };
    } catch (error) {
      console.error('Error extracting Walmart product info:', error);
      return null;
    }
  }

  public async extractSheinProductInfo(): Promise<ProductInfo | null> {
    try {
      const match = window.location.pathname.match(/\/item\/(\d+)\.html/);
      const productId = match ? match[1] : window.location.pathname;
      const title = (document.querySelector('.product-intro__head-name') as HTMLElement)?.innerText?.trim() || document.title;
      // Try multiple selectors for price
      let priceString =
        (document.querySelector('.product-intro__head-price .original') as HTMLElement)?.innerText ||
        (document.querySelector('.product-intro__head-price .discounted') as HTMLElement)?.innerText ||
        (document.querySelector('.product-intro__head-price') as HTMLElement)?.innerText ||
        (document.querySelector('.product-price__price') as HTMLElement)?.innerText ||
        '';
      if (!priceString) {
        // Try meta tag
        const metaPrice = document.querySelector('meta[itemprop="price"]') as HTMLMetaElement;
        if (metaPrice && metaPrice.content) priceString = metaPrice.content;
      }
      if (!priceString) {
        // Try to find a price in visible text nodes
        const currencyRegex = /[$€£¥₹][0-9][0-9,.]*/g;
        const el = document.body;
        const matches = el.textContent?.match(currencyRegex);
        if (matches && matches.length > 0) {
          priceString = matches[0];
        }
      }
      console.log('[Injected][Shein] Extracted price string:', priceString);
      const price = extractPriceNumber(priceString);
      console.log('[Injected][Shein] Parsed price:', price);
      if (price === null || isNaN(price)) {
        console.warn('[Injected][Shein] Could not extract a valid price from string:', priceString);
      }
      // Improved image extraction
      let imageUrl = '';
      const imgEl = document.querySelector('img.crop-image-container__img') as HTMLImageElement;
      if (imgEl) {
        imageUrl = imgEl.src.startsWith('//') ? 'https:' + imgEl.src : imgEl.src;
      }
      if (!imageUrl) {
        const metaImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (metaImg && metaImg.content) imageUrl = metaImg.content;
      }
      if (!imageUrl) {
        // fallback to any img
        const anyImg = document.querySelector('img') as HTMLImageElement;
        if (anyImg) imageUrl = anyImg.src.startsWith('//') ? 'https:' + anyImg.src : anyImg.src;
      }
      const currencyMatch = priceString.match(/[$€£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : '$';
      // Stock/availability extraction for Shein
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      const stockSelectors = [
        '.product-intro__stock',
        '.product-intro__stock span',
        '.product-intro__stock strong',
        '.product-intro__stock b',
        '.product-intro__stock',
        '.product-intro__status',
        '.product-intro__status span',
        '.product-intro__status strong',
        '.product-intro__status b',
        '.product-intro__status',
      ];
      for (const sel of stockSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('in stock') || text.includes('available')) {
            stockStatus = 'in_stock';
            break;
          } else if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
            stockStatus = 'out_of_stock';
            break;
          }
        }
      }
      // Fallback: check Add to Bag/Buy Now button
      if (stockStatus === 'unknown') {
        const addBtn = document.querySelector('button.product-intro__add-btn, button[aria-label*="Add to Bag"], button[aria-label*="Buy Now"], button[title*="Add to Bag"], button[title*="Buy Now"]') as HTMLButtonElement;
        if (addBtn && !addBtn.disabled && addBtn.offsetParent !== null) {
          stockStatus = 'in_stock';
        } else {
          // If button is missing or disabled, check for out of stock text
          const oosText = document.body.innerText.toLowerCase();
          if (oosText.includes('out of stock') || oosText.includes('sold out') || oosText.includes('unavailable')) {
            stockStatus = 'out_of_stock';
          }
        }
      }
      return {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'shein',
        imageUrl,
        stockStatus,
      };
    } catch (error) {
      console.error('Error extracting Shein product info:', error);
      return null;
    }
  }

  public getCurrentPrice(): number | null {
    if (this.platform === 'amazon') {
      return this.getAmazonCurrentPrice();
    } else if (this.platform === 'aliexpress') {
      return this.getAliExpressCurrentPrice();
    }
    return null;
  }

  private getAmazonCurrentPrice(): number | null {
    // Use the same robust logic as extractAmazonProductInfo
    let priceString = '';
    const offscreen = document.querySelector('.a-price .a-offscreen') as HTMLElement;
    if (offscreen && offscreen.textContent) {
      priceString = offscreen.textContent.trim();
    }
    if (!priceString) {
      const priceWhole = document.querySelector('.a-price-whole')?.textContent?.replace(/[^0-9]/g, '');
      const priceFraction = document.querySelector('.a-price-fraction')?.textContent?.replace(/[^\d]/g, '');
      if (priceWhole) {
        priceString = priceFraction ? `${priceWhole}.${priceFraction}` : priceWhole;
      }
    }
    if (!priceString) {
      const anyOffscreen = document.querySelector('.a-offscreen') as HTMLElement;
      if (anyOffscreen && anyOffscreen.textContent) {
        priceString = anyOffscreen.textContent.trim();
      }
    }
    if (!priceString) {
      priceString =
        (document.getElementById('priceblock_ourprice') as HTMLElement)?.innerText ||
        (document.getElementById('priceblock_dealprice') as HTMLElement)?.innerText ||
        (document.getElementById('priceblock_saleprice') as HTMLElement)?.innerText ||
        '';
    }
    if (!priceString) {
      const priceCandidates = Array.from(document.querySelectorAll('.a-offscreen')) as HTMLElement[];
      const found = priceCandidates.find(el => el.innerText.trim().match(/[$€£¥₹]/));
      if (found) priceString = found.innerText.trim();
    }
    const price = priceString ? parseFloat(priceString.replace(/[^0-9.]/g, '')) : null;
    return price && !isNaN(price) ? price : null;
  }

  private getAliExpressCurrentPrice(): number | null {
    // Enhanced price extraction for AliExpress
    const priceSelectors = [
      '.product-price-value',
      '.product-price-current',
      '.product-price',
      '.price-current',
      '.price-value',
      '[data-pl="product-price"]',
      '.product-info-price .price',
      '.product-price-info .price',
      '.price-box .price',
      '.product-price-box .price',
      '.product-price-current .price',
      '.product-price-value .price',
      '.price-current .price',
      '.price-value .price'
    ];
    
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element?.textContent) {
        const priceText = element.textContent.trim();
        const priceMatch = priceText.match(/(?:US\s*\$|[\$€£¥₹])\s*([\d,]+\.?\d*)/);
        if (priceMatch) {
          return parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }
    }
    
    // Fallback: search all elements for price patterns
    const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      const priceMatch = text.match(/(?:US\s*\$|[\$€£¥₹])\s*([\d,]+\.?\d*)/);
      if (priceMatch && text.length < 50) {
        return parseFloat(priceMatch[1].replace(/,/g, ''));
      }
    }
    
    return null;
  }

  // Best Buy product extraction
  public async extractBestBuyProductInfo(): Promise<ProductInfo | null> {
    try {
      console.log('🔍 [Best Buy] Starting product extraction...');
      
      // Extract product ID from URL
      const productId = this.extractBestBuyProductId();
      console.log('🔍 [Best Buy] Product ID:', productId);
      if (!productId) {
        console.error('❌ [Best Buy] Failed to extract product ID');
        return null;
      }

      // Extract title
      const title = this.extractBestBuyTitle();
      console.log('🔍 [Best Buy] Title:', title);
      if (!title) {
        console.error('❌ [Best Buy] Failed to extract title');
        return null;
      }

      // Extract price
      const price = this.extractBestBuyPrice();
      console.log('🔍 [Best Buy] Price:', price);
      if (!price) {
        console.error('❌ [Best Buy] Failed to extract price');
        return null;
      }

      // Extract image
      const imageUrl = this.extractBestBuyImage();
      console.log('🔍 [Best Buy] Image URL:', imageUrl);

      // Extract stock status
      const stockStatus = this.extractBestBuyStockStatus();
      console.log('🔍 [Best Buy] Stock Status:', stockStatus);

      const productInfo = {
        id: productId,
        url: window.location.href,
        title: title,
        price: price,
        currency: '$',
        platform: 'bestbuy' as const,
        imageUrl: imageUrl,
        stockStatus: stockStatus
      };
      
      console.log('✅ [Best Buy] Successfully extracted product:', productInfo);
      return productInfo;
    } catch (error) {
      console.error('❌ [Best Buy] Error extracting product info:', error);
      return null;
    }
  }

  // Target product extraction
  public async extractTargetProductInfo(): Promise<ProductInfo | null> {
    try {
      // Extract product ID from URL
      const productId = this.extractTargetProductId();
      if (!productId) return null;

      // Extract title
      const title = this.extractTargetTitle();
      if (!title) return null;

      // Extract price
      const price = this.extractTargetPrice();
      if (!price) return null;

      // Extract image
      const imageUrl = this.extractTargetImage();

      // Extract stock status
      const stockStatus = this.extractTargetStockStatus();

      return {
        id: productId,
        url: window.location.href,
        title: title,
        price: price,
        currency: '$',
        platform: 'target',
        imageUrl: imageUrl,
        stockStatus: stockStatus
      };
    } catch (error) {
      console.error('Error extracting Target product info:', error);
      return null;
    }
  }

  // Best Buy helper methods
  private extractBestBuyProductId(): string | null {
    // Best Buy uses skuId in URL or path
    const urlParams = new URLSearchParams(window.location.search);
    const skuId = urlParams.get('skuId');
    if (skuId) return skuId;
    
    // Fallback to path extraction
    const match = window.location.pathname.match(/\/site\/[^\/]+\/(\d+)/);
    return match ? match[1] : null;
  }

  private extractBestBuyTitle(): string | null {
    const titleSelectors = [
      'h1[data-testid="product-title"]',
      'h1.heading-5',
      'h1.heading-4',
      'h1',
      'meta[property="og:title"]',
      'meta[name="title"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector) as HTMLElement | HTMLMetaElement;
      if (element) {
        if (element.tagName === 'META') {
          const content = (element as HTMLMetaElement).content?.trim();
          if (content) return content;
        } else {
          const text = (element as HTMLElement).textContent?.trim();
          if (text) return text;
        }
      }
    }
    return null;
  }

  private extractBestBuyPrice(): number | null {
    const priceSelectors = [
      '[data-testid="customer-price"]',
      '.priceView-customer-price span',
      '.priceView-layout-large .priceView-customer-price span',
      '.priceView-customer-price',
      '.priceView-layout-large .priceView-customer-price',
      '.priceView-pricing-price',
      '.priceView-pricing-price span',
      '.priceView-pricing-price .priceView-customer-price',
      '.priceView-pricing-price .priceView-customer-price span'
    ];

    for (const selector of priceSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element?.textContent) {
        const priceText = element.textContent.trim();
        const price = extractPriceNumber(priceText);
        if (price) return price;
      }
    }
    
    // Fallback: search for any price pattern in the page
    const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      if (text.includes('$') && text.length < 50) {
        const price = extractPriceNumber(text);
        if (price && price > 0 && price < 10000) return price;
      }
    }
    
    return null;
  }

  private extractBestBuyImage(): string | undefined {
    // First, try to find the main product image with the specific Best Buy structure
    const mainImageSelectors = [
      'img[data-nimg="1"][class*="basis-full"]', // Main product image with full basis class
      'img[data-nimg="1"][class*="object-contain"]', // Main product image with object-contain
      'img[data-nimg="1"]', // Fallback to any data-nimg="1"
      'img[class*="flex grow shrink-none"]', // Specific class pattern
      'img[alt*="Type here to search"]' // Alt text pattern for main image
    ];

    for (const selector of mainImageSelectors) {
      const element = document.querySelector(selector) as HTMLImageElement;
      if (element) {
        // Skip promotional/additional images (not the main product)
        if (element.alt && (
          element.alt.toLowerCase().includes('xbox') ||
          element.alt.toLowerCase().includes('game pass') ||
          element.alt.toLowerCase().includes('promotion') ||
          element.alt.toLowerCase().includes('advertisement') ||
          element.alt.toLowerCase().includes('banner')
        )) {
          console.log(`🚫 [Best Buy] Skipping promotional image: ${element.alt}`);
          continue; // Try next selector
        }
        
        console.log(`🔍 [Best Buy] Found potential main image with selector: ${selector}`);
        console.log(`🔍 [Best Buy] Image alt: ${element.alt}`);
        console.log(`🔍 [Best Buy] Image src: ${element.src}`);
        
        // Best Buy images have srcset with multiple resolutions, get the highest quality
        if (element.srcset) {
          const srcset = element.srcset;
          console.log(`🔍 [Best Buy] Found srcset: ${srcset}`);
          
          // Parse srcset to find highest resolution
          const srcsetEntries = srcset.split(',').map(s => {
            const parts = s.trim().split(' ');
            const url = parts[0];
            const multiplier = parts[1] ? parseFloat(parts[1].replace('x', '')) : 1;
            return { url, multiplier };
          });
          
          console.log(`🔍 [Best Buy] Parsed srcset entries:`, srcsetEntries);
          
          // Sort by multiplier (highest first) and get the best quality
          srcsetEntries.sort((a, b) => b.multiplier - a.multiplier);
          
          // Get the highest resolution image
          const bestImage = srcsetEntries.find(entry => 
            entry.url.includes('bbystatic.com') && 
            !entry.url.includes('placeholder') && 
            !entry.url.includes('default')
          );
          
          if (bestImage) {
            console.log(`🖼️ [Best Buy] Selected image: ${bestImage.multiplier}x resolution`);
            console.log(`🔍 [Best Buy] Original URL: ${bestImage.url}`);
            
            // Best Buy already provides the highest resolution in srcset
            // The 2x version (1920x900) is already the best quality
            console.log(`🖼️ [Best Buy] Using highest available resolution: ${bestImage.url}`);
            return bestImage.url;
          }
        }
        
        // Fallback to src attribute - Best Buy often puts highest resolution here
        if (element.src && element.src.includes('bbystatic.com')) {
          console.log(`🔍 [Best Buy] Found src: ${element.src}`);
          
          // Best Buy's src attribute often has the highest resolution
          // Check if it already has maxHeight=1920 (which is the highest)
          if (element.src.includes('maxHeight=1920')) {
            console.log(`🖼️ [Best Buy] Src already has highest resolution: ${element.src}`);
            return element.src;
          }
          
          // If not, try to enhance it
          const baseUrl = element.src.split(';')[0]; // Remove resolution parameters
          if (baseUrl) {
            const highResUrl = `${baseUrl};maxHeight=1920;maxWidth=900?format=webp`;
            console.log(`🖼️ [Best Buy] Enhanced src to high-res: ${highResUrl}`);
            return highResUrl;
          }
          return element.src;
        }
      }
    }

    // Fallback to other selectors
    const imageSelectors = [
      'img[data-testid="product-image"]',
      '.product-image img',
      '.gallery-image img',
      '.product-gallery img',
      '.product-gallery-image img',
      '.product-gallery-image',
      '.product-image',
      'meta[property="og:image"]',
      'meta[property="product:image"]'
    ];

    for (const selector of imageSelectors) {
      const element = document.querySelector(selector) as HTMLImageElement | HTMLMetaElement;
      if (element) {
        if (element.tagName === 'META') {
          const content = (element as HTMLMetaElement).content;
          if (content) return content;
        } else {
          const src = (element as HTMLImageElement).src;
          if (src && !src.includes('placeholder') && !src.includes('default')) return src;
        }
      }
    }
    
    // Final fallback: find any Best Buy product image
    const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    console.log(`🔍 [Best Buy] Found ${images.length} total images on page`);
    
    // First, try to find the main product image with specific Best Buy patterns
    for (const img of images) {
      const src = img.src;
      if (src && src.includes('bbystatic.com') && !src.includes('placeholder') && !src.includes('default')) {
        console.log(`🔍 [Best Buy] Found bbystatic image: ${src}`);
        
        // Enhanced Best Buy image URL optimization
        if (src.includes(';maxHeight=') || src.includes(';maxWidth=')) {
          // Already has resolution parameters, maximize them
          const baseUrl = src.split(';')[0];
          const highResUrl = `${baseUrl};maxHeight=1920;maxWidth=1920?format=webp`;
          console.log(`🖼️ [Best Buy] Enhanced resolution: ${highResUrl}`);
          return highResUrl;
        }
        
        // If no resolution parameters, add high-res ones
        if (src.includes('.jpg') || src.includes('.png') || src.includes('bbystatic.com')) {
          const baseUrl = src.split('?')[0]; // Remove query parameters
          const enhancedUrl = `${baseUrl};maxHeight=1920;maxWidth=1920?format=webp`;
          console.log(`🖼️ [Best Buy] Added high-res parameters: ${enhancedUrl}`);
          return enhancedUrl;
        }
        
        return src;
      }
    }
    
    // If no bbystatic images found, try to find any product image
    for (const img of images) {
      const src = img.src;
      if (src && (src.includes('bestbuy') || src.includes('product')) && !src.includes('placeholder') && !src.includes('default')) {
        console.log(`🔍 [Best Buy] Found alternative image: ${src}`);
        return src;
      }
    }
    
    console.log(`❌ [Best Buy] No suitable images found`);
    return undefined;
  }

  private extractBestBuyStockStatus(): 'in_stock' | 'out_of_stock' | 'unknown' {
    const stockSelectors = [
      '[data-testid="add-to-cart-button"]',
      '.add-to-cart-button',
      '.c-button-disabled',
      '.add-to-cart',
      '.add-to-cart-btn',
      '.add-to-cart-button-disabled'
    ];

    for (const selector of stockSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('add to cart') || text.includes('add to cart')) {
          return 'in_stock';
        } else if (text.includes('sold out') || text.includes('out of stock') || 
                   element.classList.contains('c-button-disabled') ||
                   element.classList.contains('add-to-cart-button-disabled')) {
          return 'out_of_stock';
        }
      }
    }
    
    // Check for availability text
    const availabilitySelectors = [
      '[data-testid="availability-message"]',
      '.availability-message',
      '.product-availability',
      '.availability'
    ];
    
    for (const selector of availabilitySelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('in stock') || text.includes('available')) {
          return 'in_stock';
        } else if (text.includes('out of stock') || text.includes('unavailable')) {
          return 'out_of_stock';
        }
      }
    }
    
    return 'unknown';
  }

  // Target helper methods
  private extractTargetProductId(): string | null {
    const match = window.location.pathname.match(/\/p\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private extractTargetTitle(): string | null {
    const titleSelectors = [
      'h1[data-test="product-title"]',
      'h1',
      'meta[property="og:title"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector) as HTMLElement | HTMLMetaElement;
      if (element) {
        if (element.tagName === 'META') {
          return (element as HTMLMetaElement).content?.trim() || null;
        } else {
          return (element as HTMLElement).textContent?.trim() || null;
        }
      }
    }
    return null;
  }

  private extractTargetPrice(): number | null {
    const priceSelectors = [
      '[data-test="product-price"]',
      '.price',
      '.product-price',
      'meta[property="product:price:amount"]'
    ];

    for (const selector of priceSelectors) {
      const element = document.querySelector(selector) as HTMLElement | HTMLMetaElement;
      if (element) {
        if (element.tagName === 'META') {
          const priceText = (element as HTMLMetaElement).content || '';
          const price = extractPriceNumber(priceText);
          if (price) return price;
        } else {
          const priceText = element.textContent || '';
          const price = extractPriceNumber(priceText);
          if (price) return price;
        }
      }
    }
    return null;
  }

  private extractTargetImage(): string | undefined {
    console.log(`🔍 [Target] Extracting image for: ${document.title}`);
    
    // First, try to find the main product image with specific Target selectors
    const mainImageSelectors = [
      'img[data-test="product-image"]',
      'img[data-testid="product-image"]',
      '.product-image img',
      '.product-image',
      'img[alt*="product"]',
      'img[alt*="main"]'
    ];

    for (const selector of mainImageSelectors) {
      const element = document.querySelector(selector) as HTMLImageElement;
      if (element && element.src) {
        console.log(`🔍 [Target] Found image with selector: ${selector}`);
        console.log(`🔍 [Target] Image src: ${element.src}`);
        console.log(`🔍 [Target] Image alt: ${element.alt}`);
        
        // Verify this is actually a product image, not a generic one
        if (element.alt && !element.alt.toLowerCase().includes('logo') && 
            !element.alt.toLowerCase().includes('icon') && 
            !element.alt.toLowerCase().includes('banner')) {
          console.log(`🖼️ [Target] Using product image: ${element.src}`);
          return element.src;
        }
      }
    }
    
    // Fallback to meta tags, but be more selective
    const metaSelectors = [
      'meta[property="og:image"]',
      'meta[property="product:image"]',
      'meta[name="image"]'
    ];
    
    for (const selector of metaSelectors) {
      const element = document.querySelector(selector) as HTMLMetaElement;
      if (element && element.content) {
        console.log(`🔍 [Target] Found meta image: ${element.content}`);
        // Only use if it's not a generic Target image
        if (!element.content.includes('target.com/logo') && 
            !element.content.includes('target.com/icon')) {
          console.log(`🖼️ [Target] Using meta image: ${element.content}`);
          return element.content;
        }
      }
    }
    
    // Final fallback: find any image that looks like a product image
    const allImages = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    console.log(`🔍 [Target] Found ${allImages.length} total images`);
    
    for (const img of allImages) {
      if (img.src && img.alt) {
        const alt = img.alt.toLowerCase();
        const src = img.src.toLowerCase();
        
        // Skip generic images
        if (alt.includes('logo') || alt.includes('icon') || alt.includes('banner') ||
            alt.includes('search') || alt.includes('menu') || alt.includes('cart')) {
          continue;
        }
        
        // Look for product-like images
        if (alt.includes('product') || alt.includes('main') || 
            (src.includes('target') && src.includes('product'))) {
          console.log(`🖼️ [Target] Using fallback image: ${img.src}`);
          return img.src;
        }
      }
    }
    
    console.log(`❌ [Target] No suitable product image found`);
    return undefined;
  }

  private extractTargetStockStatus(): 'in_stock' | 'out_of_stock' | 'unknown' {
    const stockSelectors = [
      '[data-test="add-to-cart-button"]',
      '.add-to-cart-button',
      '.ship-it-button'
    ];

    for (const selector of stockSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        if (element.textContent?.toLowerCase().includes('add to cart') ||
            element.textContent?.toLowerCase().includes('ship it')) {
          return 'in_stock';
        } else if (element.textContent?.toLowerCase().includes('out of stock')) {
          return 'out_of_stock';
        }
      }
    }
    return 'unknown';
  }
}

// Create global instance
const productExtractor = new ProductExtractor();

// Listen for messages from content script
window.addEventListener('message', async (event) => {
  console.log('🔍 [Message Listener] Received message:', event.data);
  if (event.source !== window) return;

  // Handle trackProduct action from popup
  if (event.data.action === 'trackProduct') {
    console.log('🔍 [Extension] Received trackProduct request');
    console.log('🔍 [Extension] Request data:', event.data);
    
    let productInfo: ProductInfo | null = null;
    const platform = (productExtractor as any)['platform'];
    console.log('🔍 [Extension] Detected platform:', platform);
    console.log('🔍 [Extension] Current URL:', window.location.href);
    
    if (platform === 'aliexpress') {
      console.log('🔍 [Extension] Using AliExpress extraction');
      productInfo = await productExtractor.extractAliExpressProductInfo();
    } else if (platform === 'amazon') {
      console.log('🔍 [Extension] Using Amazon extraction');
      productInfo = await productExtractor.extractAmazonProductInfo();
    } else if (platform === 'bestbuy') {
      console.log('🔍 [Extension] Using Best Buy extraction');
      productInfo = await productExtractor.extractBestBuyProductInfo();
    } else if (platform === 'target') {
      console.log('🔍 [Extension] Using Target extraction');
      productInfo = await productExtractor.extractTargetProductInfo();
    } else {
      console.log('🔍 [Extension] Using generic extraction');
      productInfo = await productExtractor.extractProductInfo();
    }
    
    console.log('🔍 [Extension] Extraction result:', productInfo);
    
    // Send response back to popup
    const response = {
      type: 'TRACK_PRODUCT_RESPONSE',
      success: !!productInfo,
      data: productInfo,
      message: productInfo ? 'Product tracked successfully!' : 'Failed to extract product information'
    };
    
    console.log('🔍 [Extension] Sending response:', response);
    window.postMessage(response, '*');
  }

  // Handle GET_PRODUCT_INFO request
  if (event.data.type === 'GET_PRODUCT_INFO') {
    console.log('🔍 [Extension] Received GET_PRODUCT_INFO request');
    let productInfo: ProductInfo | null = null;
    const platform = (productExtractor as any)['platform'];
    console.log('🔍 [Extension] Detected platform:', platform);
    
    if (platform === 'aliexpress') {
      console.log('🔍 [Extension] Using AliExpress extraction');
      productInfo = await productExtractor.extractAliExpressProductInfo();
    } else if (platform === 'amazon') {
      console.log('🔍 [Extension] Using Amazon extraction');
      productInfo = await productExtractor.extractAmazonProductInfo();
    } else if (platform === 'bestbuy') {
      console.log('🔍 [Extension] Using Best Buy extraction');
      productInfo = await productExtractor.extractBestBuyProductInfo();
    } else if (platform === 'target') {
      console.log('🔍 [Extension] Using Target extraction');
      productInfo = await productExtractor.extractTargetProductInfo();
    } else {
      console.log('🔍 [Extension] Using generic extraction');
      productInfo = await productExtractor.extractProductInfo();
    }
    
    console.log('🔍 [Extension] Extraction result:', productInfo);
    
    window.postMessage({
      type: 'PRODUCT_INFO_RESPONSE',
      success: !!productInfo,
      data: productInfo
    }, '*');
  }

  if (event.data.type === 'GET_CURRENT_PRICE') {
    const currentPrice = productExtractor.getCurrentPrice();
    window.postMessage({
      type: 'CURRENT_PRICE_RESPONSE',
      success: !!currentPrice,
      data: currentPrice
    }, '*');
  }
});

// Make extractor available globally for debugging
(window as any).realPriceTrackerExtractor = productExtractor;

// Helper: Wait for an element to appear in the DOM
function waitForElement(selector: string, timeout = 2000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector) as HTMLElement;
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector) as HTMLElement);
    }, timeout);
  });
}

// Helper to robustly extract the first valid number from a price string
function extractPriceNumber(priceString: string): number | null {
  if (!priceString) return null;
  // Match the first number with optional decimal (handles $12, $12.34, 12, 12.34, etc.)
  const match = priceString.replace(/,/g, '').match(/([0-9]+(\.[0-9]+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? null : num;
  }
  return null;
}