"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.matchProducts = matchProducts;
exports.findProductMatches = findProductMatches;
const stringSimilarity = __importStar(require("string-similarity"));
exports.DEFAULT_CONFIG = {
    minScore: 0.7,
    maxResults: 5,
    priceTolerancePercent: 20,
    weights: {
        titleFuzzy: 0.4,
        brandMatch: 0.3,
        modelVariant: 0.2,
        priceCloseness: 0.1
    }
};
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["Smartphone"] = "smartphone";
    ProductCategory["Laptop"] = "laptop";
    ProductCategory["Tablet"] = "tablet";
    ProductCategory["Television"] = "television";
    ProductCategory["Monitor"] = "monitor";
    ProductCategory["Headphone"] = "headphone";
    ProductCategory["Camera"] = "camera";
    ProductCategory["Console"] = "console";
    ProductCategory["Smartwatch"] = "smartwatch";
    ProductCategory["Other"] = "other";
})(ProductCategory || (ProductCategory = {}));
const STOPWORDS = new Set([
    'with', 'and', 'for', 'the', 'a', 'an', 'of', 'to', 'by', 'from', 'in', 'on', 'at',
    'buy', 'new', 'latest', 'original', 'genuine', 'authentic', 'official', 'certified',
    'edition', 'series', 'model', 'version', 'gen', 'generation', 'release',
    'inch', 'inches', 'cm', 'mm', 'ft', 'feet',
    'pack', 'pc', 'pcs', 'piece', 'pieces', 'bundle', 'set', 'kit',
    'usb', 'wifi', 'bluetooth', 'wired', 'wireless', 'cord', 'cable',
    'smart', 'digital', 'electronic', 'tech', 'hd', 'fhd', 'uhd', '4k', '8k',
    'led', 'lcd', 'oled', 'amoled', 'ips', 'hdr', 'dolby',
    'tv', 'television', 'monitor', 'display', 'laptop', 'notebook', 'desktop', 'computer',
    'phone', 'smartphone', 'mobile', 'tablet', 'gaming', 'console',
    'refurbished', 'renewed', 'used', 'open', 'box', 'damaged', 'like'
]);
const BRAND_ALIASES = {
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
    'lenovo': 'lenovo', 'thinkpad': 'lenovo', 'ideapad': 'lenovo', 'legion': 'lenovo',
    'hp': 'hp', 'hewlett packard': 'hp', 'pavilion': 'hp', 'omen': 'hp', 'envy': 'hp', 'elitebook': 'hp',
    'dell': 'dell', 'alienware': 'dell', 'latitude': 'dell', 'precision': 'dell', 'inspiron': 'dell', 'xps': 'dell',
    'asus': 'asus', 'rog': 'asus', 'zenbook': 'asus', 'vivobook': 'asus', 'tuf': 'asus',
    'acer': 'acer', 'predator': 'acer', 'nitro': 'acer', 'aspire': 'acer', 'swift': 'acer',
    'msi': 'msi', 'steelseries': 'msi',
    'razer': 'razer',
    'microsoft': 'microsoft', 'surface': 'microsoft',
    'framework': 'framework',
    'lg': 'lg',
    'sony': 'sony', 'bravia': 'sony',
    'tcl': 'tcl',
    'hisense': 'hisense',
    'philips': 'philips',
    'benq': 'benq',
    'viewsonic': 'viewsonic',
    'aoc': 'aoc',
    'bose': 'bose',
    'jbl': 'jbl',
    'sennheiser': 'sennheiser',
    'audio technica': 'audio-technica', 'audio-technica': 'audio-technica',
    'beats': 'apple',
    'jabra': 'jabra',
    'wh': 'sony', 'wf': 'sony',
    'skullcandy': 'skullcandy',
    'plantronics': 'plantronics', 'poly': 'plantronics',
    'nintendo': 'nintendo', 'switch': 'nintendo',
    'playstation': 'sony', 'ps4': 'sony', 'ps5': 'sony',
    'xbox': 'microsoft',
    'steam': 'valve', 'valve': 'valve', 'steamdeck': 'valve',
    'amazon': 'amazon', 'kindle': 'amazon', 'echo': 'amazon', 'alexa': 'amazon',
    'roku': 'roku',
    'nvidia': 'nvidia', 'rtx': 'nvidia', 'gtx': 'nvidia',
    'amd': 'amd', 'radeon': 'amd', 'ryzen': 'amd',
    'intel': 'intel', 'core': 'intel'
};
const UNIT_CONVERSIONS = {
    'tb': 1024,
    'kb': 1 / 1024,
    'mb': 1 / 1024,
};
const COLOR_WORDS = new Set([
    'black', 'white', 'silver', 'blue', 'red', 'green', 'gold', 'gray', 'grey', 'pink',
    'purple', 'space gray', 'midnight', 'starlight', 'graphite', 'sierra blue',
    'pacific blue', 'alpine green', 'deep purple', 'product red'
]);
const CATEGORY_PATTERNS = {
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
    [ProductCategory.Other]: [/./]
};
function safeLower(s) {
    return (s || '').toLowerCase().trim();
}
function normalizeTitle(raw) {
    let s = safeLower(raw);
    s = s.replace(/\b(best|deal|offer|sale|discount|free|shipping|return)\b/gi, ' ');
    s = s.replace(/[™®©"'`´]/g, ' ');
    s = s.replace(/[\(\)\[\]\{\}][^)]*[\)\]\}]?/g, ' ');
    s = s.replace(/\b(smartphone|cellphone|mobilephone)\b/g, 'phone');
    s = s.replace(/\b(notebook|netbook)\b/g, 'laptop');
    s = s.replace(/\b(television|tv)\b/g, 'tv');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(inch|inches|in|")\b/gi, '$1inch');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(cm|centimeter|centimeters)\b/gi, '$1cm');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(mm|millimeter|millimeters)\b/gi, '$1mm');
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(tb|terabyte|terabytes)\b/gi, (_, num) => `${Math.round(Number(num) * 1024)}gb`);
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(mb|megabyte|megabytes)\b/gi, (_, num) => `${Math.round(Number(num) / 1024)}gb`);
    s = s.replace(/\b(\d+(?:\.\d+)?)\s?(gb|gigabyte|gigabytes)\b/gi, '$1gb');
    s = s.replace(/\b(\d+)\s?(gb|mb)\s?(ram|memory|ddr\d?)\b/gi, '$1$2ram');
    s = s.replace(/[^a-z0-9\s\-\+\.]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}
