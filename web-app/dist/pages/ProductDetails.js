import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductPriceHistory } from './Products';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import PriceDisplay from '../components/PriceDisplay';
import AdvancedAnalysis from '../components/AdvancedAnalysis';
import { getSupabaseClient } from '../lib/supabaseClient';
export default function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { getAuthHeaders, token } = useAuth();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const selectedCurrency = user?.preferences?.currency || 'USD';
    const selectedLanguage = user?.preferences?.language || 'en';
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertPrice, setAlertPrice] = useState('');
    const [alertEmail, setAlertEmail] = useState('');
    const [creatingAlert, setCreatingAlert] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [alternatives, setAlternatives] = useState([]);
    const [bundles, setBundles] = useState([]);
    useEffect(() => {
        async function fetchProduct() {
            if (!productId)
                return;
            setLoading(true);
            try {
                // Try API first
                if (token) {
                    try {
                        const res = await fetch(`/api/products/${productId}`, {
                            headers: getAuthHeaders(),
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success && data.data) {
                                setProduct(data.data);
                                setLoading(false);
                                return;
                            }
                        }
                    }
                    catch (apiError) {
                        console.warn('API fetch failed, trying Supabase:', apiError);
                    }
                }
                // Fallback to Supabase
                try {
                    const supabase = getSupabaseClient();
                    const { data: productData, error: supabaseError } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single();
                    if (supabaseError) {
                        throw supabaseError;
                    }
                    if (productData) {
                        setProduct({
                            id: productData.id,
                            title: productData.title,
                            price: productData.price || 0,
                            currency: productData.currency || 'USD',
                            platform: productData.platform || 'unknown',
                            imageUrl: productData.image_url || '',
                            url: productData.url || '',
                            createdAt: productData.created_at || new Date().toISOString(),
                            totalMatches: productData.total_matches || 0,
                            hasPriceDrop: false,
                            priceDrop: 0,
                            priceDropPercent: 0,
                            previousPrice: productData.price || 0
                        });
                    }
                    else {
                        throw new Error('Product not found');
                    }
                }
                catch (supabaseError) {
                    console.error('Supabase fetch failed:', supabaseError);
                    throw supabaseError;
                }
            }
            catch (error) {
                console.error('Error fetching product:', error);
                toast.error(error?.message || 'Failed to load product details');
            }
            finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [productId, token, getAuthHeaders]);
    useEffect(() => {
        if (!productId || !token)
            return;
        // Fetch prediction, alternatives, and bundle info
        (async () => {
            try {
                const [predRes, altRes, bunRes] = await Promise.allSettled([
                    fetch(`/api/products/${productId}/predict`, { headers: getAuthHeaders() }),
                    fetch(`/api/products/${productId}/alternatives`, { headers: getAuthHeaders() }),
                    fetch(`/api/products/${productId}/bundle`, { headers: getAuthHeaders() }),
                ]);
                // Handle prediction response
                if (predRes.status === 'fulfilled' && predRes.value.ok) {
                    const pred = await predRes.value.json().catch(() => null);
                    if (pred && pred.success && pred.data) {
                        setPrediction({ recommendation: pred.data.recommendation, confidence: pred.data.confidence });
                    }
                }
                // Handle alternatives response
                if (altRes.status === 'fulfilled' && altRes.value.ok) {
                    const alts = await altRes.value.json().catch(() => null);
                    if (alts && alts.success && alts.data?.alternatives) {
                        setAlternatives(alts.data.alternatives.map((a) => ({
                            id: a.product?.id || '',
                            title: a.product?.title || '',
                            price: typeof a.product?.price === 'number' && !isNaN(a.product.price) ? a.product.price : 0,
                            platform: a.product?.platform || '',
                            url: a.product?.url || ''
                        })));
                    }
                }
                // Handle bundles response
                if (bunRes.status === 'fulfilled' && bunRes.value.ok) {
                    const buns = await bunRes.value.json().catch(() => null);
                    if (buns && buns.success && buns.data?.bundles) {
                        setBundles(buns.data.bundles.map((b) => ({
                            id: b.product?.id || '',
                            title: b.product?.title || '',
                            price: typeof b.product?.price === 'number' && !isNaN(b.product.price) ? b.product.price : 0,
                            platform: b.product?.platform || '',
                            url: b.product?.url || '',
                            estimatedAccessoryValue: typeof b.estimatedAccessoryValue === 'number' && !isNaN(b.estimatedAccessoryValue) ? b.estimatedAccessoryValue : 0,
                            priceDifference: typeof b.priceDifference === 'number' && !isNaN(b.priceDifference) ? b.priceDifference : 0,
                            netValue: typeof b.netValue === 'number' && !isNaN(b.netValue) ? b.netValue : 0
                        })));
                    }
                }
            }
            catch (error) {
                console.error('Error fetching additional product data:', error);
            }
        })();
    }, [productId, token, getAuthHeaders]);
    useEffect(() => {
        if (i18n.language !== selectedLanguage) {
            i18n.changeLanguage(selectedLanguage);
        }
    }, [selectedLanguage, i18n]);
    const handleCreateAlert = async () => {
        if (!alertPrice || !product) {
            toast.error('Please enter a target price');
            return;
        }
        setCreatingAlert(true);
        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    productId: product.id,
                    targetPrice: parseFloat(alertPrice),
                    email: alertEmail || user?.email,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Price alert created successfully!');
                setAlertPrice('');
                setAlertEmail('');
            }
            else {
                toast.error(data.message || 'Failed to create alert');
            }
        }
        catch (error) {
            console.error('Error creating alert:', error);
            toast.error('Failed to create alert');
        }
        finally {
            setCreatingAlert(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "max-w-2xl mx-auto p-6", children: _jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading product details..." })] }) }) }));
    }
    if (!product) {
        return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Product Not Found" }), _jsx("p", { className: "text-gray-600 mb-6", children: "The product you're looking for could not be found." }), _jsx("button", { onClick: () => navigate(-1), className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Go Back" })] }));
    }
    // Create a safe product object with fallbacks
    const safeProduct = {
        id: product.id,
        title: product.title,
        price: product.price || 0,
        currency: product.currency || '$',
        platform: product.platform || 'Unknown',
        imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
        url: product.url,
        createdAt: product.createdAt || new Date().toISOString(),
        totalMatches: product.totalMatches || 0,
        hasPriceDrop: product.hasPriceDrop || false,
        priceDrop: product.priceDrop || 0,
        priceDropPercent: product.priceDropPercent || 0,
        previousPrice: product.previousPrice || product.price
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6 bg-white rounded-lg shadow relative", children: [_jsxs("button", { className: "mb-4 text-blue-600 hover:underline", onClick: () => navigate(-1), children: ["\u2190 ", t('back')] }), _jsxs("div", { className: "flex items-center space-x-6 mb-6", children: [safeProduct.imageUrl && (_jsx("img", { src: safeProduct.imageUrl, alt: safeProduct.title, className: "h-24 w-24 rounded-lg object-cover" })), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: safeProduct.title }), _jsx("p", { className: "text-gray-600 mb-1", children: safeProduct.platform }), _jsx("p", { className: "text-lg font-semibold", children: _jsx(PriceDisplay, { priceUSD: safeProduct.price, selectedCurrency: selectedCurrency }) }), safeProduct.hasPriceDrop && safeProduct.priceDrop && (_jsxs("div", { className: "mt-2 p-2 bg-green-50 rounded-lg", children: [_jsxs("p", { className: "text-sm text-green-800", children: ["\uD83D\uDCB0 Price dropped by $", (safeProduct.priceDrop || 0).toFixed(2), " (", safeProduct.priceDropPercent || 0, "%)"] }), _jsxs("p", { className: "text-xs text-green-600", children: ["Previous: $", ((safeProduct.previousPrice || 0)).toFixed(2)] })] })), safeProduct.totalMatches && safeProduct.totalMatches > 0 && (_jsx("div", { className: "mt-2 p-2 bg-blue-50 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-800", children: ["\uD83D\uDD0D Found ", safeProduct.totalMatches, " matching product", safeProduct.totalMatches !== 1 ? 's' : '', " on other platforms"] }) })), _jsx("a", { href: safeProduct.url, target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 hover:underline text-sm", children: t('viewOnSite') })] })] }), _jsx("div", { className: "mb-6", children: _jsx(ProductPriceHistory, { productId: safeProduct.id }) }), _jsx(AdvancedAnalysis, { product: safeProduct }), prediction && (_jsxs("div", { className: "mb-6 p-4 rounded border bg-gray-50", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Recommendation" }), _jsxs("p", { className: "text-sm", children: ["We suggest: ", _jsx("span", { className: prediction.recommendation === 'wait' ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold', children: prediction.recommendation.toUpperCase() }), " (confidence: ", Math.round(prediction.confidence * 100), "%)"] })] })), alternatives.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Smart Alternatives" }), _jsx("div", { className: "space-y-2", children: alternatives.filter(alt => alt != null).map((alt) => {
                            const safePrice = typeof alt?.price === 'number' && !isNaN(alt.price) ? alt.price : 0;
                            return (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: alt?.title || 'Unknown' }), _jsx("p", { className: "text-xs text-gray-600", children: alt?.platform || 'Unknown' })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-semibold text-sm", children: ["$", safePrice.toFixed(2)] }), _jsx("a", { href: alt.url, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-blue-600 hover:underline", children: "View" })] })] }, alt?.id || Math.random()));
                        }) })] })), bundles.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Bundle Recommendations" }), _jsx("div", { className: "space-y-3", children: bundles.filter(bundle => bundle != null).map((bundle) => {
                            const safePrice = typeof bundle?.price === 'number' && !isNaN(bundle.price) ? bundle.price : 0;
                            const safeAccessoryValue = typeof bundle?.estimatedAccessoryValue === 'number' && !isNaN(bundle.estimatedAccessoryValue) ? bundle.estimatedAccessoryValue : 0;
                            const safeNetValue = typeof bundle?.netValue === 'number' && !isNaN(bundle.netValue) ? bundle.netValue : 0;
                            return (_jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-medium", children: bundle?.title || 'Unknown' }), _jsx("span", { className: "text-sm text-blue-600", children: bundle?.platform || 'Unknown' })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Price" }), _jsxs("p", { className: "font-semibold", children: ["$", safePrice.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Accessory Value" }), _jsxs("p", { className: "font-semibold", children: ["$", safeAccessoryValue.toFixed(2)] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-600", children: "Net Value" }), _jsxs("p", { className: "font-semibold text-green-600", children: ["$", safeNetValue.toFixed(2)] })] })] }), _jsx("a", { href: bundle?.url || '#', target: "_blank", rel: "noopener noreferrer", className: "inline-block mt-2 text-sm text-blue-600 hover:underline", children: "View Bundle \u2192" })] }, bundle?.id || Math.random()));
                        }) })] })), _jsxs("div", { className: "border-t pt-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Set Price Alert" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Target Price (USD)" }), _jsx("input", { type: "number", step: "0.01", value: alertPrice, onChange: (e) => setAlertPrice(e.target.value), placeholder: `${((safeProduct.price || 0) * 0.9).toFixed(2)}`, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email (optional)" }), _jsx("input", { type: "email", value: alertEmail, onChange: (e) => setAlertEmail(e.target.value), placeholder: user?.email || 'your@email.com', className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { onClick: handleCreateAlert, disabled: creatingAlert || !alertPrice, className: "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: creatingAlert ? 'Creating Alert...' : 'Create Price Alert' })] })] })] }));
}
//# sourceMappingURL=ProductDetails.js.map