import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';

export type ProviderName = 'brightdata' | 'apify' | 'scrapedo' | 'scrapingbee' | 'serper';

export interface ScrapedItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
  platform: string;
  source: ProviderName;
}

const PROVIDER_TIMEOUT = 25_000;
const RANDOM_DELAY_RANGE = { min: 800, max: 3_000 };

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Brave/1.65.126 Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Vivaldi/6.5 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QQBrowser/13.1.8 Chrome/114.0.5735.289 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/606.4.5 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-N986U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Opera/94.0.0.0 Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) YaBrowser/23.9.2.766 Chrome/117.0.5938.149 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; CPH2457) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15'
];

const SUPPORTED_DOMAINS: Record<string, string[]> = {
  amazon: ['amazon.com', 'amzn.to'],
  walmart: ['walmart.com'],
  target: ['target.com'],
  bestbuy: ['bestbuy.com'],
  ebay: ['ebay.com'],
  shein: ['shein.com'],
  aliexpress: ['aliexpress.com']
};

interface ProviderDescriptor {
  name: ProviderName;
  handler: (query: string, limit: number) => Promise<ScrapedItem[]>;
}

const PROVIDERS: ProviderDescriptor[] = [
  { name: 'serper', handler: fetchWithSerper }
];

export const realProductSearch = {
  async searchProducts(query: string, limit: number = 21): Promise<ScrapedItem[]> {
    if (!query || !query.trim()) return [];

    for (let i = 0; i < PROVIDERS.length; i++) {
      const provider = PROVIDERS[i];
      if (i > 0) {
        await delay(randomInt(RANDOM_DELAY_RANGE.min, RANDOM_DELAY_RANGE.max));
      }

      try {
        console.log(`🔎 Attempting provider: ${provider.name} for "${query}"`);
        const results = await provider.handler(query, limit);
        if (results.length) {
          console.log(`✅ ${provider.name} provider succeeded for "${query}" with ${results.length} results`);
          return results.slice(0, limit);
        }
        console.warn(`⚠️ ${provider.name} provider returned no supported matches for "${query}"`);
      } catch (error: any) {
        console.error(`❌ ${provider.name} provider failed:`, error?.message || error);
      }
    }

    console.error(`❌ All providers failed for "${query}"`);
    return [];
  }
};

async function fetchWithBrightData(query: string, limit: number): Promise<ScrapedItem[]> {
  const credentials = process.env.BRIGHTDATA_KEY;
  if (!credentials) return [];

  try {
    const shoppingUrl = buildGoogleShoppingUrl(query);
    const headers = buildHeaders();
    const { username, password } = parseBrightDataCredentials(credentials);
    if (!username) {
      console.warn('⚠️ BRIGHTDATA_KEY missing username component, skipping Bright Data');
      return [];
    }

    const httpsAgent = new HttpsProxyAgent(`http://${username}:${password}@brd.superproxy.io:22225`);
    const response = await axios.get(shoppingUrl, {
      httpsAgent,
      headers,
      timeout: PROVIDER_TIMEOUT
    });

    return parseGoogleShoppingHtml(response.data, 'brightdata').slice(0, limit);
  } catch (error: any) {
    console.error('❌ Bright Data request failed:', error?.message || error);
    return [];
  }
}

async function fetchWithApify(query: string, limit: number): Promise<ScrapedItem[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return [];

  const actors = [
    'lukaskrivka~google-shopping-scraper',
    'apify~google-search-results-scraper'
  ];

  for (const actor of actors) {
    try {
      const datasetItems = await runApifyActor(actor, token, query, limit);
      const parsed = parseApifyResults(datasetItems, 'apify');
      if (parsed.length) {
        console.log(`ℹ️ Apify actor ${actor} succeeded for "${query}"`);
        return parsed.slice(0, limit);
      }
    } catch (error: any) {
      console.warn(`⚠️ Apify actor ${actor} failed:`, error?.message || error);
    }
    await delay(randomInt(200, 600));
  }

  console.warn('⚠️ All Apify actors returned empty results');
  return [];
}

