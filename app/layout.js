import './globals.css';
import Script from 'next/script';
import { LanguageProvider } from '../lib/i18n';
import { CurrencyProvider } from '../lib/currency';
import WhatsAppButton from './components/WhatsAppButton';
import ReferralCapture from './components/ReferralCapture';
import ChatWidget from './components/ChatWidget';

const GA_MEASUREMENT_ID = 'G-M4HJVG4PRW';

export const metadata = {
  metadataBase: new URL('https://kazikwako.space'),
  title: {
    default: 'Kazi — Verified job alerts, sent the moment a matching role goes live',
    template: '%s | Kazi',
  },
  description: 'Kazi is the verified job platform: every employer is checked before they can post. Sign up once and get emailed the moment a matching job goes live — free for job seekers, always.',
  keywords: ['Kazi', 'kazikwako', 'jobs in Kenya', 'verified jobs', 'job alerts', 'remote jobs Africa', 'job platform'],
  openGraph: {
    title: 'Kazi — Verified job alerts, sent the moment a matching role goes live',
    description: 'Every employer is verified before they can post. Sign up once, get emailed when a matching job goes live.',
    url: 'https://kazikwako.space',
    siteName: 'Kazi',
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kazi — Verified job alerts',
    description: 'Every employer is verified before they can post. Sign up once, get emailed when a matching job goes live.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Google Analytics — loaded after the page is interactive so it never blocks rendering */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <LanguageProvider>
          <CurrencyProvider>
            <ReferralCapture />
            {children}
            <WhatsAppButton />
            <ChatWidget />
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
