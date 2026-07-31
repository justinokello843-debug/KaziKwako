'use client';

import { useLanguage } from '../../lib/i18n';
import { useCurrency } from '../../lib/currency';
import CurrencySwitcher from './CurrencySwitcher';

export default function PricingSection() {
  const { t } = useLanguage();
  const { format, detecting } = useCurrency();

  return (
    <section id="pricing" className="section-pad on-ink">
      <div className="wrap">
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <span className="eyebrow">{t('pricing_eyebrow')}</span>
            <h2>{t('pricing_h2')}</h2>
            <p>{t('pricing_sub')}</p>
          </div>
          <div>
            <span className="mono" style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 6 }}>
              {detecting ? 'Detecting your currency…' : 'Prices shown in'}
            </span>
            <CurrencySwitcher />
          </div>
        </div>

        <div className="pricing-grid">
          <div className="price-card">
            <span className="price-tier">{t('pricing_starter_tier')}</span>
            <h3>{t('pricing_starter_name')}</h3>
            <div className="price-amt">{format(0)}</div>
            <p className="desc">{t('pricing_starter_desc')}</p>
            <ul className="plist">
              <li>{t('pricing_feat_1')}</li>
              <li>{t('pricing_feat_2')}</li>
              <li>{t('pricing_feat_3')}</li>
              <li>{t('pricing_feat_4')}</li>
            </ul>
            <a href="/admin" className="btn btn-ghost" style={{ width: '100%' }}>{t('pricing_start_hiring')}</a>
          </div>

          <div className="price-card featured">
            <span className="price-tag">{t('pricing_most_common')}</span>
            <span className="price-tier">{t('pricing_growth_tier')}</span>
            <h3>{t('pricing_growth_name')}</h3>
            <div className="price-amt">{format(249)}<span>/mo</span></div>
            <p className="desc">{t('pricing_growth_desc')}</p>
            <ul className="plist">
              <li>{t('pricing_feat_5')}</li>
              <li>{t('pricing_feat_6')}</li>
              <li>{t('pricing_feat_7')}</li>
              <li>{t('pricing_feat_8')}</li>
              <li>{t('pricing_feat_9')}</li>
            </ul>
            <a href="/admin" className="btn btn-gold" style={{ width: '100%' }}>{t('pricing_start_growing')}</a>
          </div>

          <div className="price-card">
            <span className="price-tier">{t('pricing_ent_tier')}</span>
            <h3>{t('pricing_ent_name')}</h3>
            <div className="price-amt" style={{ fontSize: 28 }}>{t('pricing_talk')}</div>
            <p className="desc">{t('pricing_ent_desc')}</p>
            <ul className="plist">
              <li>{t('pricing_feat_10')}</li>
              <li>{t('pricing_feat_11')}</li>
              <li>{t('pricing_feat_12')}</li>
              <li>{t('pricing_feat_13')}</li>
            </ul>
            <a
              href="/#top"
              className="btn btn-ghost" style={{ width: '100%', borderColor: 'rgba(247,243,233,0.3)', color: 'var(--parchment)' }}
            >
              {t('pricing_talk_sales')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
