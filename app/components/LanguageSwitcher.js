'use client';

import { LANGUAGES, useLanguage } from '../../lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <select
      aria-label="Choose language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="lang-switcher"
    >
      {Object.entries(LANGUAGES).map(([code, meta]) => (
        <option key={code} value={code}>{meta.label}</option>
      ))}
    </select>
  );
}
