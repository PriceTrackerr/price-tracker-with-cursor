// Enhanced Buyhatke-like product matcher - 100% free, no paid APIs
// Uses only scraped DB products with extremely accurate matching

import * as stringSimilarity from 'string-similarity';
let natural: any; try { natural = require('natural'); } catch { natural = undefined; }

export type Currency = string;

export interface Product {
  id: string;
  title: string;
  price: number;
  platform: string;
  url: string;
  imageUrl?: string;
  currency?: Currency;
  stockStatus?: string;       // 'in_stock' | 'out_of_stock' | undefined
  discountInfo?: string;
}

export interface MatchResult {
  product: Product;
  score: number;              // 0..1 overall similarity score
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
  priceDifference: number;    // absolute (target - candidate)
  priceDifferencePercent: number; // percent vs target
  savings?: string;           // friendly text like "Save 22%"
}

export interface MatchResponse {
  algorithm: 'buyhatke-enhanced';
  targetProduct: Product;
  matches: MatchResult[];
  bestMatch: {
    id: string;
    platform: string;
    url: string;
    price: number;
    priceDifference: number;
    confidence: number; // 0..1 for the banner
  } | null;
}

// Configuration for matching algorithm
export interface MatchingConfig {
  minScore: number;           // Minimum similarity score (default: 0.7)
  maxResults: number;         // Maximum number of results (default: 5)
  priceTolerancePercent: number; // Price tolerance (default: 20)
  weights: {
    titleFuzzy: number;       // Title fuzzy match weight (40%)
    brandMatch: number;       // Exact brand match weight (30%)
    modelVariant: number;     // Model/variant match weight (20%)
    priceCloseness: number;   // Price closeness weight (10%)
    attributeSimilarity?: number; // New attribute similarity weight
    tfidfSimilarity?: number;     // New TF-IDF cosine weight
  };
}

// Default configuration
export const DEFAULT_CONFIG: MatchingConfig = {
  minScore: 0.5, // further loosened for maximum recall
  maxResults: 5,
  priceTolerancePercent: 30, // increased price tolerance
  weights: {
    titleFuzzy: 0.35,
    brandMatch: 0.35, // increased brand weight
    modelVariant: 0.15,
    priceCloseness: 0.05, // reduced price weight
    attributeSimilarity: 0.15,
    tfidfSimilarity: 0.1
  }
};

// Product categories for hierarchical matching
enum ProductCategory {
  Smartphone = 'smartphone',
  Laptop = 'laptop',
  Tablet = 'tablet',
  Television = 'television',
  Monitor = 'monitor',
  Headphone = 'headphone',
  Camera = 'camera',
  Console = 'console',
  Smartwatch = 'smartwatch',
  Other = 'other'
}

type Specs = {
  category?: ProductCategory;
  brand?: string;
  modelTokens: string[];   // e.g. ["bn0123", "mk2", "rtx", "4070"]
  sizeInches?: number;     // 13.3, 24, 55, etc.
  storageGB?: number;      // 128/256/512/1024
  ramGB?: number;          // 8/16/32
  hz?: number;             // 60/120/144
  watt?: number;           // 500/750 etc (PSU)
  color?: string;
  cpuGen?: string;         // "i5-1240P", "R7-5800H", "M2"
  gpu?: string;            // "RTX 4070", "RX 6800M"
};

// --- Enhanced Constants & Dictionaries for Buyhatke-like Matching -----------

// Comprehensive stopwords for product title normalization
const STOPWORDS = new Set([
  // Common words
  'with', 'and', 'for', 'the', 'a', 'an', 'of', 'to', 'by', 'from', 'in', 'on', 'at',
  // Product descriptors to remove
  'buy', 'new', 'latest', 'original', 'genuine', 'authentic', 'official', 'certified',
  'edition', 'series', 'model', 'version', 'gen', 'generation', 'release',
  // Measurements
  'inch', 'inches', 'cm', 'mm', 'ft', 'feet',
  // Packaging
  'pack', 'pc', 'pcs', 'piece', 'pieces', 'bundle', 'set', 'kit',
  // Connectivity
  'usb', 'wifi', 'bluetooth', 'wired', 'wireless', 'cord', 'cable',
  // Technology descriptors
  'smart', 'digital', 'electronic', 'tech', 'hd', 'fhd', 'uhd', '4k', '8k',
  'led', 'lcd', 'oled', 'amoled', 'ips', 'hdr', 'dolby',
  // Device types (removed during normalization)
  'tv', 'television', 'monitor', 'display', 'laptop', 'notebook', 'desktop', 'computer',
  'phone', 'smartphone', 'mobile', 'tablet', 'gaming', 'console',
  // Condition descriptors
  'refurbished', 'renewed', 'used', 'open', 'box', 'damaged', 'like'
]);

