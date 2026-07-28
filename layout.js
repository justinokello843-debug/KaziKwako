import './globals.css';
import Script from 'next/script';
import { LanguageProvider } from '../lib/i18n';
import { CurrencyProvider } from '../lib/currency';
import WhatsAppButton from './components/WhatsAppButton';

const GA_MEASUREMENT_ID = 'G-GXHSMCCXDE';

export const metadata = {
  title: 'Kazi — Get notified the moment a matching job goes live',
  description: 'Sign up once. Get emailed when a verified job matching your role goes live.',
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
            {children}
            <WhatsAppButton />
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
