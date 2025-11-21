import axios from 'axios';

export type StoreKey =
  | 'amazon'
  | 'aliexpress'
  | 'bestbuy'
  | 'ebay'
  | 'walmart'
  | 'target'
  | 'shein';

export interface ScrapedProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  platform: StoreKey;
  url: string;
  imageUrl?: string;
  source: 'serper';
}

const STORE_DOMAINS: Record<StoreKey, string[]> = {
  amazon: ['amazon.com'],
  aliexpress: ['aliexpress.com'],
  bestbuy: ['bestbuy.com'],
  ebay: ['ebay.com'],
  walmart: ['walmart.com'],
  target: ['target.com'],
  shein: ['shein.com']
};

const SERPER_ENDPOINT = 'https://google.serper.dev/search';
const REQUEST_DELAY_MS = { min: 250, max: 750 };
const MAX_ATTEMPTS_PER_STORE = 2;

export async function scrapeWithHybrid(
  query: string,
  store: StoreKey,
  limit: number = 3
): Promise<ScrapedProduct[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SERPER_API_KEY is missing; cannot scrape store matches.');
    return [];
  }

  const cleanedQuery = sanitizeQuery(query);
  const domains = STORE_DOMAINS[store] || [];
  if (!domains.length) {
    console.warn(`⚠️ No domain mapping found for store ${store}`);
    return [];
  }

  const results: ScrapedProduct[] = [];

  for (const domain of domains) {
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS_PER_STORE && results.length < limit) {
      attempts += 1;
      const queryVariant = attempts === 1 ? cleanedQuery : cleanedQuery.replace(/\s+/g, ' ');
      const searchQuery = `${queryVariant} site:${domain}`;
      console.log(`🔍 [${store}] Serper search attempt #${attempts}: "${searchQuery}"`);

      try {
        const response = await axios.post(
          SERPER_ENDPOINT,
          { q: searchQuery, gl: 'us', hl: 'en' },
          {
            headers: {
              'X-API-KEY': apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 25_000
          }
        );

        const organic = Array.isArray(response.data?.organic) ? response.data.organic : [];
        const localResults = parseSerperResults(organic, store, domain, limit - results.length);
        results.push(...localResults);

        if (results.length >= limit) {
          console.log(`✅ [${store}] Collected ${results.length} matches via Serper`);
          break;
        }
      } catch (error: any) {
        console.error(`❌ [${store}] Serper search failed:`, error?.message || error);
      }

      if (results.length < limit && attempts < MAX_ATTEMPTS_PER_STORE) {
        await delay(randomInt(REQUEST_DELAY_MS.min, REQUEST_DELAY_MS.max));
      }
    }

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

function parseSerperResults(
  items: any[],
  store: StoreKey,
  domain: string,
  limit: number
): ScrapedProduct[] {
  if (!Array.isArray(items) || !items.length) return [];

  const results: ScrapedProduct[] = [];

  for (let i = 0; i < items.length && results.length < limit; i += 1) {
    const item = items[i];
    const url = item.link || item.url;
    if (!url || !url.includes(domain)) continue;

    const price = extractPrice(item);
    if (!price || price <= 0) continue;

    results.push({
      id: `${store}_${Date.now()}_${i}`,
      title: item.title || item.name || 'Unknown product',
      price,
      currency: 'USD',
      platform: store,
      url,
      imageUrl: item.imageUrl || item.thumbnail || item.favicon || '',
      source: 'serper'
    });
  }

  return results;
}

function extractPrice(item: any): number | null {
  const candidates = [
    item.price,
    item.extracted_price,
    item.priceText,
    item.snippet,
    item.description,
    item.richSnippet?.top?.price?.value,
    item.richSnippet?.top?.price?.text
  ];

  for (const candidate of candidates) {
    const parsed = parsePrice(candidate);
    if (parsed && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function parsePrice(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.replace(/\u00A0/g, ' ').match(/\$?\s*([\d,.]+)/);
  if (!match) return null;

  const normalized = match[1].replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeQuery(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(\d+)(gb|tb|g|m|mb)\b/g, ' ')
    .replace(/\b(64|128|256|512)\s?(gb)\b/g, ' ')
    .replace(/\b(2024|2025)\b/g, ' ')
    .replace(
      /\b(new|renewed|refurbished|restored|sealed|with|case|bundle|colors|colour|color|official|genuine|free|shipping|limited|edition)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const SUPPORTED_STORES: StoreKey[] = [
  'amazon',
  'aliexpress',
  'bestbuy',
  'ebay',
  'walmart',
  'target',
  'shein'
];