// Comprehensive brand mapping for accurate brand detection
const BRAND_ALIASES: Record<string, string> = {
  // Mobile & Tablets
  'apple': 'apple', 'iphone': 'apple', 'ipad': 'apple', 'macbook': 'apple', 'airpods': 'apple',
  'samsung': 'samsung', 'galaxy': 'samsung',
  'google': 'google', 'pixel': 'google', 'nexus': 'google',
  'oneplus': 'oneplus', '1+': 'oneplus',
  'xiaomi': 'xiaomi', 'mi': 'xiaomi', 'redmi': 'xiaomi', 'poco': 'xiaomi', 'blackshark': 'xiaomi',
  'huawei': 'huawei', 'honor': 'huawei', 'mate': 'huawei',
  'oppo': 'oppo', 'realme': 'oppo', 'reno': 'oppo',
  'vivo': 'vivo', 'iqoo': 'vivo',
  'motorola': 'motorola', 'moto': 'motorola',
  'nokia': 'nokia', 'hmd': 'nokia',
  'nothing': 'nothing',
  'fairphone': 'fairphone',
  
  // Laptops & PCs
  'lenovo': 'lenovo', 'thinkpad': 'lenovo', 'ideapad': 'lenovo', 'legion': 'lenovo',
  'hp': 'hp', 'hewlett packard': 'hp', 'pavilion': 'hp', 'omen': 'hp', 'envy': 'hp', 'elitebook': 'hp',
  'dell': 'dell', 'alienware': 'dell', 'latitude': 'dell', 'precision': 'dell', 'inspiron': 'dell', 'xps': 'dell',
  'asus': 'asus', 'rog': 'asus', 'zenbook': 'asus', 'vivobook': 'asus', 'tuf': 'asus',
  'acer': 'acer', 'predator': 'acer', 'nitro': 'acer', 'aspire': 'acer', 'swift': 'acer',
  'msi': 'msi', 'steelseries': 'msi',
  'razer': 'razer',
  'microsoft': 'microsoft', 'surface': 'microsoft',
  'framework': 'framework',
  
  // TVs & Monitors
  'lg': 'lg',
  'sony': 'sony', 'bravia': 'sony',
  'tcl': 'tcl',
  'hisense': 'hisense',
  'philips': 'philips',
  'benq': 'benq',
  'viewsonic': 'viewsonic',
  'aoc': 'aoc',
  
  // Audio
  'bose': 'bose',
  'jbl': 'jbl',
  'sennheiser': 'sennheiser',
  'audio technica': 'audio-technica', 'audio-technica': 'audio-technica',
  'beats': 'apple',
  'jabra': 'jabra',
  'wh': 'sony', 'wf': 'sony',
  'skullcandy': 'skullcandy',
  'plantronics': 'plantronics', 'poly': 'plantronics',
  
  // Gaming
  'nintendo': 'nintendo', 'switch': 'nintendo',
  'playstation': 'sony', 'ps4': 'sony', 'ps5': 'sony',
  'xbox': 'microsoft',
  'steam': 'valve', 'valve': 'valve', 'steamdeck': 'valve',
  
  // Others
  'amazon': 'amazon', 'kindle': 'amazon', 'echo': 'amazon', 'alexa': 'amazon',
  'roku': 'roku',
  'nvidia': 'nvidia', 'rtx': 'nvidia', 'gtx': 'nvidia',
  'amd': 'amd', 'radeon': 'amd', 'ryzen': 'amd',
  'intel': 'intel', 'core': 'intel'
};

// Unit conversion dictionary
const UNIT_CONVERSIONS: Record<string, number> = {
  'tb': 1024,    // 1TB = 1024GB
  'kb': 1/1024,  // 1KB = 1/1024 MB
  'mb': 1/1024,  // 1MB = 1/1024 GB
};

const COLOR_WORDS = new Set([
  'black','white','silver','blue','red','green','gold','gray','grey','pink',
  'purple','space gray','midnight','starlight','graphite','sierra blue',
  'pacific blue','alpine green','deep purple','product red'
]);

