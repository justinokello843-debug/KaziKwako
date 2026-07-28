'use client';

import { useLanguage } from '../../lib/i18n';

// 0780228067 in Kenyan local format -> +254780228067 in international format for wa.me links
const WHATSAPP_NUMBER = '254780228067';

export default function WhatsAppButton() {
  const { t } = useLanguage();
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Kazi, I have a question about the platform.')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label={t('whatsapp_cta')}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.86 9.86 0 004.62 1.17h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.61-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.08.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.14.44.21.5.32.06.12.06.66-.18 1.34z"
          fill="currentColor"
        />
      </svg>
      <span>{t('whatsapp_cta')}</span>
    </a>
  );
}
