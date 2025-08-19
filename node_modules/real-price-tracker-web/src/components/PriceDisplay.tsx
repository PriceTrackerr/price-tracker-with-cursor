import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface PriceDisplayProps {
  priceUSD: number;
  selectedCurrency: string;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export default function PriceDisplay({ priceUSD, selectedCurrency }: PriceDisplayProps) {
  const [converted, setConverted] = useState(priceUSD);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCurrency === 'USD') {
      setConverted(priceUSD);
      return;
    }
    setLoading(true);
    axios.get(`https://api.exchangerate.host/latest?base=USD&symbols=${selectedCurrency}`)
      .then(res => {
        const rate = res.data.rates[selectedCurrency];
        setConverted(priceUSD * rate);
      })
      .catch(() => setConverted(priceUSD))
      .finally(() => setLoading(false));
  }, [priceUSD, selectedCurrency]);

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: selectedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (loading) return <span>...</span>;
  return <span>{formatter.format(converted)}</span>;
} 