// Category detection patterns
const CATEGORY_PATTERNS: Record<ProductCategory, RegExp[]> = {
  [ProductCategory.Smartphone]: [
    /\b(phone|smartphone|mobile|iphone)\b/i,
    /\b(galaxy s|pixel \d|iphone \d|oneplus \d)\b/i
  ],
  [ProductCategory.Laptop]: [
    /\b(laptop|notebook|macbook|thinkpad|ideapad)\b/i,
    /\b(\d{2}"|ultrabook|gaming laptop)\b/i
  ],
  [ProductCategory.Tablet]: [
    /\b(tablet|ipad|galaxy tab|surface pro)\b/i
  ],
  [ProductCategory.Television]: [
    /\b(tv|television|smart tv|qled|oled)\b/i,
    /\b(\d{2}"|inch tv|led tv)\b/i
  ],
  [ProductCategory.Monitor]: [
    /\b(monitor|display|gaming monitor|curved|ultrawide)\b/i
  ],
  [ProductCategory.Headphone]: [
    /\b(headphone|headset|earphone|earbud|airpod|tws)\b/i
  ],
  [ProductCategory.Camera]: [
    /\b(camera|dslr|mirrorless|webcam)\b/i
  ],
  [ProductCategory.Console]: [
    /\b(ps5|ps4|xbox|nintendo|switch|console)\b/i
  ],
  [ProductCategory.Smartwatch]: [
    /\b(smartwatch|watch|apple watch|galaxy watch)\b/i
  ],
  [ProductCategory.Other]: [/./] // Matches anything
};

// --- Enhanced Preprocessing Functions for Buyhatke-like Accuracy -----------

function safeLower(s: string): string { 
  return (s || '').toLowerCase().trim(); 
}

// Step 1: Comprehensive title normalization like Buyhatke
function normalizeTitle(raw: string): string {
  let s = safeLower(raw);
  
  // Remove common e-commerce noise
  s = s.replace(/\b(best|deal|offer|sale|discount|free|shipping|return)\b/gi, ' ');
  
  // Remove trademark symbols, quotes, and special chars
  s = s.replace(/[™®©"'`´]/g, ' ');
  
  // Remove brackets and their content (often contains irrelevant info)
  s = s.replace(/[\(\)\[\]\{\}][^)]*[\)\]\}]?/g, ' ');
  
  // Normalize common variations
  s = s.replace(/\b(smartphone|cellphone|mobilephone)\b/g, 'phone');
  s = s.replace(/\b(notebook|netbook)\b/g, 'laptop');
  s = s.replace(/\b(television|tv)\b/g, 'tv');
  
  // Normalize measurements and units
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(inch|inches|in|")\b/gi, '$1inch');
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(cm|centimeter|centimeters)\b/gi, '$1cm');
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(mm|millimeter|millimeters)\b/gi, '$1mm');
  
  // Storage normalization with proper conversions
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(tb|terabyte|terabytes)\b/gi, (_, num) => `${Math.round(Number(num) * 1024)}gb`);
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(mb|megabyte|megabytes)\b/gi, (_, num) => `${Math.round(Number(num) / 1024)}gb`);
  s = s.replace(/\b(\d+(?:\.\d+)?)\s?(gb|gigabyte|gigabytes)\b/gi, '$1gb');
  
  // RAM normalization
  s = s.replace(/\b(\d+)\s?(gb|mb)\s?(ram|memory|ddr\d?)\b/gi, '$1$2ram');
  
  // Remove special characters but keep alphanumeric, spaces, and important punctuation
  s = s.replace(/[^a-z0-9\s\-\+\.]/g, ' ');
  
  // Consolidate multiple spaces
  s = s.replace(/\s+/g, ' ').trim();
  
  return s;
}

// Step 2: Smart tokenization that preserves important compound terms
function tokenize(s: string): string[] {
  const tokens = s.split(/\s+/)
    .filter(t => t.length > 0)
    .filter(t => !STOPWORDS.has(t))
    .filter(t => t !== '-' && t !== '+' && t !== '.');
  
  return tokens;
}

// Extract structured product information
interface ProductInfo {
  brand?: string;
  modelNumber?: string;
  storage?: string;       // "128gb", "256gb", etc.
  color?: string;
  size?: string;          // "13inch", "55inch", etc.
  category?: string;
  modelTokens: string[];  // Important identifying tokens
}

// --- Legacy utility functions (kept for potential future use) ---------------
// Note: These functions are currently unused but may be valuable for future enhancements

