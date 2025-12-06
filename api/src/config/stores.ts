import express from 'express';

/**
 * Store configuration for multi-country support
 */
export interface StoreConfig {
    name: string;
    displayName: string;
    detectPattern: RegExp;
    extractId: (url: string) => string | null;
    availableCountries: string[]; // Country codes where this store operates
    buildCountryUrl: (id: string, countryCode: string) => string;
}

/**
 * Registry of supported stores with global presence
 */
export const STORES: StoreConfig[] = [
    {
        name: 'amazon',
        displayName: 'Amazon',
        detectPattern: /amazon\.(com|co\.uk|de|co\.jp|ca|com\.au)/i,
        extractId: (url: string): string | null => {
            // Match ASIN in various URL formats:
            // /dp/B0D4SV293K
            // /gp/product/B0D4SV293K
            // /product/B0D4SV293K
            const match = url.match(/\/(dp|gp\/product|product)\/([A-Z0-9]{10})/i);
            return match ? match[2] : null;
        },
        availableCountries: ['US', 'GB', 'DE', 'JP', 'CA', 'AU'],
        buildCountryUrl: (asin: string, countryCode: string): string => {
            const domains: Record<string, string> = {
                US: 'amazon.com',
                GB: 'amazon.co.uk',
                DE: 'amazon.de',
                JP: 'amazon.co.jp',
                CA: 'amazon.ca',
                AU: 'amazon.com.au'
            };
            const domain = domains[countryCode];
            return domain ? `https://www.${domain}/dp/${asin}` : '';
        }
    },
    {
        name: 'ebay',
        displayName: 'eBay',
        detectPattern: /ebay\.(com|co\.uk|de|jp|ca|com\.au)/i,
        extractId: (url: string): string | null => {
            // Match eBay item ID in URL: /itm/123456789012
            const match = url.match(/\/itm\/(\d{10,12})/i);
            return match ? match[1] : null;
        },
        availableCountries: ['US', 'GB', 'DE', 'JP', 'CA', 'AU'],
        buildCountryUrl: (itemId: string, countryCode: string): string => {
            const domains: Record<string, string> = {
                US: 'ebay.com',
                GB: 'ebay.co.uk',
                DE: 'ebay.de',
                JP: 'ebay.jp',
                CA: 'ebay.ca',
                AU: 'ebay.com.au'
            };
            const domain = domains[countryCode];
            return domain ? `https://www.${domain}/itm/${itemId}` : '';
        }
    },
    {
        name: 'walmart',
        displayName: 'Walmart',
        detectPattern: /walmart\.com/i,
        extractId: (): string | null => null, // Walmart SKUs don't work internationally
        availableCountries: ['US'], // US only
        buildCountryUrl: (): string => ''
    },
    {
        name: 'target',
        displayName: 'Target',
        detectPattern: /target\.com/i,
        extractId: (): string | null => null,
        availableCountries: ['US'], // US only
        buildCountryUrl: (): string => ''
    }
];

/**
 * Detect store and extract item ID from product URL
 */
export function detectStore(url: string): { storeName: string; storeItemId: string | null; storeConfig: StoreConfig | null } {
    for (const store of STORES) {
        if (store.detectPattern.test(url)) {
            const itemId = store.extractId(url);
            return {
                storeName: store.name,
                storeItemId: itemId,
                storeConfig: store
            };
        }
    }

    return {
        storeName: 'unknown',
        storeItemId: null,
        storeConfig: null
    };
}

/**
 * Get store configuration by name
 */
export function getStoreConfig(storeName: string): StoreConfig | null {
    return STORES.find(s => s.name === storeName) || null;
}
