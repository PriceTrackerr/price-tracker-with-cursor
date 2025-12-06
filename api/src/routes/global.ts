import express, { Request, Response } from 'express';
import axios from 'axios';
import { getDb } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { getStoreConfig } from '../config/stores';

const router = express.Router();
const db = getDb();

interface CountryData {
    country: string;
    countryCode: string;
    flag: string;
    currency: string;
    currencySymbol: string;
    localPrice: number;
    shipping: number;
    deliveryDays: string;
    vatRate: number;
    vatAmount: number;
    tariffRate: number;
    tariffAmount: number;
    total: number;
    realStoreUrl: string | null;          // NEW
    canBuyHere: boolean;                   // NEW
    storeName: string;                     // NEW
    savingsVsTracked: number;              // NEW
}

// Static shipping costs per country (USD equivalent)
const SHIPPING_COSTS: Record<string, number> = {
    US: 5,
    CA: 8,
    UK: 22,
    DE: 18,
    JP: 25,
    AU: 30
};

// Delivery time estimates (days)
const DELIVERY_ESTIMATES: Record<string, string> = {
    US: '3-5',
    CA: '5-7',
    UK: '7-10',
    DE: '7-10',
    JP: '10-14',
    AU: '10-14'
};

// Country configuration
const COUNTRIES = [
    { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
    { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
    { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', flag: '🇩🇪' },
    { code: 'CA', name: 'Canada', currency: 'CAD', symbol: '$', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', currency: 'AUD', symbol: '$', flag: '🇦🇺' }
];

// Get currency conversion rates using ExchangeRate.host
async function getCurrencyRates(): Promise<Record<string, number>> {
    try {
        const apiKey = process.env.EXCHANGERATE_API_KEY;
        const url = apiKey
            ? `http://api.exchangerate.host/live?access_key=${apiKey}&source=USD&currencies=EUR,GBP,JPY,CAD,AUD`
            : 'https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP,JPY,CAD,AUD';

        const response = await axios.get(url, { timeout: 5000 });

        if (response.data?.quotes) {
            // Paid API response format
            return {
                USD: 1,
                EUR: response.data.quotes.USDEUR,
                GBP: response.data.quotes.USDGBP,
                JPY: response.data.quotes.USDJPY,
                CAD: response.data.quotes.USDCAD,
                AUD: response.data.quotes.USDAUD
            };
        } else if (response.data?.rates) {
            // Free API response format
            return {
                USD: 1,
                EUR: response.data.rates.EUR,
                GBP: response.data.rates.GBP,
                JPY: response.data.rates.JPY,
                CAD: response.data.rates.CAD,
                AUD: response.data.rates.AUD
            };
        }
    } catch (error) {
        console.warn('ExchangeRate.host failed, using fallback rates');
    }

    // Fallback to static rates (updated periodically)
    return {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CAD: 1.36,
        AUD: 1.53
    };
}

// Get VAT rate for country using API Ninja
async function getVATRate(countryCode: string): Promise<number> {
    try {
        const apiKey = process.env.API_NINJA_KEY;
        if (apiKey) {
            const response = await axios.get(
                `https://api.api-ninjas.com/v1/vat?country=${countryCode}`,
                {
                    headers: { 'X-Api-Key': apiKey },
                    timeout: 5000
                }
            );

            if (response.data?.standard_rate) {
                return response.data.standard_rate / 100; // Convert to decimal
            }
        }
    } catch (error) {
        console.warn(`VAT API failed for ${countryCode}, using fallback`);
    }

    // Fallback VAT rates
    const fallbackVAT: Record<string, number> = {
        US: 0.07,  // Average state sales tax
        GB: 0.20,  // 20% VAT (UK uses GB code)
        UK: 0.20,
        JP: 0.10,  // 10% consumption tax
        DE: 0.19,  // 19% VAT
        CA: 0.13,  // Average GST/HST
        AU: 0.10   // 10% GST
    };

    return fallbackVAT[countryCode] || 0.1;
}

// Get tariff rate (simplified - using averages)
async function getTariffRate(countryCode: string): Promise<number> {
    const fallbackTariffs: Record<string, number> = {
        US: 0.03,  // 3% average
        GB: 0.05,  // 5% average
        UK: 0.05,
        JP: 0.04,  // 4% average
        DE: 0.04,  // 4% average (EU)
        CA: 0.06,  // 6% average
        AU: 0.05   // 5% average
    };

    return fallbackTariffs[countryCode] || 0.07;
}

// Get delivery time estimate using AfterShip (optional)
async function getDeliveryEstimate(countryCode: string): Promise<string> {
    // AfterShip integration would require carrier info and shipping method
    // For MVP, using static estimates
    return DELIVERY_ESTIMATES[countryCode] || '7-14';
}

/**
 * GET /api/global/landed-cost?productId=...
 * Calculate landed costs for multiple countries
 */
router.get('/landed-cost', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { productId } = req.query;

        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }

        // Get product from database
        const product = await db.getProductById(productId);

        if (!product || !product.price) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const usdPrice = parseFloat(product.price) || 0;
        console.log(`[GLOBAL] Calculating landed costs for product (USD $${usdPrice})`);

        // Get store configuration for URL building
        const storeConfig = getStoreConfig((product as any).storeName || 'unknown');
        const storeItemId = (product as any).storeItemId;

        // Fetch currency rates from ExchangeRate.host
        const rates = await getCurrencyRates();

        // Calculate for each country
        const countryData: CountryData[] = await Promise.all(
            COUNTRIES.map(async (country) => {
                const rate = rates[country.currency];
                const localPrice = usdPrice * rate;
                const shipping = SHIPPING_COSTS[country.code];
                const deliveryDays = await getDeliveryEstimate(country.code);
                const vatRate = await getVATRate(country.code);
                const tariffRate = await getTariffRate(country.code);

                // Calculate amounts
                const vatAmount = localPrice * vatRate;
                const tariffAmount = localPrice * tariffRate;
                const total = localPrice + shipping + vatAmount + tariffAmount;

                // Build country-specific store URL
                const canBuyHere = storeConfig?.availableCountries.includes(country.code) || false;
                const realStoreUrl = (canBuyHere && storeItemId && storeConfig)
                    ? storeConfig.buildCountryUrl(storeItemId, country.code)
                    : null;

                // Calculate savings vs tracked price
                const totalUSD = total / rate;
                const savingsVsTracked = usdPrice - totalUSD;

                return {
                    country: country.name,
                    countryCode: country.code,
                    flag: country.flag,
                    currency: country.currency,
                    currencySymbol: country.symbol,
                    localPrice: Math.round(localPrice * 100) / 100,
                    shipping,
                    deliveryDays,
                    vatRate: Math.round(vatRate * 100),
                    vatAmount: Math.round(vatAmount * 100) / 100,
                    tariffRate: Math.round(tariffRate * 100),
                    tariffAmount: Math.round(tariffAmount * 100) / 100,
                    total: Math.round(total * 100) / 100,
                    realStoreUrl,
                    canBuyHere,
                    storeName: storeConfig?.displayName || 'Unknown',
                    savingsVsTracked: Math.round(savingsVsTracked * 100) / 100
                };
            })
        );

        // Find cheapest option (convert all to USD for comparison)
        const cheapestIndex = countryData.reduce((minIdx, curr, idx, arr) => {
            const currTotalUSD = curr.total / rates[curr.currency];
            const minTotalUSD = arr[minIdx].total / rates[arr[minIdx].currency];
            return currTotalUSD < minTotalUSD ? idx : minIdx;
        }, 0);

        return res.json({
            success: true,
            data: {
                countries: countryData,
                cheapest: countryData[cheapestIndex].countryCode,
                basePrice: usdPrice,
                trackedStore: storeConfig?.displayName || 'Unknown'
            }
        });

    } catch (error: any) {
        console.error('[GLOBAL] Error calculating landed costs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to calculate landed costs',
            message: error.message
        });
    }
});

export default router;