// Step 3: Enhanced structured field extraction like Buyhatke
function extractProductInfo(normalizedTitle: string): ProductInfo {
  const tokens = tokenize(normalizedTitle);
  const info: ProductInfo = {
    modelTokens: []
  };

  // Brand extraction - more sophisticated approach
  info.brand = extractBrand(normalizedTitle, tokens);
  
  // Model number extraction (alphanumeric codes that look like models)
  const modelPattern = /\b([a-z]*\d+[a-z0-9]*(?:[-\+][a-z0-9]*)*)\b/gi;
  const modelMatches = normalizedTitle.match(modelPattern);
  if (modelMatches) {
    info.modelTokens = modelMatches
      .filter(m => m.length >= 2 && /\d/.test(m))
      .filter(m => !m.match(/^\d+(gb|mb|inch|cm|mm|hz|w)$/)) // Exclude pure specs
      .slice(0, 5); // Limit to avoid noise
  }

  // Storage extraction
  const storageMatch = normalizedTitle.match(/\b(\d+)gb\b/);
  if (storageMatch) {
    info.storage = storageMatch[0];
  }

  // Size extraction (screen/display size)
  const sizeMatch = normalizedTitle.match(/\b(\d+(?:\.\d+)?)inch\b/);
  if (sizeMatch) {
    info.size = sizeMatch[0];
  }

  // Color extraction
  for (const color of COLOR_WORDS) {
    if (normalizedTitle.includes(color)) {
      info.color = color;
      break;
    }
  }

  // Enhanced category detection (more comprehensive)
  const title = normalizedTitle.toLowerCase();
  
  if (title.includes('phone') || title.includes('iphone') || title.includes('samsung') || title.includes('galaxy') || title.includes('pixel')) {
    info.category = 'phone';
  } else if (title.includes('laptop') || title.includes('macbook') || title.includes('notebook') || title.includes('computer')) {
    info.category = 'laptop';
  } else if (title.includes('tv') || title.includes('television') || title.includes('monitor') || title.includes('display')) {
    info.category = 'tv';
  } else if (title.includes('headphone') || title.includes('earphone') || title.includes('airpods') || title.includes('speaker') || title.includes('audio')) {
    info.category = 'audio';
  } else if (title.includes('watch') || title.includes('smartwatch') || title.includes('fitness')) {
    info.category = 'watch';
  } else if (title.includes('tablet') || title.includes('ipad')) {
    info.category = 'tablet';
  } else if (title.includes('camera') || title.includes('lens') || title.includes('photo')) {
    info.category = 'camera';
  } else if (title.includes('game') || title.includes('gaming') || title.includes('console')) {
    info.category = 'gaming';
  } else if (title.includes('clothing') || title.includes('shirt') || title.includes('dress') || title.includes('jacket')) {
    info.category = 'clothing';
  } else if (title.includes('shoe') || title.includes('sneaker') || title.includes('boot')) {
    info.category = 'shoes';
  }

  return info;
}

// Enhanced brand extraction
function extractBrand(normalizedTitle: string, tokens: string[]): string | undefined {
  // Try exact brand matches first (longest matches first)
  const sortedBrands = Object.keys(BRAND_ALIASES).sort((a, b) => b.length - a.length);
  for (const brandKey of sortedBrands) {
    if (normalizedTitle.includes(brandKey)) {
      return BRAND_ALIASES[brandKey];
    }
  }

  // Try first token if it looks like a brand
  if (tokens.length > 0) {
    const first = tokens[0];
    if (BRAND_ALIASES[first]) {
      return BRAND_ALIASES[first];
    }
    // Check if first token could be a brand (not a number, reasonable length)
    if (first.length >= 2 && first.length <= 15 && isNaN(Number(first))) {
      return first;
    }
  }

  return undefined;
}

// --- Utility functions for enhanced matching ---------------------------

// --- Main Buyhatke-like Matching Algorithm -----------------------------------

// Step 1: Fuzzy string matching using string-similarity library
function calculateFuzzyScore(title1: string, title2: string): number {
  // Use Dice coefficient from string-similarity (very effective for product titles)
  return stringSimilarity.compareTwoStrings(title1, title2);
}