function tokenize(s) {
    const tokens = s.split(/\s+/)
        .filter(t => t.length > 0)
        .filter(t => !STOPWORDS.has(t))
        .filter(t => t !== '-' && t !== '+' && t !== '.');
    return tokens;
}
function extractProductInfo(normalizedTitle) {
    const tokens = tokenize(normalizedTitle);
    const info = {
        modelTokens: []
    };
    info.brand = extractBrand(normalizedTitle, tokens);
    const modelPattern = /\b([a-z]*\d+[a-z0-9]*(?:[-\+][a-z0-9]*)*)\b/gi;
    const modelMatches = normalizedTitle.match(modelPattern);
    if (modelMatches) {
        info.modelTokens = modelMatches
            .filter(m => m.length >= 2 && /\d/.test(m))
            .filter(m => !m.match(/^\d+(gb|mb|inch|cm|mm|hz|w)$/))
            .slice(0, 5);
    }
    const storageMatch = normalizedTitle.match(/\b(\d+)gb\b/);
    if (storageMatch) {
        info.storage = storageMatch[0];
    }
    const sizeMatch = normalizedTitle.match(/\b(\d+(?:\.\d+)?)inch\b/);
    if (sizeMatch) {
        info.size = sizeMatch[0];
    }
    for (const color of COLOR_WORDS) {
        if (normalizedTitle.includes(color)) {
            info.color = color;
            break;
        }
    }
    if (normalizedTitle.includes('phone') || normalizedTitle.includes('iphone')) {
        info.category = 'phone';
    }
    else if (normalizedTitle.includes('laptop') || normalizedTitle.includes('macbook')) {
        info.category = 'laptop';
    }
    else if (normalizedTitle.includes('tv') || normalizedTitle.includes('television')) {
        info.category = 'tv';
    }
    else if (normalizedTitle.includes('headphone') || normalizedTitle.includes('earphone') || normalizedTitle.includes('airpods')) {
        info.category = 'audio';
    }
    return info;
}
function extractBrand(normalizedTitle, tokens) {
    const sortedBrands = Object.keys(BRAND_ALIASES).sort((a, b) => b.length - a.length);
    for (const brandKey of sortedBrands) {
        if (normalizedTitle.includes(brandKey)) {
            return BRAND_ALIASES[brandKey];
        }
    }
    if (tokens.length > 0) {
        const first = tokens[0];
        if (BRAND_ALIASES[first]) {
            return BRAND_ALIASES[first];
        }
        if (first.length >= 2 && first.length <= 15 && isNaN(Number(first))) {
            return first;
        }
    }
    return undefined;
}
function calculateFuzzyScore(title1, title2) {
    return stringSimilarity.compareTwoStrings(title1, title2);
}
function calculateBrandScore(info1, info2) {
    if (!info1.brand || !info2.brand)
        return 0;
    return info1.brand === info2.brand ? 1 : 0;
}
function calculateModelScore(info1, info2) {
    if (!info1.modelTokens.length || !info2.modelTokens.length)
        return 0;
    const set1 = new Set(info1.modelTokens);
    const set2 = new Set(info2.modelTokens);
    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.length / union.size : 0;
}
function calculatePriceScore(price1, price2, tolerancePercent = 20) {
    if (price1 <= 0 || price2 <= 0)
        return 0;
    const priceDiff = Math.abs(price1 - price2);
    const avgPrice = (price1 + price2) / 2;
    const diffPercent = (priceDiff / avgPrice) * 100;
    if (diffPercent <= tolerancePercent) {
        return 1 - (diffPercent / tolerancePercent);
    }
    return 0;
}
function calculateSemanticScore(title1, title2) {
    return 0;
}
function calculateOverallScore(fuzzyScore, brandScore, modelScore, priceScore, semanticScore, config) {
    const { weights } = config;
    let totalScore = (fuzzyScore * weights.titleFuzzy +
        brandScore * weights.brandMatch +
        modelScore * weights.modelVariant +
        priceScore * weights.priceCloseness);
    if (semanticScore > 0) {
        const semanticWeight = 0.1;
        totalScore = totalScore * 0.9 + semanticScore * semanticWeight;
    }
    return Math.min(1, Math.max(0, totalScore));
}
function matchProducts(source, candidates, config = exports.DEFAULT_CONFIG) {
    const filteredCandidates = candidates.filter(c => c.id !== source.id);
    const sourceNormalized = normalizeTitle(source.title);
    const sourceInfo = extractProductInfo(sourceNormalized);
    const results = [];
    for (const candidate of filteredCandidates) {
        const candidateNormalized = normalizeTitle(candidate.title);
        const candidateInfo = extractProductInfo(candidateNormalized);
        if (sourceInfo.category && candidateInfo.category &&
            sourceInfo.category !== candidateInfo.category) {
            continue;
        }
        const fuzzyScore = calculateFuzzyScore(sourceNormalized, candidateNormalized);
        const brandScore = calculateBrandScore(sourceInfo, candidateInfo);
        const modelScore = calculateModelScore(sourceInfo, candidateInfo);
        const priceScore = calculatePriceScore(source.price, candidate.price, config.priceTolerancePercent);
        const semanticScore = calculateSemanticScore(sourceNormalized, candidateNormalized);
        const overallScore = calculateOverallScore(fuzzyScore, brandScore, modelScore, priceScore, semanticScore, config);
        if (overallScore >= config.minScore) {
            const priceDiff = source.price - candidate.price;
            const priceDiffPercent = source.price > 0 ? Math.abs(priceDiff / source.price) * 100 : 0;
            const reasons = [];
            if (brandScore > 0)
                reasons.push(`Brand: ${sourceInfo.brand}`);
            if (modelScore > 0.3)
                reasons.push(`Model match: ${modelScore.toFixed(2)}`);
            if (fuzzyScore > 0.7)
                reasons.push(`Title similarity: ${(fuzzyScore * 100).toFixed(0)}%`);
            if (priceScore > 0.5)
                reasons.push(`Price within ${config.priceTolerancePercent}%`);
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
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, config.maxResults);
}
function findProductMatches(source, candidates, config = exports.DEFAULT_CONFIG) {
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
//# sourceMappingURL=productMatchingService.js.map