"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const axios_1 = __importDefault(require("axios"));
class CurrencyService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000;
        this.freeAPIs = [
            {
                name: 'ExchangeRate-API',
                baseUrl: 'https://api.exchangerate-api.com/v4/latest/',
                limit: '1500 requests/month',
                getRateUrl: (from) => `https://api.exchangerate-api.com/v4/latest/${from}`,
                parseResponse: (data, to) => data.rates[to]
            },
            {
                name: 'Fixer.io',
                baseUrl: 'http://data.fixer.io/api/latest',
                limit: '100 requests/month',
                getRateUrl: (from) => `http://data.fixer.io/api/latest?access_key=${process.env.FIXER_API_KEY}&base=${from}`,
                parseResponse: (data, to) => data.rates[to]
            },
            {
                name: 'CurrencyLayer',
                baseUrl: 'http://api.currencylayer.com/live',
                limit: '1000 requests/month',
                getRateUrl: (from) => `http://api.currencylayer.com/live?access_key=${process.env.CURRENCYLAYER_API_KEY}&source=${from}`,
                parseResponse: (data, to, from) => data.quotes[`${from}${to}`]
            }
        ];
    }
    async getExchangeRate(from, to) {
        if (from === to)
            return 1;
        const cacheKey = `${from}-${to}`;
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.rate;
        }
        for (const api of this.freeAPIs) {
            try {
                const rate = await this.fetchRateFromAPI(api, from, to);
                if (rate && rate > 0) {
                    this.cache.set(cacheKey, {
                        rate,
                        timestamp: Date.now(),
                        source: api.name
                    });
                    return rate;
                }
            }
            catch (error) {
                console.log(`Failed to get rate from ${api.name}:`, error.message);
                continue;
            }
        }
        try {
            const reverseRate = await this.getExchangeRate(to, from);
            if (reverseRate > 0) {
                const rate = 1 / reverseRate;
                this.cache.set(cacheKey, {
                    rate,
                    timestamp: Date.now(),
                    source: 'Reverse calculation'
                });
                return rate;
            }
        }
        catch (error) {
        }
        const fallbackRate = this.getFallbackRate(from, to);
        if (fallbackRate > 0) {
            console.warn(`Using fallback rate for ${from}-${to}: ${fallbackRate}`);
            return fallbackRate;
        }
        throw new Error(`Unable to get exchange rate for ${from} to ${to}`);
    }
    async fetchRateFromAPI(api, from, to) {
        const url = api.getRateUrl(from);
        const response = await axios_1.default.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'PriceTracker/1.0'
            }
        });
        if (!response.data || response.data.error) {
            throw new Error(`API returned error: ${response.data?.error || 'Unknown error'}`);
        }
        const rate = api.parseResponse(response.data, to, from);
        if (!rate || rate <= 0) {
            throw new Error(`Invalid rate returned: ${rate}`);
        }
        return rate;
    }
    async convertCurrency(amount, from, to) {
        const rate = await this.getExchangeRate(from, to);
        const convertedAmount = amount * rate;
        const cached = this.cache.get(`${from}-${to}`);
        return {
            originalAmount: amount,
            originalCurrency: from,
            convertedAmount: Math.round(convertedAmount * 100) / 100,
            convertedCurrency: to,
            exchangeRate: rate,
            source: cached?.source || 'Unknown',
            timestamp: new Date()
        };
    }
    async getMultipleCurrencyRates(from, toCurrencies) {
        const rates = [];
        const results = await Promise.allSettled(toCurrencies.map(async (to) => {
            const rate = await this.getExchangeRate(from, to);
            const cached = this.cache.get(`${from}-${to}`);
            return {
                from,
                to,
                rate,
                lastUpdated: new Date(),
                source: cached?.source || 'Unknown'
            };
        }));
        for (const result of results) {
            if (result.status === 'fulfilled') {
                rates.push(result.value);
            }
        }
        return rates;
    }
    getFallbackRate(from, to) {
        const fallbackRates = {
            'USD': {
                'EUR': 0.85,
                'GBP': 0.73,
                'JPY': 110,
                'CAD': 1.25,
                'AUD': 1.35,
                'CNY': 6.4
            },
            'EUR': {
                'USD': 1.18,
                'GBP': 0.86,
                'JPY': 130,
                'CAD': 1.47,
                'AUD': 1.59
            },
            'GBP': {
                'USD': 1.37,
                'EUR': 1.16,
                'JPY': 151,
                'CAD': 1.71,
                'AUD': 1.85
            },
            'JPY': {
                'USD': 0.0091,
                'EUR': 0.0077,
                'GBP': 0.0066,
                'CAD': 0.011,
                'AUD': 0.012
            }
        };
        return fallbackRates[from]?.[to] || 0;
    }
    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CNY': '¥',
            'CHF': 'Fr',
            'SEK': 'kr',
            'NOK': 'kr'
        };
        return symbols[currency] || currency;
    }
    formatCurrency(amount, currency) {
        const symbol = this.getCurrencySymbol(currency);
        if (currency === 'JPY') {
            return `${symbol}${Math.round(amount).toLocaleString()}`;
        }
        return `${symbol}${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
    async healthCheck() {
        const health = {};
        for (const api of this.freeAPIs) {
            try {
                await this.fetchRateFromAPI(api, 'USD', 'EUR');
                health[api.name] = true;
            }
            catch (error) {
                health[api.name] = false;
            }
        }
        return health;
    }
    getRateLimits() {
        const limits = {};
        for (const api of this.freeAPIs) {
            limits[api.name] = api.limit;
        }
        return limits;
    }
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        const entries = Array.from(this.cache.entries()).map(([pair, data]) => ({
            pair,
            age: `${Math.round((Date.now() - data.timestamp) / 1000 / 60)} minutes ago`,
            source: data.source
        }));
        return {
            size: this.cache.size,
            entries
        };
    }
}
exports.CurrencyService = CurrencyService;
exports.default = CurrencyService;
//# sourceMappingURL=currencyService.js.map