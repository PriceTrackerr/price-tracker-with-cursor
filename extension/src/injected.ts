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
      console.log('🔍 [Amazon] Starting product extraction...');
      console.log('🔍 [Amazon] Current URL:', window.location.href);
      console.log('🔍 [Amazon] Current pathname:', window.location.pathname);

      // Support multiple URL formats for ASIN
      let productId = null;
      const urlPatterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i,
        /\/([A-Z0-9]{10})(?:[/?]|$)/i
      ];

      for (const pattern of urlPatterns) {
        const match = window.location.pathname.match(pattern);
        if (match) {
          productId = match[1];
          console.log('🔍 [Amazon] Found product ID with pattern:', pattern, 'ID:', productId);
          break;
        }
      }

      // Fallback: try meta og:url
      if (!productId) {
        const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
        if (ogUrl && ogUrl.content) {
          console.log('🔍 [Amazon] Trying og:url:', ogUrl.content);
          const ogMatch = ogUrl.content.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
          if (ogMatch) {
            productId = ogMatch[1];
            console.log('🔍 [Amazon] Found product ID from og:url:', productId);
          }
        }
      }

      if (!productId) {
        console.error('🔍 [Amazon] No product ID found');
        return null;
      }

      // Robust title extraction
      let title = '';
      const titleSelectors = [
        '#productTitle',
        'span#productTitle',
        'h1[data-testid="product-title"]',
        'h1.a-size-large.a-spacing-none',
        'h1.a-size-large',
        'h1',
        '[data-feature-name="title"] h1',
        '.product-title',
        'meta[name="title"]',
        'meta[property="og:title"]'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || el.textContent?.trim() || '';
          }
          if (title) {
            console.log('🔍 [Amazon] Found title with selector:', sel, 'Title:', title);
            break;
          }
        }
      }

      if (!title) {
        // Fallback to page title
        title = document.title.replace(/ - Amazon.*$/, '').replace(/Amazon\.com : /, '').trim();
        console.log('🔍 [Amazon] Using page title as fallback:', title);
      }

      // Enhanced price extraction
      let priceString = '';
      const priceSelectors = [
        '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
        '.a-price .a-offscreen:first-child',
        '.a-price .a-offscreen:not([data-a-strike])',
        '.a-price.a-text-price .a-offscreen',
        '.a-price-whole',
        '.a-price-fraction',
        '#apex_desktop .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#priceblock_saleprice',
        '.a-color-price:not(.a-text-strike)',
        '.a-size-medium.a-color-price',
        '.a-offscreen'
      ];

      for (const sel of priceSelectors) {
        const el = document.querySelector(sel) as HTMLElement;
        if (el && el.textContent && el.offsetParent !== null) {
          const text = el.textContent.trim();
          if (text.match(/[$€£¥₹]/)) {
            priceString = text;
            console.log('🔍 [Amazon] Found price with selector:', sel, 'Price:', priceString);
            break;
          }
        }
      }

      // Enhanced fallback: scan all .a-offscreen for price patterns
      if (!priceString) {
        console.log('🔍 [Amazon] No price found with selectors, trying fallback...');
        const candidates = Array.from(document.querySelectorAll('.a-offscreen')) as HTMLElement[];
        for (const el of candidates) {
          if (el.textContent && el.offsetParent !== null) {
            const text = el.textContent.trim();
            if (text.match(/[$€£¥₹]/) && !text.toLowerCase().includes('was') && !text.toLowerCase().includes('list')) {
              priceString = text;
              console.log('🔍 [Amazon] Found price in fallback scan:', priceString);
              break;
            }
          }
        }
      }

      // Try to build price from separate whole and fraction parts
      if (!priceString) {
        const priceWhole = document.querySelector('.a-price-whole')?.textContent?.replace(/[^0-9]/g, '');
        const priceFraction = document.querySelector('.a-price-fraction')?.textContent?.replace(/[^0-9]/g, '');
        if (priceWhole) {
          priceString = priceFraction ? `$${priceWhole}.${priceFraction}` : `$${priceWhole}`;
          console.log('🔍 [Amazon] Built price from parts:', priceString);
        }
      }

      const price = priceString ? parseFloat(priceString.replace(/[^0-9.]/g, '')) : null;
      console.log('🔍 [Amazon] Final price:', price, 'from string:', priceString);

      if (price === null || isNaN(price) || price <= 0) {
        console.warn('🔍 [Amazon] Could not extract a valid price from string:', priceString);
        return null;
      }

      // Enhanced image extraction
      let imageUrl = '';
      const imageSelectors = [
        '#landingImage',
        '#imgTagWrapperId img',
        'img[data-old-hires]',
        'img[data-a-dynamic-image]',
        '.a-dynamic-image',
        '#imgBlkFront',
        'img[src*="images/I/"]',
        'meta[property="og:image"]'
      ];

      for (const sel of imageSelectors) {
        const el = document.querySelector(sel) as HTMLImageElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            imageUrl = (el as HTMLMetaElement).content || '';
          } else {
            imageUrl = (el as HTMLImageElement).src || '';
          }
          if (imageUrl && !imageUrl.includes('transparent-pixel')) {
            console.log('🔍 [Amazon] Found image with selector:', sel, 'URL:', imageUrl);
            break;
          }
        }
      }

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

      const result = {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'amazon' as const,
        imageUrl: imageUrl || undefined,
        stockStatus,
        discountInfo: discountInfo || undefined,
      };

      console.log('🔍 [Amazon] Final extraction result:', result);

      // Validate required fields
      if (!result.id || !result.title || !result.price) {
        console.error('🔍 [Amazon] Missing required fields:', {
          id: !!result.id,
          title: !!result.title,
          price: !!result.price
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('🔍 [Amazon] Error extracting product info:', error);
      return null;
    }
  }

  // AliExpress extraction - Updated for 2026 page structure
  public async extractAliExpressProductInfo(): Promise<ProductInfo | null> {
    try {
      console.log('🔍 [AliExpress] Starting extraction...');
      console.log('🔍 [AliExpress] URL:', window.location.href);

      // Extract product ID from URL
      const urlMatch = window.location.pathname.match(/\/item\/(\d+)\.html/);
      if (!urlMatch) {
        console.error('🔍 [AliExpress] No product ID in URL');
        return null;
      }
      const productId = urlMatch[1];
      console.log('🔍 [AliExpress] Product ID:', productId);

      // Wait for page to fully load (AliExpress is SPA)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // === TITLE EXTRACTION ===
      let title = '';
      const titleSelectors = [
        'h1[data-pl="product-title"]',
        '.product-title-text',
        'h1.product-title',
        '.product-title',
        'h1',
        'meta[property="og:title"]'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || el.textContent?.trim() || '';
          }
          if (title && title.length > 5) {
            console.log('🔍 [AliExpress] Found title:', title.substring(0, 50));
            break;
          }
        }
      }

      if (!title) {
        title = document.title.replace(/ - AliExpress$/, '').replace(/ - AliExpress Mobile$/, '').trim();
        console.log('🔍 [AliExpress] Using page title:', title.substring(0, 50));
      }

      if (!title || title.length < 3) {
        console.error('🔍 [AliExpress] Could not extract title');
        return null;
      }

      // === PRICE EXTRACTION ===
      let priceString = '';
      let currency = 'US $';

      // Modern AliExpress price selectors (2026)
      const priceSelectors = [
        '[data-pl="product-price"]',
        '.product-price-value',
        '.product-price-current',
        '.price-current',
        '.product-price',
        '.sale-price',
        '.original-price',
        '.discount-price',
        'span[class*="price"]',
        'div[class*="price"]'
      ];

      for (const sel of priceSelectors) {
        const elements = document.querySelectorAll(sel);
        for (const el of Array.from(elements) as HTMLElement[]) {
          const text = el.textContent?.trim() || '';
          // Look for price patterns
          const priceMatch = text.match(/(?:US\s*\$|\$|€|£|¥|₹)\s*([\d,]+\.?\d*)/);
          if (priceMatch && text.length < 50) {
            priceString = text;
            const currMatch = text.match(/(US\s*\$|\$|€|£|¥|₹)/);
            if (currMatch) currency = currMatch[1].trim();
            console.log('🔍 [AliExpress] Found price:', priceString);
            break;
          }
        }
        if (priceString) break;
      }

      // Fallback: scan all text for price patterns
      if (!priceString) {
        console.log('🔍 [AliExpress] Scanning page for price...');
        const allText = document.body.innerText;
        const pricePatterns = [
          /US\s*\$\s*([\d,]+\.?\d*)/,
          /\$\s*([\d,]+\.?\d*)/,
          /€\s*([\d,]+\.?\d*)/,
          /£\s*([\d,]+\.?\d*)/,
        ];

        for (const pattern of pricePatterns) {
          const match = allText.match(pattern);
          if (match) {
            priceString = match[0];
            const currMatch = priceString.match(/(US\s*\$|\$|€|£|¥|₹)/);
            if (currMatch) currency = currMatch[1].trim();
            console.log('🔍 [AliExpress] Found price in text:', priceString);
            break;
          }
        }
      }

      // Parse price
      let price: number | null = null;
      if (priceString) {
        const numericMatch = priceString.match(/([\d,]+\.?\d*)/);
        if (numericMatch) {
          price = parseFloat(numericMatch[1].replace(/,/g, ''));
          if (isNaN(price) || price <= 0) price = null;
        }
      }

      console.log('🔍 [AliExpress] Parsed price:', price);

      if (!price) {
        console.error('🔍 [AliExpress] Could not extract price');
        return null;
      }

      // === IMAGE EXTRACTION ===
      let imageUrl = '';
      const imageSelectors = [
        'img.magnifier-image',
        '.product-main-image img',
        '.product-image img',
        'img[src*=".jpg"]',
        'img[src*=".jpeg"]',
        'img[src*=".png"]',
        'meta[property="og:image"]'
      ];

      for (const sel of imageSelectors) {
        const el = document.querySelector(sel) as HTMLImageElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            imageUrl = (el as HTMLMetaElement).content || '';
          } else {
            imageUrl = (el as HTMLImageElement).src || '';
          }
          if (imageUrl && !imageUrl.includes('placeholder')) {
            // Clean up thumbnail URLs
            imageUrl = imageUrl.replace('_50x50.jpg', '.jpg').replace('_60x60.jpg', '.jpg');
            console.log('🔍 [AliExpress] Found image:', imageUrl.substring(0, 80));
            break;
          }
        }
      }

      // === STOCK STATUS ===
      let stockStatus: 'in_stock' | 'out_of_stock' | 'unknown' = 'in_stock'; // Default to in_stock

      const stockText = document.body.innerText.toLowerCase();
      if (stockText.includes('sold out') || stockText.includes('unavailable')) {
        stockStatus = 'out_of_stock';
      } else if (stockText.match(/only\s*\d+\s+left/)) {
        stockStatus = 'in_stock';
      }

      console.log('🔍 [AliExpress] Stock status:', stockStatus);

      // === BUILD RESULT ===
      const result: ProductInfo = {
        id: productId,
        url: window.location.href,
        title,
        price,
        currency: currency || 'US $',
        platform: 'aliexpress' as const,
        imageUrl: imageUrl || undefined,
        stockStatus,
        discountInfo: undefined
      };

      console.log('🔍 [AliExpress] ✅ Extraction successful:', {
        id: result.id,
        title: result.title.substring(0, 50),
        price: result.price,
        currency: result.currency
      });

      // Validate
      if (!result.id || !result.title || !result.price) {
        console.error('🔍 [AliExpress] Missing required fields');
        return null;
      }

      return result;
    } catch (error: any) {
      console.error('🔍 [AliExpress] Extraction error:', error.message);
      return null;
    }
  }

  public async extractEbayProductInfo(): Promise<ProductInfo | null> {
    try {
      console.log('🔍 [eBay] Starting product extraction...');
      console.log('🔍 [eBay] Current URL:', window.location.href);

      const match = window.location.pathname.match(/\/itm\/(\d+)/);
      const productId = match ? match[1] : window.location.pathname;
      console.log('🔍 [eBay] Product ID:', productId);

      // Enhanced title extraction
      let title = '';
      const titleSelectors = [
        '#x-title-label-lbl',
        '#itemTitle',
        'h1[id="x-title-label-lbl"]',
        'h1.notranslate',
        'h1',
        'meta[property="og:title"]'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || el.textContent?.trim() || '';
          }
          if (title) {
            title = title.replace('Details about\xa0', '').trim();
            console.log('🔍 [eBay] Found title with selector:', sel, 'Title:', title);
            break;
          }
        }
      }

      if (!title) {
        title = document.title.replace(/ \| eBay$/, '').trim();
        console.log('🔍 [eBay] Using page title as fallback:', title);
      }
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
      const result = {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'ebay' as const,
        imageUrl: imageUrl || undefined,
        stockStatus,
      };

      console.log('🔍 [eBay] Final extraction result:', result);

      // Validate required fields
      if (!result.id || !result.title || !result.price) {
        console.error('🔍 [eBay] Missing required fields:', {
          id: !!result.id,
          title: !!result.title,
          price: !!result.price
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('🔍 [eBay] Error extracting product info:', error);
      return null;
    }
  }

  public async extractWalmartProductInfo(): Promise<ProductInfo | null> {
    try {
      console.log('🔍 [Walmart] Starting product extraction...');
      console.log('🔍 [Walmart] Current URL:', window.location.href);

      const match = window.location.pathname.match(/\/ip\/(\d+)/);
      const productId = match ? match[1] : window.location.pathname;
      console.log('🔍 [Walmart] Product ID:', productId);

      // Enhanced title extraction
      let title = '';
      const titleSelectors = [
        'h1[data-testid="product-title"]',
        'h1.prod-ProductTitle',
        'h1',
        'meta[property="og:title"]'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || el.textContent?.trim() || '';
          }
          if (title) {
            console.log('🔍 [Walmart] Found title with selector:', sel, 'Title:', title);
            break;
          }
        }
      }

      if (!title) {
        title = document.title.replace(/ - Walmart.*$/, '').trim();
        console.log('🔍 [Walmart] Using page title as fallback:', title);
      }
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
      const result = {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'walmart' as const,
        imageUrl: imageUrl || undefined,
        stockStatus,
      };

      console.log('🔍 [Walmart] Final extraction result:', result);

      // Validate required fields
      if (!result.id || !result.title || !result.price) {
        console.error('🔍 [Walmart] Missing required fields:', {
          id: !!result.id,
          title: !!result.title,
          price: !!result.price
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('🔍 [Walmart] Error extracting product info:', error);
      return null;
    }
  }

  public async extractSheinProductInfo(): Promise<ProductInfo | null> {
    try {
      console.log('🔍 [Shein] Starting product extraction...');
      console.log('🔍 [Shein] Current URL:', window.location.href);

      const match = window.location.pathname.match(/\/item\/(\d+)\.html/);
      const productId = match ? match[1] : window.location.pathname;
      console.log('🔍 [Shein] Product ID:', productId);

      // Enhanced title extraction
      let title = '';
      const titleSelectors = [
        '.product-intro__head-name',
        'h1.product-intro__head-name',
        'h1',
        'meta[property="og:title"]'
      ];

      for (const sel of titleSelectors) {
        const el = document.querySelector(sel) as HTMLElement | HTMLMetaElement;
        if (el) {
          if (el.tagName === 'META') {
            title = (el as HTMLMetaElement).content?.trim() || '';
          } else {
            title = el.innerText?.trim() || el.textContent?.trim() || '';
          }
          if (title) {
            console.log('🔍 [Shein] Found title with selector:', sel, 'Title:', title);
            break;
          }
        }
      }

      if (!title) {
        title = document.title.replace(/ - SHEIN.*$/, '').trim();
        console.log('🔍 [Shein] Using page title as fallback:', title);
      }
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
      const result = {
        id: productId,
        url: window.location.href,
        title,
        price: price && !isNaN(price) ? price : null,
        currency,
        platform: 'shein' as const,
        imageUrl: imageUrl || undefined,
        stockStatus,
      };

      console.log('🔍 [Shein] Final extraction result:', result);

      // Validate required fields
      if (!result.id || !result.title || !result.price) {
        console.error('🔍 [Shein] Missing required fields:', {
          id: !!result.id,
          title: !!result.title,
          price: !!result.price
        });
        return null;
      }

      return result;
    } catch (error) {
      console.error('🔍 [Shein] Error extracting product info:', error);
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

      // Wait for page to load completely
      await new Promise(resolve => setTimeout(resolve, 2000));

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
    console.log('🔍 [Best Buy] Starting price extraction...');

    const priceSelectors = [
      '[data-testid="customer-price"]',
      '.priceView-customer-price span',
      '.priceView-layout-large .priceView-customer-price span',
      '.priceView-customer-price',
      '.priceView-layout-large .priceView-customer-price',
      '.priceView-pricing-price',
      '.priceView-pricing-price span',
      '.priceView-pricing-price .priceView-customer-price',
      '.priceView-pricing-price .priceView-customer-price span',
      // Additional Best Buy specific selectors
      '.priceView-hero-price',
      '.priceView-hero-price span',
      '.priceView-pricing-price .priceView-hero-price',
      '.priceView-pricing-price .priceView-hero-price span',
      '[data-testid="pricing-price"]',
      '[data-testid="pricing-price"] span',
      '.priceView-pricing-price [data-testid="pricing-price"]',
      '.priceView-pricing-price [data-testid="pricing-price"] span'
    ];

    for (const selector of priceSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element?.textContent) {
        const priceText = element.textContent.trim();
        console.log(`🔍 [Best Buy] Found price text with selector ${selector}:`, priceText);
        const price = extractPriceNumber(priceText);
        if (price) {
          console.log(`✅ [Best Buy] Successfully extracted price: $${price}`);
          return price;
        }
      }
    }

    // Enhanced fallback: search for any price pattern in the page
    console.log('🔍 [Best Buy] Trying fallback price extraction...');
    const allElements = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const element of allElements) {
      const text = element.textContent?.trim() || '';
      if (text.includes('$') && text.length < 50) {
        const price = extractPriceNumber(text);
        if (price && price > 0 && price < 10000) {
          console.log(`✅ [Best Buy] Found price in fallback text: $${price} from "${text}"`);
          return price;
        }
      }
    }

    console.log('❌ [Best Buy] No valid price found');
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
  console.log('🔍 [Injected Script] Received message:', event.data);
  console.log('🔍 [Injected Script] Event source:', event.source);
  console.log('🔍 [Injected Script] Window source:', window);

  if (event.source !== window) {
    console.log('🔍 [Injected Script] Ignoring message from different source');
    return;
  }

  // Handle trackProduct action from popup
  if (event.data.action === 'trackProduct') {
    console.log('🔍 [Injected Script] Processing trackProduct request');
    console.log('🔍 [Injected Script] Request data:', event.data);

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

// Signal that the injected script is ready
console.log('🔍 [Injected Script] Price Tracker injected script is ready');
window.postMessage({ type: 'INJECTED_SCRIPT_READY' }, '*');

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