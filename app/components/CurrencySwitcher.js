'use client';

import { CURRENCIES, useCurrency } from '../../lib/currency';

export default function CurrencySwitcher() {
  const { currency, setCurrency, detecting } = useCurrency();

  return (
    <select
      aria-label="Choose currency"
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="lang-switcher"
      title={detecting ? 'Detecting your location…' : 'Prices shown in this currency'}
    >
      {Object.entries(CURRENCIES).map(([code, meta]) => (
        <option key={code} value={code}>{code} — {meta.name}</option>
      ))}
    </select>
  );
}
