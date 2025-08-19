"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const storage_1 = __importDefault(require("../config/storage"));
const auth_1 = require("../middleware/auth");
const string_similarity_1 = __importDefault(require("string-similarity"));
const router = express_1.default.Router();
const validateProduct = [
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Product title is required'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    (0, express_validator_1.body)('platform').isIn(['amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target']).withMessage('Valid platform is required')
];
function addAffiliateTag(url, platform) {
    try {
        const u = new URL(url);
        if (platform === 'amazon') {
            u.searchParams.set('tag', 'pricetrack0f8-20');
            return u.toString();
        }
        else if (platform === 'aliexpress') {
            u.searchParams.set('aff_platform', 'link-c-tool');
            u.searchParams.set('aff_short_key', 'pricetrack0f8-20');
            return u.toString();
        }
        else if (platform === 'bestbuy') {
            u.searchParams.set('campid', 'your-bestbuy-campaign-id');
            return u.toString();
        }
        else if (platform === 'target') {
            u.searchParams.set('affiliate', 'your-target-affiliate-id');
            return u.toString();
        }
        return url;
    }
    catch {
        return url;
    }
}
router.get('/search', auth_1.authMiddleware, async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        const userId = req.user.uid;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        const allProducts = await storage_1.default.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        const query = q.toLowerCase().trim();
        const startsWithMatches = userProducts.filter((product) => product.title.toLowerCase().startsWith(query) ||
            product.platform.toLowerCase().startsWith(query));
        const containsMatches = userProducts.filter((product) => product.title.toLowerCase().includes(query) ||
            product.platform.toLowerCase().includes(query));
        const allMatches = [...startsWithMatches, ...containsMatches];
        const uniqueMatches = allMatches.filter((product, index, self) => index === self.findIndex(p => p.id === product.id));
        const limitedMatches = uniqueMatches.slice(0, parseInt(limit));
        return res.json({
            success: true,
            data: {
                query,
                results: limitedMatches,
                total: limitedMatches.length,
                hasMore: uniqueMatches.length > limitedMatches.length
            }
        });
    }
    catch (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
function extractProductIdentifiers(title) {
    const normalizedTitle = title.toLowerCase();
    const identifiers = {
        brand: '',
        model: '',
        color: '',
        size: '',
        keywords: [],
        features: [],
        sku: '',
        condition: undefined,
        isBundle: undefined,
        accessories: []
    };
    const brands = [
        'asus', 'dell', 'hp', 'acer', 'msi', 'razer', 'lenovo', 'alienware', 'origin', 'clevo',
        'apple', 'samsung', 'xiaomi', 'huawei', 'sony', 'microsoft', 'google', 'surface',
        'corsair', 'steelseries', 'logitech', 'hyperx', 'roccat', 'cooler master',
        'bose', 'jbl', 'beats', 'sennheiser', 'audio-technica', 'sony', 'skullcandy',
        'oneplus', 'oppo', 'vivo', 'realme', 'motorola', 'nokia', 'blackberry',
        'lg', 'panasonic', 'philips', 'canon', 'nikon', 'gopro', 'dji', 'fitbit', 'garmin',
        'nike', 'adidas', 'puma', 'under armour', 'new balance',
        'toyota', 'honda', 'ford', 'bmw', 'mercedes', 'audi', 'volkswagen', 'nissan',
        'chevrolet', 'hyundai', 'kia', 'mazda', 'subaru', 'lexus', 'infiniti',
        'acura', 'buick', 'cadillac', 'chrysler', 'dodge', 'jeep', 'ram'
    ];
    if (normalizedTitle.includes('airpods') || normalizedTitle.includes('air pods')) {
        identifiers.brand = 'apple';
        identifiers.model = 'airpods';
    }
    for (const brand of brands) {
        if (normalizedTitle.includes(brand)) {
            identifiers.brand = brand;
            break;
        }
    }
    const modelPatterns = [
        /iphone\s*(\d+)/i,
        /ipad\s*(pro|air|mini)?\s*(\d+)?/i,
        /macbook\s*(pro|air)?\s*(\d+)?/i,
        /airpods\s*(pro|max|gen|generation)?/i,
        /apple\s*watch\s*series\s*(\d+)/i,
        /rog\s*(zephyrus|strix|flow|scar)\s*(g\d+|m\d+|x\d+)?/i,
        /(predator|nitro|aspire)\s*(helios|triton|5|7)?\s*(\d+)?/i,
        /(legion|ideapad)\s*(5|7|y\d+)?/i,
        /(alienware|inspiron|xps|precision)\s*(m\d+|x\d+|\d+)?/i,
        /(gaming|republic)\s*(laptop|notebook)/i,
        /(hp|dell|lenovo|asus|acer|msi|razer|toshiba|samsung|lg)\s*(\d+\.?\d*)/i,
        /(intel|amd)\s*(core|ryzen|athlon|pentium|celeron)\s*(i\d|r\d|a\d|p\d|c\d)/i,
        /(\d+\.?\d*)\s*(inch|")\s*(laptop|notebook|computer)/i,
        /(\d+)\s*(gb|tb)\s*(ram|memory|ssd|storage)/i,
        /(rtx|gtx|radeon|rx)\s*(\d+)/i,
        /galaxy\s*(s|note|a|m|tab)\s*(\d+)/i,
        /galaxy\s*(s|note|a|m|tab)\s*(\d+)\s*(ultra|plus|fe|5g)/i,
        /s(\d+)\s*(ultra|plus|fe|5g)/i,
        /note\s*(\d+)/i,
        /galaxy\s*buds\s*(\d+)?/i,
        /galaxy\s*watch\s*(\d+)?/i,
        /redmi\s*(note|airdots|buds)\s*(\d+)?/i,
        /mi\s*(note|mix|max)\s*(\d+)?/i,
        /xiaomi\s*(redmi|mi)\s*(\d+)?/i,
        /oneplus\s*(\d+)/i,
        /oneplus\s*(\d+)\s*(pro|t|r)/i,
        /pixel\s*(\d+)/i,
        /pixel\s*(\d+)\s*(pro|a)/i,
        /logitech\s*(mx|g|k|m|h|z|b|c|s)\s*(\d+)?/i,
        /(mx|g|k|m|h|z|b|c|s)\s*(\d+)\s*(master|pro|ultra|wireless|bluetooth)/i,
        /(mx master|g pro|k\d+|m\d+|h\d+|z\d+|b\d+|c\d+|s\d+)/i,
        /(\d+)\s*(gb|tb|mb)/i,
        /(\d+)\s*inch/i,
        /(\d+)\s*mm/i,
        /(\d+)\s*w/i,
        /(\d+)\s*mah/i,
        /yaris\s*(\d{4})/i,
        /prius\s*(\d{4})/i,
        /civic\s*(\d{4})/i,
        /accord\s*(\d{4})/i,
        /camry\s*(\d{4})/i,
        /corolla\s*(\d{4})/i,
        /focus\s*(\d{4})/i,
        /fiesta\s*(\d{4})/i,
        /mustang\s*(\d{4})/i,
        /escape\s*(\d{4})/i,
        /explorer\s*(\d{4})/i,
        /side\s*mirror/i,
        /rear\s*mirror/i,
        /side\s*view/i,
        /wing\s*mirror/i
    ];
    for (const pattern of modelPatterns) {
        const match = normalizedTitle.match(pattern);
        if (match) {
            identifiers.model = match[0];
            break;
        }
    }
    const colors = [
        'black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'gold', 'silver',
        'gray', 'grey', 'brown', 'orange', 'navy', 'maroon', 'teal', 'lime', 'cyan', 'magenta'
    ];
    for (const color of colors) {
        if (normalizedTitle.includes(color)) {
            identifiers.color = color;
            break;
        }
    }
    const sizePatterns = [
        /128gb/i, /256gb/i, /512gb/i, /1tb/i, /2tb/i, /4tb/i,
        /small/i, /medium/i, /large/i, /xl/i, /xxl/i,
        /(\d+)\s*inch/i, /(\d+)\s*cm/i
    ];
    for (const pattern of sizePatterns) {
        const match = normalizedTitle.match(pattern);
        if (match) {
            identifiers.size = match[0];
            break;
        }
    }
    const features = [
        'gaming', 'rog', 'zephyrus', 'strix', 'rtx', 'gtx', 'nvidia', 'geforce', 'radeon',
        'core i7', 'core i5', 'core i9', 'ryzen 5', 'ryzen 7', 'ryzen 9',
        '165hz', '144hz', '120hz', '240hz', 'high refresh', 'gaming laptop',
        '16gb ram', '32gb ram', '8gb ram', '512gb ssd', '1tb ssd', 'nvme',
        'fhd', '4k', 'uhd', 'qhd', '1080p', '1440p', '2160p', 'ips', 'oled', 'amoled', 'lcd', 'retina',
        'wireless', 'bluetooth', 'wifi', '4g', '5g', 'nfc', 'gps',
        'hdmi', 'usb', 'type c', 'thunderbolt', 'ethernet', 'vga', 'displayport',
        'waterproof', 'dustproof', 'shockproof', 'antishock',
        'fast charging', 'wireless charging', 'quick charge',
        'stereo', 'surround', 'noise cancelling', 'active noise cancellation',
        'touch screen', 'touchscreen', 'backlit', 'backlit keyboard', 'fingerprint', 'webcam',
        'ssd', 'hdd', 'hybrid', 'dual core', 'quad core', 'octa core', 'hexa core',
        'intel', 'amd', 'core i3', 'core i5', 'core i7', 'core i9', 'ryzen', 'athlon'
    ];
    for (const feature of features) {
        if (normalizedTitle.includes(feature)) {
            identifiers.features.push(feature);
        }
    }
    if (/(renewed|refurb|refurbished|re\-certified|recertified)/i.test(normalizedTitle)) {
        identifiers.condition = 'refurbished';
    }
    else if (/(used|pre\-owned|preowned|open box|open\-box)/i.test(normalizedTitle)) {
        identifiers.condition = /open box|open\-box/i.test(normalizedTitle) ? 'open_box' : 'used';
    }
    else if (/(brand new|sealed|new)/i.test(normalizedTitle)) {
        identifiers.condition = 'new';
    }
    const accessoryKeywords = [
        'case', 'charger', 'cable', 'earbuds', 'headphones', 'screen protector', 'protector', 'bundle', 'kit', 'mouse', 'keyboard', 'controller', 'dock', 'cover', 'strap', 'adapter', 'power bank', 'sd card', 'memory card', 'stand', 'tripod'
    ];
    for (const word of accessoryKeywords) {
        if (normalizedTitle.includes(word)) {
            identifiers.accessories.push(word);
        }
    }
    identifiers.isBundle = normalizedTitle.includes('bundle') || normalizedTitle.includes('with ') || identifiers.accessories.length >= 2;
    const stopWords = [
        'the', 'and', 'for', 'with', 'new', 'original', 'genuine', 'official',
        'brand', 'product', 'item', 'best', 'top', 'quality', 'premium'
    ];
    identifiers.keywords = normalizedTitle
        .split(/\s+/)
        .filter(word => word.length > 2 &&
        !stopWords.includes(word) &&
        !identifiers.brand.includes(word) &&
        !identifiers.model.includes(word) &&
        !identifiers.color.includes(word) &&
        !identifiers.size.includes(word));
    const skuPattern = /[A-Z]{2,}\d{3,}/i;
    const skuMatch = normalizedTitle.match(skuPattern);
    if (skuMatch) {
        identifiers.sku = skuMatch[0];
    }
    return identifiers;
}
function calculateTitleSimilarity(title1, title2) {
    const basicSimilarity = string_similarity_1.default.compareTwoStrings(title1.toLowerCase(), title2.toLowerCase());
    const words1 = title1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const words2 = title2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const commonWords = words1.filter(word => words2.includes(word));
    const wordSimilarity = commonWords.length / Math.max(words1.length, words2.length);
    const charSimilarity = string_similarity_1.default.compareTwoStrings(title1.toLowerCase().replace(/\s+/g, ''), title2.toLowerCase().replace(/\s+/g, ''));
    const samsungPattern1 = /(galaxy\s*s\d+|s\d+)/i;
    const samsungPattern2 = /(galaxy\s*s\d+|s\d+)/i;
    const isSamsung1 = samsungPattern1.test(title1);
    const isSamsung2 = samsungPattern2.test(title2);
    let samsungBonus = 0;
    if (isSamsung1 && isSamsung2) {
        const model1 = title1.match(/(s\d+)/i)?.[1] || '';
        const model2 = title2.match(/(s\d+)/i)?.[1] || '';
        if (model1 && model2 && model1.toLowerCase() === model2.toLowerCase()) {
            samsungBonus = 0.3;
        }
    }
    return Math.min(1, (basicSimilarity * 0.3 + wordSimilarity * 0.4 + charSimilarity * 0.2 + samsungBonus));
}
function calculateIdentifierSimilarity(identifiers1, identifiers2) {
    let score = 0;
    let totalChecks = 0;
    if (identifiers1.brand && identifiers2.brand) {
        totalChecks++;
        if (identifiers1.brand === identifiers2.brand) {
            score += 1;
        }
    }
    if (identifiers1.model && identifiers2.model) {
        totalChecks++;
        if (identifiers1.model === identifiers2.model) {
            score += 1;
        }
    }
    if (identifiers1.color && identifiers2.color) {
        totalChecks++;
        if (identifiers1.color === identifiers2.color) {
            score += 1;
        }
    }
    if (identifiers1.size && identifiers2.size) {
        totalChecks++;
        if (identifiers1.size === identifiers2.size) {
            score += 1;
        }
    }
    if (identifiers1.condition && identifiers2.condition) {
        totalChecks++;
        if (identifiers1.condition === identifiers2.condition) {
            score += 1;
        }
    }
    if (identifiers1.sku && identifiers2.sku) {
        totalChecks++;
        if (identifiers1.sku === identifiers2.sku) {
            score += 1;
        }
    }
    if (identifiers1.features.length > 0 && identifiers2.features.length > 0) {
        const commonFeatures = identifiers1.features.filter(f => identifiers2.features.includes(f));
        const featureSimilarity = commonFeatures.length / Math.max(identifiers1.features.length, identifiers2.features.length);
        score += featureSimilarity;
        totalChecks++;
    }
    if (identifiers1.keywords.length > 0 && identifiers2.keywords.length > 0) {
        const commonKeywords = identifiers1.keywords.filter(k => identifiers2.keywords.includes(k));
        const keywordSimilarity = commonKeywords.length / Math.max(identifiers1.keywords.length, identifiers2.keywords.length);
        score += keywordSimilarity;
        totalChecks++;
    }
    if (typeof identifiers1.isBundle === 'boolean' && typeof identifiers2.isBundle === 'boolean') {
        totalChecks++;
        if (identifiers1.isBundle === identifiers2.isBundle) {
            score += 1;
        }
    }
    const isLaptop1 = identifiers1.keywords.some(k => k.toLowerCase().includes('laptop') || k.toLowerCase().includes('notebook') || k.toLowerCase().includes('computer'));
    const isLaptop2 = identifiers2.keywords.some(k => k.toLowerCase().includes('laptop') || k.toLowerCase().includes('notebook') || k.toLowerCase().includes('computer'));
    if (isLaptop1 && isLaptop2) {
        totalChecks++;
        score += 0.5;
        if (identifiers1.brand && identifiers2.brand && identifiers1.brand === identifiers2.brand) {
            score += 0.3;
        }
        if (identifiers1.size && identifiers2.size) {
            const size1 = identifiers1.size.match(/(\d+\.?\d*)/)?.[1];
            const size2 = identifiers2.size.match(/(\d+\.?\d*)/)?.[1];
            if (size1 && size2) {
                const diff = Math.abs(parseFloat(size1) - parseFloat(size2));
                if (diff <= 1)
                    score += 0.2;
                else if (diff <= 2)
                    score += 0.1;
            }
        }
    }
    return totalChecks > 0 ? score / totalChecks : 0;
}
function calculatePriceSimilarity(price1, price2) {
    const priceDiff = Math.abs(price1 - price2);
    const avgPrice = (price1 + price2) / 2;
    const priceRatio = priceDiff / avgPrice;
    return Math.max(0, 1 - (priceRatio * 2));
}
function findProductMatches(targetProduct, allProducts) {
    console.log(`🔍 [Product Matching] Finding matches for: ${targetProduct.title} (${targetProduct.platform})`);
    console.log(`🔍 [Product Matching] Total products to check: ${allProducts.length}`);
    const isLaptop = targetProduct.title.toLowerCase().includes('laptop') ||
        targetProduct.title.toLowerCase().includes('notebook') ||
        targetProduct.title.toLowerCase().includes('computer');
    console.log(`🔍 [Product Matching] Is laptop: ${isLaptop}`);
    const matches = [];
    const targetIdentifiers = extractProductIdentifiers(targetProduct.title);
    console.log(`🔍 [Product Matching] Target identifiers:`, targetIdentifiers);
    if (isLaptop) {
        console.log(`🔍 [Product Matching] Laptop keywords:`, targetIdentifiers.keywords);
        console.log(`🔍 [Product Matching] Laptop features:`, targetIdentifiers.features);
    }
    for (const product of allProducts) {
        if (product.id === targetProduct.id) {
            continue;
        }
        let platformPenalty = 0;
        if (product.platform === targetProduct.platform) {
            platformPenalty = 0.15;
        }
        const productIdentifiers = extractProductIdentifiers(product.title);
        const titleSimilarity = calculateTitleSimilarity(targetProduct.title, product.title);
        const identifierSimilarity = calculateIdentifierSimilarity(targetIdentifiers, productIdentifiers);
        const priceSimilarity = calculatePriceSimilarity(targetProduct.price, product.price);
        const targetCategory = getProductCategory(targetProduct.title);
        const productCategory = getProductCategory(product.title);
        console.log(`🔍 [Product Matching] Category check: ${targetCategory} vs ${productCategory}`);
        if (targetCategory !== productCategory) {
            console.log(`🚫 [Product Matching] Category mismatch: ${targetCategory} vs ${productCategory} - Skipping`);
            continue;
        }
        console.log(`✅ [Product Matching] Category match: ${targetCategory}`);
        if (isLaptop && titleSimilarity > 0.2) {
            console.log(`🔍 [Product Matching] Laptop candidate: ${product.title}`);
            console.log(`🔍 [Product Matching] Scores - Title: ${titleSimilarity.toFixed(3)}, Identifiers: ${identifierSimilarity.toFixed(3)}, Price: ${priceSimilarity.toFixed(3)}`);
        }
        let overallSimilarity;
        if (isLaptop) {
            overallSimilarity = (titleSimilarity * 0.30 +
                identifierSimilarity * 0.50 +
                priceSimilarity * 0.20);
        }
        else {
            overallSimilarity = (titleSimilarity * 0.35 +
                identifierSimilarity * 0.45 +
                priceSimilarity * 0.20);
        }
        overallSimilarity -= platformPenalty;
        if (targetIdentifiers.size && productIdentifiers.size && targetIdentifiers.size !== productIdentifiers.size) {
            overallSimilarity -= 0.10;
        }
        if (targetIdentifiers.condition && productIdentifiers.condition && targetIdentifiers.condition !== productIdentifiers.condition) {
            overallSimilarity -= 0.15;
        }
        if (typeof targetIdentifiers.isBundle === 'boolean' && typeof productIdentifiers.isBundle === 'boolean') {
            if (targetIdentifiers.isBundle !== productIdentifiers.isBundle) {
                overallSimilarity -= 0.05;
            }
            else if (targetIdentifiers.isBundle && productIdentifiers.isBundle) {
                overallSimilarity += 0.05;
            }
        }
        overallSimilarity = Math.max(0, Math.min(1, overallSimilarity));
        const threshold = isLaptop ? 0.25 : 0.35;
        if (isLaptop && overallSimilarity > 0.2) {
            console.log(`🔍 [Product Matching] Final similarity: ${overallSimilarity.toFixed(3)} (threshold: ${threshold})`);
        }
        if (overallSimilarity > threshold) {
            const priceDifference = Math.abs(targetProduct.price - product.price);
            const priceDifferencePercent = (priceDifference / targetProduct.price) * 100;
            const confidence = overallSimilarity > 0.65 ? 'high' : overallSimilarity > 0.5 ? 'medium' : 'low';
            const matchReason = generateMatchReason(targetIdentifiers, productIdentifiers, overallSimilarity);
            matches.push({
                product,
                similarity: overallSimilarity,
                confidence,
                matchReason,
                priceDifference,
                priceDifferencePercent
            });
        }
    }
    console.log(`🔍 [Product Matching] Found ${matches.length} matches`);
    if (matches.length > 0) {
        console.log(`🔍 [Product Matching] Top match: ${matches[0].product.title} (${matches[0].similarity.toFixed(2)})`);
    }
    return matches.sort((a, b) => b.similarity - a.similarity);
}
function getProductCategory(title) {
    const normalizedTitle = title.toLowerCase();
    if ((normalizedTitle.includes('laptop') || normalizedTitle.includes('notebook')) &&
        (normalizedTitle.includes('gaming') || normalizedTitle.includes('rog') ||
            normalizedTitle.includes('zephyrus') || normalizedTitle.includes('nitro') ||
            normalizedTitle.includes('alienware') || normalizedTitle.includes('legion') ||
            normalizedTitle.includes('rtx') || normalizedTitle.includes('gtx'))) {
        return 'gaming_laptop';
    }
    if (normalizedTitle.includes('laptop') || normalizedTitle.includes('notebook') ||
        normalizedTitle.includes('computer') || normalizedTitle.includes('pc') ||
        normalizedTitle.includes('macbook') || normalizedTitle.includes('chromebook')) {
        return 'laptop';
    }
    if (normalizedTitle.includes('phone') || normalizedTitle.includes('smartphone') ||
        normalizedTitle.includes('iphone') || normalizedTitle.includes('galaxy') ||
        normalizedTitle.includes('android') || normalizedTitle.includes('mobile')) {
        return 'phone';
    }
    if (normalizedTitle.includes('xbox') || normalizedTitle.includes('playstation') ||
        normalizedTitle.includes('nintendo') || normalizedTitle.includes('ps5') ||
        normalizedTitle.includes('ps4') || normalizedTitle.includes('switch')) {
        return 'gaming_console';
    }
    if (normalizedTitle.includes('tv') || normalizedTitle.includes('television') ||
        normalizedTitle.includes('monitor') || normalizedTitle.includes('display') ||
        normalizedTitle.includes('screen')) {
        return 'display';
    }
    if (normalizedTitle.includes('ice maker') || normalizedTitle.includes('refrigerator') ||
        normalizedTitle.includes('microwave') || normalizedTitle.includes('dishwasher') ||
        normalizedTitle.includes('washer') || normalizedTitle.includes('dryer') ||
        normalizedTitle.includes('appliance')) {
        return 'appliance';
    }
    if (normalizedTitle.includes('headphone') || normalizedTitle.includes('earbud') ||
        normalizedTitle.includes('airpod') || normalizedTitle.includes('speaker') ||
        normalizedTitle.includes('audio') || normalizedTitle.includes('sound')) {
        return 'audio';
    }
    if (normalizedTitle.includes('necklace') || normalizedTitle.includes('bracelet') ||
        normalizedTitle.includes('ring') || normalizedTitle.includes('earring') ||
        normalizedTitle.includes('jewelry') || normalizedTitle.includes('accessory')) {
        return 'jewelry';
    }
    if (normalizedTitle.includes('shirt') || normalizedTitle.includes('dress') ||
        normalizedTitle.includes('pants') || normalizedTitle.includes('jacket') ||
        normalizedTitle.includes('shoes') || normalizedTitle.includes('boots')) {
        return 'clothing';
    }
    return 'other';
}
function generateMatchReason(targetIdentifiers, productIdentifiers, similarity) {
    if (targetIdentifiers.brand && productIdentifiers.brand && targetIdentifiers.brand === productIdentifiers.brand) {
        return `Same brand (${targetIdentifiers.brand})`;
    }
    if (targetIdentifiers.model && productIdentifiers.model && targetIdentifiers.model === productIdentifiers.model) {
        return `Same model (${targetIdentifiers.model})`;
    }
    if (targetIdentifiers.size && productIdentifiers.size && targetIdentifiers.size === productIdentifiers.size) {
        return `Same storage/size (${targetIdentifiers.size})`;
    }
    if (targetIdentifiers.color && productIdentifiers.color && targetIdentifiers.color === productIdentifiers.color) {
        return `Same color (${targetIdentifiers.color})`;
    }
    if (targetIdentifiers.condition && productIdentifiers.condition && targetIdentifiers.condition === productIdentifiers.condition) {
        return `Same condition (${targetIdentifiers.condition})`;
    }
    if (typeof targetIdentifiers.isBundle === 'boolean' && typeof productIdentifiers.isBundle === 'boolean') {
        if (targetIdentifiers.isBundle && productIdentifiers.isBundle)
            return 'Both are bundles';
        if (targetIdentifiers.isBundle !== productIdentifiers.isBundle)
            return 'Bundle vs standalone';
    }
    if (targetIdentifiers.sku && productIdentifiers.sku && targetIdentifiers.sku === productIdentifiers.sku) {
        return `Same SKU (${targetIdentifiers.sku})`;
    }
    if (similarity > 0.8) {
        return 'Very similar product names';
    }
    if (similarity > 0.7) {
        return 'Similar product characteristics';
    }
    return 'Partial match based on keywords';
}
router.post('/track', auth_1.authMiddleware, validateProduct, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { url, title, price, currency, platform, imageUrl, stockStatus, discountInfo } = req.body;
        const userId = req.user.uid;
        const products = await storage_1.default.getProducts(userId);
        console.log(`[DEBUG] Checking for duplicates - User: ${userId}, URL: ${url}`);
        console.log(`[DEBUG] User has ${products.length} products`);
        const existing = products.find((p) => p.url === url);
        if (existing) {
            console.log(`[DEBUG] Found existing product: ${existing.title}`);
            return res.status(409).json({
                success: false,
                error: 'Product already tracked'
            });
        }
        console.log(`[DEBUG] No existing product found, proceeding to add new product`);
        const id = await storage_1.default.addProduct({
            url,
            title,
            price: typeof price === 'string' ? parseFloat(price) : price,
            currency: currency || '$',
            platform,
            imageUrl: imageUrl || '',
            userId,
            stockStatus: stockStatus || 'unknown',
            discountInfo
        });
        await storage_1.default.addPriceHistory({
            productId: id,
            price: typeof price === 'string' ? parseFloat(price) : price,
            currency: currency || '$'
        });
        const allProducts = await storage_1.default.getProducts();
        const newProduct = allProducts.find((p) => p.id === id);
        if (newProduct) {
            console.log(`[PRODUCT MATCHING] Looking for matches for: ${newProduct.title}`);
            const matches = findProductMatches(newProduct, allProducts);
            const matchedProductIds = matches.map(match => match.product.id);
            console.log(`[PRODUCT MATCHING] Found ${matches.length} matches:`);
            matches.forEach(match => {
                console.log(`  - ${match.product.title} (${match.product.platform}) - Similarity: ${match.similarity.toFixed(2)} - Reason: ${match.matchReason}`);
            });
            await storage_1.default.updateProduct(id, { matchedProducts: matchedProductIds });
            for (const match of matches) {
                const existingProduct = allProducts.find((p) => p.id === match.product.id);
                if (existingProduct) {
                    const currentMatches = existingProduct.matchedProducts || [];
                    if (!currentMatches.includes(id)) {
                        currentMatches.push(id);
                        await storage_1.default.updateProduct(match.product.id, { matchedProducts: currentMatches });
                    }
                }
            }
            console.log(`[PRODUCT MATCHING] Updated ${matches.length} products with new matches`);
        }
        return res.status(201).json({
            success: true,
            data: {
                id,
                url,
                title,
                price,
                currency,
                platform,
                imageUrl,
                userId,
                stockStatus: stockStatus || 'unknown',
                discountInfo
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            success: false,
            error: message
        });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        let products = await storage_1.default.getProducts(userId);
        const user = await storage_1.default.getUserById(userId);
        const seenPriceDropIds = user?.seenPriceDropIds || [];
        const { search, platform, minPrice, maxPrice, stockStatus, hasPriceDrop, sortBy = 'createdAt', sortOrder = 'desc', limit, offset = 0 } = req.query;
        let productsWithHistory = await Promise.all(products.map(async (product) => {
            const history = await storage_1.default.getPriceHistory(product.id);
            const priceHistory = history || [];
            let priceDrop = 0;
            let priceDropPercent = 0;
            let previousPrice = product.price;
            let hasPriceDrop = false;
            if (priceHistory.length > 1) {
                const previousEntry = priceHistory[priceHistory.length - 2];
                if (previousEntry && previousEntry.price && previousEntry.price > product.price) {
                    priceDrop = previousEntry.price - product.price;
                    priceDropPercent = Math.round((priceDrop / previousEntry.price) * 100);
                    previousPrice = previousEntry.price;
                    hasPriceDrop = priceDrop > 0 && !seenPriceDropIds.includes(product.id);
                }
            }
            return {
                ...product,
                url: addAffiliateTag(product.url, product.platform),
                priceHistory,
                priceDrop,
                priceDropPercent,
                previousPrice,
                hasPriceDrop
            };
        }));
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            productsWithHistory = productsWithHistory.filter(product => product.title.toLowerCase().includes(searchLower) ||
                product.platform.toLowerCase().includes(searchLower));
        }
        if (platform && typeof platform === 'string') {
            productsWithHistory = productsWithHistory.filter(product => product.platform === platform);
        }
        if (minPrice && typeof minPrice === 'string') {
            const min = parseFloat(minPrice);
            if (!isNaN(min)) {
                productsWithHistory = productsWithHistory.filter(product => product.price >= min);
            }
        }
        if (maxPrice && typeof maxPrice === 'string') {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
                productsWithHistory = productsWithHistory.filter(product => product.price <= max);
            }
        }
        if (stockStatus && typeof stockStatus === 'string') {
            productsWithHistory = productsWithHistory.filter(product => product.stockStatus === stockStatus);
        }
        if (hasPriceDrop === 'true') {
            productsWithHistory = productsWithHistory.filter(product => product.hasPriceDrop);
        }
        const sortOrderMultiplier = sortOrder === 'desc' ? -1 : 1;
        productsWithHistory.sort((a, b) => {
            let aValue;
            let bValue;
            switch (sortBy) {
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'priceDrop':
                    aValue = a.priceDrop;
                    bValue = b.priceDrop;
                    break;
                case 'priceDropPercent':
                    aValue = a.priceDropPercent;
                    bValue = b.priceDropPercent;
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'platform':
                    aValue = a.platform.toLowerCase();
                    bValue = b.platform.toLowerCase();
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
            }
            if (aValue < bValue)
                return -1 * sortOrderMultiplier;
            if (aValue > bValue)
                return 1 * sortOrderMultiplier;
            return 0;
        });
        const totalCount = productsWithHistory.length;
        const offsetNum = parseInt(offset) || 0;
        const limitNum = limit ? parseInt(limit) : totalCount;
        const paginatedProducts = productsWithHistory.slice(offsetNum, offsetNum + limitNum);
        const totalValue = productsWithHistory.reduce((sum, product) => sum + product.price, 0);
        const totalSavings = productsWithHistory.reduce((sum, product) => sum + product.priceDrop, 0);
        const productsWithPriceDrops = productsWithHistory.filter(product => product.hasPriceDrop).length;
        const outOfStockCount = productsWithHistory.filter(product => product.stockStatus === 'out_of_stock').length;
        return res.json({
            success: true,
            data: paginatedProducts,
            pagination: {
                total: totalCount,
                offset: offsetNum,
                limit: limitNum,
                hasMore: offsetNum + limitNum < totalCount
            },
            summary: {
                totalProducts: totalCount,
                totalValue: totalValue.toFixed(2),
                totalSavings: totalSavings.toFixed(2),
                productsWithPriceDrops,
                outOfStockCount
            }
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:productId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const product = await storage_1.default.getProductById(productId);
        const user = await storage_1.default.getUserById(userId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (!user || (user.role !== 'admin' && product.userId !== userId)) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await storage_1.default.deleteProduct(productId);
        return res.json({ success: true, message: 'Product removed from tracking' });
    }
    catch (error) {
        console.error('Error removing product:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:productId/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const product = await storage_1.default.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (product.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        const history = await storage_1.default.getPriceHistory(productId);
        return res.json({ success: true, data: history });
    }
    catch (error) {
        console.error('Error fetching price history:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/filters', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const products = await storage_1.default.getProducts(userId);
        const user = await storage_1.default.getUserById(userId);
        const seenPriceDropIds = user?.seenPriceDropIds || [];
        const prices = products.map(p => p.price).filter(p => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const platforms = [...new Set(products.map(p => p.platform))];
        const stockStatuses = products.reduce((acc, product) => {
            const status = product.stockStatus || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const productsWithHistory = await Promise.all(products.map(async (product) => {
            const history = await storage_1.default.getPriceHistory(product.id);
            if (history.length > 1) {
                const previousEntry = history[history.length - 2];
                if (previousEntry && previousEntry.price) {
                    const priceDrop = previousEntry.price - product.price;
                    const hasDrop = priceDrop > 0;
                    const isSeen = seenPriceDropIds.includes(product.id);
                    return {
                        priceDrop,
                        priceDropPercent: Math.round((priceDrop / previousEntry.price) * 100),
                        hasDrop,
                        isSeen
                    };
                }
            }
            return { priceDrop: 0, priceDropPercent: 0, hasDrop: false, isSeen: false };
        }));
        const productsWithPriceDrops = productsWithHistory.filter(p => p.hasDrop && !p.isSeen).length;
        const maxPriceDrop = productsWithHistory.length > 0 ? Math.max(...productsWithHistory.map(p => p.priceDrop)) : 0;
        const maxPriceDropPercent = productsWithHistory.length > 0 ? Math.max(...productsWithHistory.map(p => p.priceDropPercent)) : 0;
        return res.json({
            success: true,
            data: {
                priceRange: { min: minPrice, max: maxPrice },
                platforms,
                stockStatuses,
                priceDropStats: {
                    productsWithPriceDrops,
                    maxPriceDrop: maxPriceDrop.toFixed(2),
                    maxPriceDropPercent
                },
                totalProducts: products.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching filter options:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/all', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await storage_1.default.getUserById(req.user.uid);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const data = storage_1.default.readData();
        const products = data.products || [];
        const users = data.users || [];
        const productsWithIds = products.map((p, i) => {
            const productUser = users.find(u => u.id === p.userId);
            return {
                ...p,
                id: p.id || `fallback_${i}`,
                user: productUser ? {
                    email: productUser.email,
                    name: productUser.name || productUser.username
                } : undefined
            };
        });
        return res.json({ success: true, data: productsWithIds });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch all products' });
    }
});
router.get('/price-drops', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const products = await storage_1.default.getProducts(userId);
        const priceDropIds = [];
        for (const product of products) {
            const history = await storage_1.default.getPriceHistory(product.id);
            if (history.length > 1) {
                const sortedHistory = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const last = sortedHistory[sortedHistory.length - 1];
                const prev = sortedHistory[sortedHistory.length - 2];
                if (last && prev && last.price < prev.price) {
                    priceDropIds.push(product.id);
                }
            }
        }
        return res.json({ success: true, data: priceDropIds });
    }
    catch (error) {
        console.error('Error fetching price drops:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch price drops' });
    }
});
router.get('/:productId/matches', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const userId = req.user.uid;
        const allProducts = await storage_1.default.getProducts();
        const targetProduct = allProducts.find((p) => p.id === productId);
        if (!targetProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        console.log(`[MATCHING] Looking for matches for: "${targetProduct.title}"`);
        console.log(`[MATCHING] Total products in database: ${allProducts.length}`);
        const allMatches = findProductMatches(targetProduct, allProducts);
        console.log(`[MATCHING] Found ${allMatches.length} total matches`);
        const platformGroups = new Map();
        const supportedPlatforms = ['amazon', 'ebay', 'walmart', 'target', 'aliexpress', 'shein', 'bestbuy'];
        allMatches.forEach(match => {
            const platform = match.product.platform.toLowerCase();
            if (supportedPlatforms.includes(platform) && platform !== targetProduct.platform.toLowerCase()) {
                if (!platformGroups.has(platform)) {
                    platformGroups.set(platform, []);
                }
                platformGroups.get(platform).push(match);
            }
        });
        const matches = [];
        console.log(`[MATCHING] Processing ${platformGroups.size} platforms (excluding ${targetProduct.platform})`);
        supportedPlatforms.forEach(platform => {
            if (platform === targetProduct.platform.toLowerCase())
                return;
            const platformMatches = platformGroups.get(platform) || [];
            if (platformMatches.length > 0) {
                const sortedByPrice = platformMatches.sort((a, b) => a.product.price - b.product.price);
                const cheapestFromPlatform = sortedByPrice.slice(0, 2);
                matches.push(...cheapestFromPlatform);
                console.log(`[MATCHING] ${platform}: Added ${cheapestFromPlatform.length} products (${cheapestFromPlatform.map(m => `$${m.product.price}`).join(', ')})`);
            }
            else {
                console.log(`[MATCHING] ${platform}: No matches found`);
            }
        });
        console.log(`[MATCHING] Final ${matches.length} cheapest matches across platforms:`);
        matches.forEach((match, index) => {
            console.log(`[MATCHING] ${index + 1}. "${match.product.title}" (${match.product.platform}) - $${match.product.price} - Similarity: ${match.similarity.toFixed(3)}`);
        });
        const matchedProductIds = matches.map(match => match.product.id);
        await storage_1.default.updateProduct(productId, { matchedProducts: matchedProductIds });
        const formattedMatches = matches.map(match => ({
            product: {
                id: match.product.id,
                title: match.product.title,
                price: match.product.price,
                platform: match.product.platform,
                url: match.product.url,
                imageUrl: match.product.imageUrl,
                stockStatus: match.product.stockStatus,
                discountInfo: match.product.discountInfo
            },
            similarity: match.similarity,
            confidence: match.confidence,
            matchReason: match.matchReason,
            priceDifference: match.priceDifference,
            priceDifferencePercent: match.priceDifferencePercent
        }));
        return res.json({
            success: true,
            data: {
                targetProduct: {
                    id: targetProduct.id,
                    title: targetProduct.title,
                    price: targetProduct.price,
                    platform: targetProduct.platform
                },
                matches: formattedMatches
            }
        });
    }
    catch (error) {
        console.error('Error finding product matches:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/:productId/link/:targetProductId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetProductId } = req.params;
        const userId = req.user.uid;
        if (!productId || !targetProductId) {
            return res.status(400).json({
                success: false,
                error: 'Both product IDs are required'
            });
        }
        const allProducts = await storage_1.default.getProducts();
        const product = allProducts.find((p) => p.id === productId);
        const targetProduct = allProducts.find((p) => p.id === targetProductId);
        if (!product || !targetProduct) {
            return res.status(404).json({
                success: false,
                error: 'One or both products not found'
            });
        }
        if (product.userId !== userId || targetProduct.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to link these products'
            });
        }
        const productMatchedProducts = product.matchedProducts || [];
        const targetMatchedProducts = targetProduct.matchedProducts || [];
        if (!productMatchedProducts.includes(targetProductId)) {
            productMatchedProducts.push(targetProductId);
            await storage_1.default.updateProduct(productId, { matchedProducts: productMatchedProducts });
        }
        if (!targetMatchedProducts.includes(productId)) {
            targetMatchedProducts.push(productId);
            await storage_1.default.updateProduct(targetProductId, { matchedProducts: targetMatchedProducts });
        }
        return res.json({
            success: true,
            message: 'Products linked successfully'
        });
    }
    catch (error) {
        console.error('Error linking products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:productId/unlink/:targetProductId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetProductId } = req.params;
        const userId = req.user.uid;
        if (!productId || !targetProductId) {
            return res.status(400).json({
                success: false,
                error: 'Both product IDs are required'
            });
        }
        const allProducts = await storage_1.default.getProducts();
        const product = allProducts.find((p) => p.id === productId);
        const targetProduct = allProducts.find((p) => p.id === targetProductId);
        if (!product || !targetProduct) {
            return res.status(404).json({
                success: false,
                error: 'One or both products not found'
            });
        }
        if (product.userId !== userId || targetProduct.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to unlink these products'
            });
        }
        const productMatchedProducts = product.matchedProducts || [];
        const targetMatchedProducts = targetProduct.matchedProducts || [];
        const updatedProductMatches = productMatchedProducts.filter((id) => id !== targetProductId);
        const updatedTargetMatches = targetMatchedProducts.filter((id) => id !== productId);
        await storage_1.default.updateProduct(productId, { matchedProducts: updatedProductMatches });
        await storage_1.default.updateProduct(targetProductId, { matchedProducts: updatedTargetMatches });
        return res.json({
            success: true,
            message: 'Products unlinked successfully'
        });
    }
    catch (error) {
        console.error('Error unlinking products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/export/csv', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const allProducts = await storage_1.default.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        const csvHeader = 'ID,Title,Price,Currency,Platform,URL,Stock Status,Discount Info,Created At,Updated At\n';
        const csvRows = userProducts.map((product) => {
            return `"${product.id}","${product.title.replace(/"/g, '""')}","${product.price}","${product.currency}","${product.platform}","${product.url}","${product.stockStatus || ''}","${product.discountInfo || ''}","${product.createdAt}","${product.updatedAt}"`;
        }).join('\n');
        const csvContent = csvHeader + csvRows;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        return res.send(csvContent);
    }
    catch (error) {
        console.error('Error exporting CSV:', error);
        return res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
});
router.get('/export/json', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const allProducts = await storage_1.default.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
        return res.json({
            success: true,
            data: {
                exportedAt: new Date().toISOString(),
                totalProducts: userProducts.length,
                products: userProducts
            }
        });
    }
    catch (error) {
        console.error('Error exporting JSON:', error);
        return res.status(500).json({ success: false, message: 'Failed to export JSON' });
    }
});
router.get('/api-key', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const apiKey = `pt_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return res.json({
            success: true,
            data: {
                apiKey,
                userId,
                createdAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating API key:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate API key' });
    }
});
router.get('/external/products', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'API key required' });
        }
        const userId = apiKey.split('_')[1];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }
        const allProducts = await storage_1.default.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        return res.json({
            success: true,
            data: {
                products: userProducts,
                total: userProducts.length,
                exportedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error accessing API:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/debug/match', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title1, title2 } = req.body;
        if (!title1 || !title2) {
            return res.status(400).json({
                success: false,
                error: 'Both title1 and title2 are required'
            });
        }
        const identifiers1 = extractProductIdentifiers(title1);
        const identifiers2 = extractProductIdentifiers(title2);
        const titleSimilarity = calculateTitleSimilarity(title1, title2);
        const identifierSimilarity = calculateIdentifierSimilarity(identifiers1, identifiers2);
        const overallSimilarity = (titleSimilarity * 0.4 + identifierSimilarity * 0.4 + 0.2);
        return res.json({
            success: true,
            data: {
                title1,
                title2,
                identifiers1,
                identifiers2,
                titleSimilarity,
                identifierSimilarity,
                overallSimilarity,
                wouldMatch: overallSimilarity > 0.4
            }
        });
    }
    catch (error) {
        console.error('Debug match error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:productId/predict', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const history = await storage_1.default.getPriceHistory(String(productId));
        const allProducts = await storage_1.default.getProducts();
        const targetProduct = allProducts.find((p) => p.id === productId);
        if (!targetProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const alternatives = findProductMatches(targetProduct, allProducts)
            .filter(m => m.similarity > 0.5 && m.product.id !== productId)
            .slice(0, 10);
        const targetPrice = targetProduct.price;
        const cheaperAlternatives = alternatives.filter(a => a.product.price < targetPrice);
        const avgAlternativePrice = alternatives.length > 0
            ? alternatives.reduce((sum, a) => sum + a.product.price, 0) / alternatives.length
            : targetPrice;
        const pricePositioning = alternatives.length > 0
            ? Math.max(0, Math.min(1, (avgAlternativePrice - targetPrice) / Math.max(1, avgAlternativePrice)))
            : 0.5;
        let trendScore = 0.5;
        let volatility = 0;
        let reason = 'Limited price history';
        if (history && history.length >= 2) {
            const sorted = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const n = sorted.length;
            if (n > 0) {
                let recentWeight = 0;
                let olderWeight = 0;
                let recentSum = 0;
                let olderSum = 0;
                const midPoint = Math.floor(n / 2);
                for (let i = 0; i < n; i++) {
                    const historyItem = sorted[i];
                    const price = Number(historyItem?.price || 0);
                    if (i >= midPoint) {
                        recentSum += price;
                        recentWeight++;
                    }
                    else {
                        olderSum += price;
                        olderWeight++;
                    }
                }
                const recentAvg = recentWeight > 0 ? recentSum / recentWeight : targetPrice;
                const olderAvg = olderWeight > 0 ? olderSum / olderWeight : targetPrice;
                const trend = recentAvg - olderAvg;
                trendScore = Math.max(-1, Math.min(1, trend / Math.max(1, olderAvg)));
                const avg = sorted.reduce((sum, p) => sum + Number(p.price || 0), 0) / n;
                const variance = sorted.reduce((acc, p) => acc + Math.pow((Number(p.price || 0) - avg), 2), 0) / n;
                volatility = Math.sqrt(variance) / Math.max(1, avg);
                if (Math.abs(trend) > 0.05) {
                    reason = trend > 0 ? 'Prices trending upward' : 'Prices trending downward';
                }
                else {
                    reason = 'Prices relatively stable';
                }
            }
        }
        let recommendation = 'buy';
        let confidence = 0.5;
        let finalReason = reason;
        if (pricePositioning < 0.2) {
            recommendation = 'wait';
            confidence = Math.min(0.9, 0.5 + (0.4 - pricePositioning) * 2);
            finalReason = `Overpriced compared to alternatives (${cheaperAlternatives.length} cheaper options available)`;
        }
        else if (pricePositioning > 0.8) {
            recommendation = 'buy';
            confidence = Math.min(0.9, 0.5 + (pricePositioning - 0.5) * 2);
            finalReason = `Good value compared to alternatives`;
        }
        if (Math.abs(trendScore) > 0.1) {
            if (trendScore > 0.1 && recommendation === 'buy') {
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason += ' - Prices rising but still competitive';
            }
            else if (trendScore < -0.1 && recommendation === 'wait') {
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason += ' - Prices falling, wait for better deals';
            }
        }
        if (volatility > 0.15 && recommendation === 'buy') {
            confidence = Math.max(0.3, confidence - 0.2);
            finalReason += ' - High price volatility suggests waiting';
        }
        if (targetProduct.hasPriceDrop && targetProduct.priceDrop) {
            const dropPercent = (targetProduct.priceDrop / (targetProduct.previousPrice || targetPrice)) * 100;
            if (dropPercent > 10) {
                recommendation = 'buy';
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason = `Recent ${dropPercent.toFixed(1)}% price drop - good time to buy`;
            }
        }
        confidence = Math.max(0.1, Math.min(0.95, confidence));
        return res.json({
            success: true,
            data: {
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                reason: finalReason,
                details: {
                    pricePositioning,
                    trendScore,
                    volatility,
                    alternativesCount: alternatives.length,
                    cheaperAlternativesCount: cheaperAlternatives.length,
                    avgAlternativePrice: Math.round(avgAlternativePrice * 100) / 100
                }
            }
        });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to predict price' });
    }
});
router.get('/:productId/alternatives', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const allProducts = await storage_1.default.getProducts();
        const target = allProducts.find((p) => p.id === productId);
        if (!target)
            return res.status(404).json({ success: false, message: 'Product not found' });
        const targetIds = extractProductIdentifiers(target.title);
        const matches = findProductMatches(target, allProducts);
        const alts = matches
            .filter(m => m.product.price <= target.price || m.similarity > 0.6)
            .map(m => {
            const altIds = extractProductIdentifiers(m.product.title);
            const modelNum = (targetIds.model.match(/\d+/)?.[0]) || '';
            const altModelNum = (altIds.model.match(/\d+/)?.[0]) || '';
            let reason = m.matchReason;
            if (modelNum && altModelNum && parseInt(altModelNum) === parseInt(modelNum) - 1) {
                reason = `Previous generation alternative (${altIds.model})`;
            }
            else if (m.product.price < target.price) {
                reason = `Cheaper by $${(target.price - m.product.price).toFixed(2)}`;
            }
            return {
                product: {
                    id: m.product.id,
                    title: m.product.title,
                    price: m.product.price,
                    platform: m.product.platform,
                    url: m.product.url,
                    imageUrl: m.product.imageUrl
                },
                reason,
                similarity: m.similarity
            };
        })
            .slice(0, 10);
        return res.json({ success: true, data: { alternatives: alts } });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to compute alternatives' });
    }
});
router.get('/:productId/bundle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const allProducts = await storage_1.default.getProducts();
        const target = allProducts.find((p) => p.id === productId);
        if (!target)
            return res.status(404).json({ success: false, message: 'Product not found' });
        const ids = extractProductIdentifiers(target.title);
        const estAccessoryValue = {
            'case': 10, 'charger': 20, 'cable': 7, 'earbuds': 20, 'headphones': 25, 'screen protector': 8,
            'protector': 8, 'mouse': 15, 'keyboard': 25, 'controller': 35, 'dock': 20, 'cover': 10, 'strap': 12,
            'adapter': 12, 'power bank': 25, 'sd card': 15, 'memory card': 15, 'stand': 12, 'tripod': 18
        };
        const targetBundleValue = (ids.accessories || []).reduce((sum, a) => sum + (estAccessoryValue[a] || 0), 0);
        const matches = findProductMatches(target, allProducts).slice(0, 20);
        const bundleComparisons = matches.map(m => {
            const mid = extractProductIdentifiers(m.product.title);
            const val = (mid.accessories || []).reduce((sum, a) => sum + (estAccessoryValue[a] || 0), 0);
            const netValue = val - (m.product.price - target.price);
            return {
                product: {
                    id: m.product.id,
                    title: m.product.title,
                    price: m.product.price,
                    platform: m.product.platform,
                    url: m.product.url,
                    imageUrl: m.product.imageUrl
                },
                accessories: mid.accessories,
                estimatedAccessoryValue: val,
                priceDifference: m.product.price - target.price,
                netValue
            };
        }).sort((a, b) => (b.netValue - a.netValue));
        return res.json({ success: true, data: { target: { id: target.id, accessories: ids.accessories, estimatedAccessoryValue: targetBundleValue }, bundles: bundleComparisons } });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to compute bundle value' });
    }
});
router.get('/:productId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID is required' });
        }
        const product = await storage_1.default.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        const user = await storage_1.default.getUserById(userId);
        const isAdmin = user?.role === 'admin';
        if (product.userId !== userId && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        return res.json({ success: true, data: product });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map