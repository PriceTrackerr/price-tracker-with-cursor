import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
};
export default function PriceDisplay({ priceUSD, selectedCurrency }) {
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
    if (loading)
        return _jsx("span", { children: "..." });
    return _jsx("span", { children: formatter.format(converted) });
}
//# sourceMappingURL=PriceDisplay.js.map