export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    lastUpdated: Date;
    source: string;
}
export interface CurrencyConversion {
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    source: string;
    timestamp: Date;
}
export declare class CurrencyService {
    private cache;
    private cacheTimeout;
    private freeAPIs;
    getExchangeRate(from: string, to: string): Promise<number>;
    private fetchRateFromAPI;
    convertCurrency(amount: number, from: string, to: string): Promise<CurrencyConversion>;
    getMultipleCurrencyRates(from: string, toCurrencies: string[]): Promise<ExchangeRate[]>;
    private getFallbackRate;
    getCurrencySymbol(currency: string): string;
    formatCurrency(amount: number, currency: string): string;
    healthCheck(): Promise<Record<string, boolean>>;
    getRateLimits(): Record<string, string>;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        entries: Array<{
            pair: string;
            age: string;
            source: string;
        }>;
    };
}
export default CurrencyService;
//# sourceMappingURL=currencyService.d.ts.map