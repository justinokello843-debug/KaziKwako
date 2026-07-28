'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// A curated set of currencies people can pick manually if auto-detection
// guesses wrong (VPNs, corporate networks, etc. can throw IP geolocation off).
export const CURRENCIES = {
  USD: { symbol: '$',   name: 'US Dollar',        locale: 'en-US' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling',  locale: 'en-KE' },
  NGN: { symbol: '₦',   name: 'Nigerian Naira',   locale: 'en-NG' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi',    locale: 'en-GH' },
  ZAR: { symbol: 'R',   name: 'South African Rand', locale: 'en-ZA' },
  EGP: { symbol: 'E£',  name: 'Egyptian Pound',   locale: 'ar-EG' },
  GBP: { symbol: '£',   name: 'British Pound',    locale: 'en-GB' },
  EUR: { symbol: '€',   name: 'Euro',             locale: 'en-IE' },
  INR: { symbol: '₹',   name: 'Indian Rupee',     locale: 'en-IN' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham',       locale: 'ar-AE' },
};

const FALLBACK_RATES = {
  // Approximate USD conversion rates, used only if the live rate lookup fails.
  // These are updated in code occasionally — the live fetch is what's actually used normally.
  USD: 1, KES: 129, NGN: 1550, GHS: 15, ZAR: 18, EGP: 49, GBP: 0.79, EUR: 0.92, INR: 84, AED: 3.67,
};

const CurrencyContext = createContext({
  currency: 'USD',
  setCurrency: () => {},
  rates: FALLBACK_RATES,
  detecting: true,
  format: (usd) => `$${usd}`,
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [detecting, setDetecting] = useState(true);
  const [userOverrode, setUserOverrode] = useState(false);

  // 1. Restore a manual choice if the person already picked one before
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('kazi-currency');
      if (saved && CURRENCIES[saved]) {
        setCurrency(saved);
        setUserOverrode(true);
      }
    } catch (e) { /* ignore */ }
  }, []);

  // 2. Auto-detect country/currency from IP, unless the person already chose manually
  useEffect(() => {
    if (userOverrode) { setDetecting(false); return; }
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        const code = data?.currency?.code;
        if (!cancelled && code && CURRENCIES[code]) {
          setCurrency(code);
        }
      } catch (e) {
        console.warn('Currency auto-detection failed, defaulting to USD.', e);
      } finally {
        if (!cancelled) setDetecting(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userOverrode]);

  // 3. Fetch live exchange rates (USD base) once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (!cancelled && data?.rates) {
          setRates((prev) => ({ ...prev, ...data.rates }));
        }
      } catch (e) {
        console.warn('Live exchange rates unavailable, using fallback rates.', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function chooseCurrency(code) {
    setCurrency(code);
    setUserOverrode(true);
    try { window.localStorage.setItem('kazi-currency', code); } catch (e) {}
  }

  function format(usdAmount) {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    const converted = usdAmount * rate;
    const meta = CURRENCIES[currency] || CURRENCIES.USD;
    try {
      return new Intl.NumberFormat(meta.locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: converted >= 1000 ? 0 : 2,
      }).format(converted);
    } catch (e) {
      return `${meta.symbol}${Math.round(converted).toLocaleString()}`;
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: chooseCurrency, rates, detecting, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