async function runApifyActor(actor: string, token: string, query: string, limit: number) {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
  const payload = {
    search: query,
    maxItems: Math.max(limit * 2, 20),
    language: 'en',
    countryCode: 'US'
  };

  const response = await axios.post(url, payload, {
    timeout: PROVIDER_TIMEOUT,
    headers: { 'Content-Type': 'application/json' }
  });

  if (!Array.isArray(response.data)) {
    return [];
  }
  return response.data;
}

async function fetchWithScrapeDo(query: string, limit: number): Promise<ScrapedItem[]> {
  const apiKey = process.env.SCRAPEDO_KEY;
  if (!apiKey) return [];

  try {
    const shoppingUrl = buildGoogleShoppingUrl(query);
    const target = `https://api.scrape.do/?key=${apiKey}&url=${encodeURIComponent(shoppingUrl)}&render=true`;
    const response = await axios.get(target, {
      timeout: PROVIDER_TIMEOUT,
      headers: buildHeaders()
    });

    return parseGoogleShoppingHtml(response.data, 'scrapedo').slice(0, limit);
  } catch (error: any) {
    console.error('❌ ScrapeDo request failed:', error?.message || error);
    return [];
  }
}

async function fetchWithScrapingBee(query: string, limit: number): Promise<ScrapedItem[]> {
  const apiKey = process.env.SCRAPINGBEE_KEY;
  if (!apiKey) return [];

  try {
    const shoppingUrl = buildGoogleShoppingUrl(query);
    const target = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(shoppingUrl)}&render_js=false&country_code=us&wait=2000`;
    const response = await axios.get(target, {
      timeout: PROVIDER_TIMEOUT,
      headers: buildHeaders()
    });

    return parseGoogleShoppingHtml(response.data, 'scrapingbee').slice(0, limit);
  } catch (error: any) {
    console.error('❌ ScrapingBee request failed:', error?.message || error);
    return [];
  }
}

async function fetchWithSerper(query: string, limit: number): Promise<ScrapedItem[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const core = extractCoreQuery(query);
    const response = await axios.post(
      'https://google.serper.dev/shopping',
      { q: core, gl: 'us', hl: 'en' },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: PROVIDER_TIMEOUT
      }
    );

    const shopping = Array.isArray(response.data?.shopping) ? response.data.shopping : [];
    if (!shopping.length) {
      console.warn('⚠️ Serper returned no shopping results, falling back to organic search');
      const organicResp = await axios.post(
        'https://google.serper.dev/search',
        { q: core, gl: 'us', hl: 'en' },
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: PROVIDER_TIMEOUT
        }
      );
      const organic = Array.isArray(organicResp.data?.organic) ? organicResp.data.organic : [];
      return parseSerperItems(organic, 'serper').slice(0, limit);
    }

    return parseSerperItems(shopping, 'serper').slice(0, limit);
  } catch (error: any) {
    console.error('❌ Serper request failed:', error?.message || error);
    return [];
  }
}

function buildGoogleShoppingUrl(query: string): string {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

function buildHeaders() {
  return {
    'User-Agent': pickUserAgent(),
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
  };
}

function pickUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseBrightDataCredentials(credentials: string) {
  if (credentials.includes(':')) {
    const [username, password] = credentials.split(':');
    return { username, password };
  }
  return { username: credentials, password: '' };
}

function extractCoreQuery(q: string): string {
  const s = (q || '').toLowerCase();
  const tokens = s.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const brandList = ['apple', 'samsung', 'sony', 'xiaomi', 'oneplus', 'huawei', 'google', 'lenovo', 'dell', 'hp', 'asus', 'acer', 'msi', 'bose', 'jbl', 'beats'];
  const brand = tokens.find(t => brandList.includes(t));
  const keywords = tokens.filter(t => t.length > 2 && !['with', 'and', 'for', 'the', 'new', 'pro', 'max', 'gen', 'generation', 'edition'].includes(t));
  const core = [brand, ...keywords].filter(Boolean).slice(0, 4).join(' ');
  return core || q;
}

function parseGoogleShoppingHtml(html: string, source: ProviderName): ScrapedItem[] {
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: ScrapedItem[] = [];

  $('div.sh-dgr__content, div.sh-dgr__grid-result').each((index, el) => {
    const title =
      $(el).find('.tAxDx').text().trim() ||
      $(el).find('.Xjkr3b').text().trim() ||
      $(el).find('h3, h4').first().text().trim();

    const priceText =
      $(el).find('.a8Pemb').text().trim() ||
      $(el).find('.T14wmb').text().trim() ||
      $(el).find('[aria-label*="$"]').attr('aria-label') ||
      '';

    const price = parsePrice(priceText);
    const rawLink =
      $(el).find('a.shntl').attr('href') ||
      $(el).find('a').attr('href') ||
      '';
    const normalizedUrl = normalizeOutboundUrl(rawLink);
    if (!normalizedUrl || price <= 0) return;

    const platform = detectPlatform(normalizedUrl);
    if (!platform) return;

    const imageUrl =
      $(el).find('img').attr('src') ||
      $(el).find('img').attr('data-src') ||
      undefined;

    items.push({
      id: `${source}_${Date.now()}_${index}`,
      title: title || 'Unknown product',
      price,
      currency: 'USD',
      url: normalizedUrl,
      imageUrl,
      platform,
      source
    });
  });

  return items;
}

function parseApifyResults(data: any[], source: ProviderName): ScrapedItem[] {
  if (!Array.isArray(data)) return [];

  const items: ScrapedItem[] = [];
  data.forEach((item, index) => {
    const url = item.productUrl || item.url || item.link;
    const price = parsePrice(
      typeof item.price === 'string' ? item.price :
        typeof item.price === 'number' ? item.price.toString() :
          (item.currentPrice || item.minPrice || '')
    );
    const platform = detectPlatform(url);
    if (!url || !platform || price <= 0) return;

    items.push({
      id: `${source}_${Date.now()}_${index}`,
      title: item.title || item.productName || 'Unknown product',
      price,
      currency: 'USD',
      url,
      imageUrl: item.imageUrl || item.image || undefined,
      platform,
      source
    });
  });
  return items;
}

function parseSerperItems(data: any[], source: ProviderName): ScrapedItem[] {
  if (!Array.isArray(data)) return [];

  const items: ScrapedItem[] = [];
  data.forEach((item, index) => {
    const url = item.link || item.url;
    const platform = detectPlatform(url);
    if (!url || !platform) return;

    const price = parsePrice(item.price || item.extracted_price || item.priceText || '');
    if (price <= 0) return;

    items.push({
      id: `${source}_${Date.now()}_${index}`,
      title: item.title || item.name || 'Unknown product',
      price,
      currency: 'USD',
      url,
      imageUrl: item.image || item.thumbnail || undefined,
      platform,
      source
    });
  });
  return items;
}

function normalizeOutboundUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    if (rawUrl.startsWith('/url?')) {
      const parsed = new URL(`https://www.google.com${rawUrl}`);
      return parsed.searchParams.get('q');
    }
    if (rawUrl.startsWith('http')) {
      return rawUrl;
    }
    return `https://www.google.com${rawUrl}`;
  } catch {
    return null;
  }
}

function parsePrice(text: string | number): number {
  if (typeof text === 'number') return text;
  if (!text) return 0;
  const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '');
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

function detectPlatform(url?: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    for (const [platform, domains] of Object.entries(SUPPORTED_DOMAINS)) {
      if (domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
        return platform;
      }
    }
  } catch {
    return null;
  }
  return null;
}
// api/src/services/realProductSearch.ts