// Step 2: Fuzzy brand matching for better recall
function calculateBrandScore(info1: ProductInfo, info2: ProductInfo): number {
  if (!info1.brand || !info2.brand) return 0;
  
  // Exact match gets full score
  if (info1.brand === info2.brand) return 1;
  
  // Fuzzy match for similar brands (e.g., "Samsung" vs "Samsung Electronics")
  const brandSimilarity = stringSimilarity.compareTwoStrings(
    info1.brand.toLowerCase(), 
    info2.brand.toLowerCase()
  );
  
  // Return similarity score if above threshold, otherwise 0
  return brandSimilarity >= 0.7 ? brandSimilarity : 0;
}

// Step 3: Model/variant matching using regex for numbers and identifiers
function calculateModelScore(info1: ProductInfo, info2: ProductInfo): number {
  if (!info1.modelTokens.length || !info2.modelTokens.length) return 0;
  
  const set1 = new Set(info1.modelTokens);
  const set2 = new Set(info2.modelTokens);
  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.length / union.size : 0;
}

// Step 4: Price closeness (within tolerance)
function calculatePriceScore(price1: number, price2: number, tolerancePercent: number = 20): number {
  if (price1 <= 0 || price2 <= 0) return 0;
  
  const priceDiff = Math.abs(price1 - price2);
  const avgPrice = (price1 + price2) / 2;
  const diffPercent = (priceDiff / avgPrice) * 100;
  
  if (diffPercent <= tolerancePercent) {
    return 1 - (diffPercent / tolerancePercent);
  }
  return 0;
}

// Step 5: Placeholder for semantic similarity (future integration)
function calculateSemanticScore(title1: string, title2: string): number {
  // Placeholder for future semantic similarity using local embedding models
  // like sentence-transformers or similar lightweight models
  // For now, return 0 (not implemented)
  
  // TODO: Integrate local embedding model here
  // Example: const embeddings = await getEmbeddings([title1, title2]);
  // return cosineSimilarity(embeddings[0], embeddings[1]);
  
  return 0; // Not implemented yet, easy to add later
}

function calculateTfidfSimilarity(title1: string, title2: string): number {
  if (!natural) return 0;
  try {
    const TfIdf = natural.TfIdf; const tfidf = new TfIdf();
    tfidf.addDocument(title1); tfidf.addDocument(title2);
    const terms1: Record<string, number> = {}; const terms2: Record<string, number> = {};
    tfidf.listTerms(0).forEach((t: any) => { terms1[t.term] = t.tfidf; });
    tfidf.listTerms(1).forEach((t: any) => { terms2[t.term] = t.tfidf; });
    const keys = new Set([...Object.keys(terms1), ...Object.keys(terms2)]);
    let dot = 0, n1 = 0, n2 = 0;
    keys.forEach(k => { const a = terms1[k] || 0, b = terms2[k] || 0; dot += a*b; n1 += a*a; n2 += b*b; });
    if (n1 === 0 || n2 === 0) return 0; return Math.max(0, Math.min(1, dot / (Math.sqrt(n1)*Math.sqrt(n2))));
  } catch { return 0; }
}

function calculateAttributeSimilarity(info1: any, info2: any): number {
  let score = 0, total = 0;
  if (info1.color || info2.color) { total++; if (info1.color && info2.color && info1.color === info2.color) score++; }
  if (info1.storage || info2.storage) { total++; if (info1.storage && info2.storage && info1.storage === info2.storage) score++; }
  if (info1.size || info2.size) { total++; if (info1.size && info2.size && info1.size === info2.size) score++; }
  return total === 0 ? 0 : score / total;
}

// Enhanced similarity scoring with configurable weights
function calculateOverallScore(
  fuzzyScore: number,
  brandScore: number,
  modelScore: number,
  priceScore: number,
  semanticScore: number,
  attributeScore: number,
  tfidfScore: number,
  config: MatchingConfig
): number {
  const { weights } = config;
  
  // Weighted combination
  let totalScore = (
    fuzzyScore * weights.titleFuzzy +
    brandScore * weights.brandMatch +
    modelScore * weights.modelVariant +
    priceScore * weights.priceCloseness +
    (weights.attributeSimilarity ?? 0.15) * attributeScore +
    (weights.tfidfSimilarity ?? 0.1) * tfidfScore
  );

  // Temporary brand boost for better recall
  if (brandScore > 0) totalScore += 0.2;
  
  // Add semantic score when available (future enhancement)
  if (semanticScore > 0) {
    // Adjust weights to include semantic similarity
    const semanticWeight = 0.1; // 10% for semantic when available
    totalScore = totalScore * 0.9 + semanticScore * semanticWeight;
  }
  
  return Math.min(1, Math.max(0, totalScore));
}

