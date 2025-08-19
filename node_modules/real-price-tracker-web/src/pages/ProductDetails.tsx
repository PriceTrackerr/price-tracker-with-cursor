import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductPriceHistory } from './Products';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import PriceDisplay from '../components/PriceDisplay';
import AdvancedAnalysis from '../components/AdvancedAnalysis';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  platform: 'amazon' | 'aliexpress';
  imageUrl?: string;
  url: string;
  createdAt: string;
}

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const selectedCurrency = user?.preferences?.currency || 'USD';
  const selectedLanguage = user?.preferences?.language || 'en';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [prediction, setPrediction] = useState<{ recommendation: 'buy'|'wait'; confidence: number } | null>(null);
  const [alternatives, setAlternatives] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string }>>([]);
  const [bundles, setBundles] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string; estimatedAccessoryValue: number; priceDifference: number; netValue: number }>>([]);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    // Fetch prediction, alternatives, and bundle info
    (async () => {
      try {
        const [predRes, altRes, bunRes] = await Promise.all([
          fetch(`/api/products/${productId}/predict`, { headers: getAuthHeaders() }),
          fetch(`/api/products/${productId}/alternatives`, { headers: getAuthHeaders() }),
          fetch(`/api/products/${productId}/bundle`, { headers: getAuthHeaders() }),
        ]);
        const pred = await predRes.json().catch(() => null);
        const alts = await altRes.json().catch(() => null);
        const buns = await bunRes.json().catch(() => null);
        if (pred && pred.success && pred.data) {
          setPrediction({ recommendation: pred.data.recommendation, confidence: pred.data.confidence });
        }
        if (alts && alts.success && alts.data?.alternatives) {
          setAlternatives(alts.data.alternatives.map((a: any) => ({ id: a.product.id, title: a.product.title, price: a.product.price, platform: a.product.platform, url: a.product.url })));
        }
        if (buns && buns.success && buns.data?.bundles) {
          setBundles(buns.data.bundles.map((b: any) => ({ id: b.product.id, title: b.product.title, price: b.product.price, platform: b.product.platform, url: b.product.url, estimatedAccessoryValue: b.estimatedAccessoryValue, priceDifference: b.priceDifference, netValue: b.netValue })));
        }
      } catch {}
    })();
  }, [productId]);

  useEffect(() => {
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  const handleCreateAlert = async () => {
    if (!alertPrice) {
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
          productId: product?.id,
          targetPrice: parseFloat(alertPrice),
          email: alertEmail || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alert created!');
        setAlertPrice('');
        setAlertEmail('');
      } else {
        toast.error(data.message || 'Failed to create alert');
      }
    } catch (e) {
      toast.error('Failed to create alert');
    }
    setCreatingAlert(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow relative">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← {t('back')}
      </button>
      <div className="flex items-center space-x-6 mb-6">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="h-24 w-24 rounded-lg object-cover" />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>
          <p className="text-gray-600 mb-1">{product.platform}</p>
          <p className="text-lg font-semibold">
            <PriceDisplay priceUSD={product.price} selectedCurrency={selectedCurrency} />
          </p>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">{t('viewOnSite')}</a>
        </div>
      </div>
      <div className="mb-6">
        <ProductPriceHistory productId={product.id} />
      </div>

      {/* Advanced Features Analysis */}
      <AdvancedAnalysis product={product} />

      {/* Price Recommendation */}
      {prediction && (
        <div className="mb-6 p-4 rounded border bg-gray-50">
          <h3 className="font-semibold mb-2">Recommendation</h3>
          <p className="text-sm">We suggest: <span className={prediction.recommendation === 'wait' ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>{prediction.recommendation.toUpperCase()}</span> (confidence: {Math.round(prediction.confidence * 100)}%)</p>
        </div>
      )}

      {/* Smart Alternatives */}
      {alternatives.length > 0 && (
        <div className="mb-6 p-4 rounded border bg-white">
          <h3 className="font-semibold mb-3">Smart Alternatives</h3>
          <ul className="space-y-2">
            {alternatives.slice(0,5).map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{a.title}</div>
                  <div className="text-gray-500">{a.platform}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold">${a.price.toFixed(2)}</div>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bundle Value */}
      {bundles.length > 0 && (
        <div className="mb-6 p-4 rounded border bg-white">
          <h3 className="font-semibold mb-3">Bundle Value Analysis</h3>
          <ul className="space-y-2">
            {bundles.slice(0,5).map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{b.title}</div>
                  <div className="text-gray-500">Net value vs target: <span className={b.netValue > 0 ? 'text-green-600' : 'text-gray-600'}>${b.netValue.toFixed(2)}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold">${b.price.toFixed(2)}</div>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">{t('setPriceDropAlert')}</h3>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="number"
            min="0"
            step="0.01"
            className="border rounded px-2 py-1 w-32"
            placeholder={t('targetPrice')}
            value={alertPrice}
            onChange={e => setAlertPrice(e.target.value)}
          />
          <input
            type="email"
            className="border rounded px-2 py-1 w-56"
            placeholder={t('emailOptional')}
            value={alertEmail}
            onChange={e => setAlertEmail(e.target.value)}
          />
          <button
            className="btn-modern"
            onClick={handleCreateAlert}
            disabled={creatingAlert}
          >
            {creatingAlert ? t('creating') : t('createAlert')}
          </button>
        </div>
      </div>
      <div className="absolute left-6 bottom-6">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 rounded-lg font-semibold text-white"
          style={{ background: '#3e58c9e5', boxShadow: '0 2px 8px rgba(62,88,201,0.08)' }}
        >
          Buy Now
        </a>
      </div>
    </div>
  );
} 