// Main matching function with Buyhatke-like accuracy
export function matchProducts(
  source: Product,
  candidates: Product[],
  config: MatchingConfig = DEFAULT_CONFIG
): MatchResult[] {
  // Avoid matching with itself
  const filteredCandidates = candidates.filter(c => c.id !== source.id);
  console.log('Candidates after filter:', filteredCandidates.length);
  
  // Step 1: Preprocess source product
  const sourceNormalized = normalizeTitle(source.title);
  const sourceInfo = extractProductInfo(sourceNormalized);
  
  const results: MatchResult[] = [];
  
  for (const candidate of filteredCandidates) {
    // Step 1: Preprocess candidate product
    const candidateNormalized = normalizeTitle(candidate.title);
    const candidateInfo = extractProductInfo(candidateNormalized);
    
    // Fuzzy category matching - allow similar categories to pass through
    if (sourceInfo.category && candidateInfo.category) {
      const categorySimilarity = stringSimilarity.compareTwoStrings(
        sourceInfo.category.toLowerCase(), 
        candidateInfo.category.toLowerCase()
      );
      // Only skip if categories are completely different (similarity < 0.3)
      if (categorySimilarity < 0.3) {
        continue;
      }
    }
    
    // Step 1: Fuzzy string matching
    const fuzzyScore = calculateFuzzyScore(sourceNormalized, candidateNormalized);
    
    // Step 2: Exact brand match
    const brandScore = calculateBrandScore(sourceInfo, candidateInfo);
    
    // Step 3: Model/variant check
    const modelScore = calculateModelScore(sourceInfo, candidateInfo);
    
    // Step 4: Price closeness
    const priceScore = calculatePriceScore(source.price, candidate.price, config.priceTolerancePercent);
    
    // Step 5: Semantic similarity (placeholder)
    const semanticScore = calculateSemanticScore(sourceNormalized, candidateNormalized);
    const attributeScore = calculateAttributeSimilarity(sourceInfo, candidateInfo);
    const tfidfScore = calculateTfidfSimilarity(sourceNormalized, candidateNormalized);
    
    // Calculate overall similarity score
    const overallScore = calculateOverallScore(
      fuzzyScore, brandScore, modelScore, priceScore, semanticScore, attributeScore, tfidfScore, config
    );
    
    // Apply threshold filter
    if (overallScore >= config.minScore) {
      // Calculate price difference
      const priceDiff = source.price - candidate.price;
      const priceDiffPercent = source.price > 0 ? Math.abs(priceDiff / source.price) * 100 : 0;
      
      // Generate match reason
      const reasons: string[] = [];
      if (brandScore > 0) reasons.push(`Brand: ${sourceInfo.brand}`);
      if (modelScore > 0.3) reasons.push(`Model match: ${modelScore.toFixed(2)}`);
      if (fuzzyScore > 0.7) reasons.push(`Title similarity: ${(fuzzyScore * 100).toFixed(0)}%`);
      if (priceScore > 0.5) reasons.push(`Price within ${config.priceTolerancePercent}%`);
      
      const matchReason = reasons.length > 0 ? reasons.join(' • ') : 'General similarity';
      
      results.push({
        product: candidate,
        score: overallScore,
        confidence: overallScore >= 0.85 ? 'high' : overallScore >= 0.75 ? 'medium' : 'low',
        matchReason,
        priceDifference: Math.abs(priceDiff),
        priceDifferencePercent: priceDiffPercent,
        savings: priceDiff > 0 ? `Save ${Math.round(priceDiffPercent)}%` : 
                 priceDiff < 0 ? `${Math.round(priceDiffPercent)}% more expensive` : 'Same price'
      });
    }
  }
  
  // Sort by score (highest first) and limit results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, config.maxResults);
}

// Enhanced API function that returns structured response like Buyhatke
export function findProductMatches(
  source: Product,
  candidates: Product[],
  config: MatchingConfig = DEFAULT_CONFIG
): MatchResponse {
  const matches = matchProducts(source, candidates, config);
  
  const bestMatch = matches.length > 0 ? {
    id: matches[0].product.id,
    platform: matches[0].product.platform,
    url: matches[0].product.url,
    price: matches[0].product.price,
    priceDifference: matches[0].priceDifference,
    confidence: matches[0].score
  } : null;
  
  return {
    algorithm: 'buyhatke-enhanced',
    targetProduct: source,
    matches,
    bestMatch
  };
}