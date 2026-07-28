'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr' },
  sw: { label: 'Kiswahili', dir: 'ltr' },
  fr: { label: 'Français', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};

// Every visible string on the site lives here, keyed by language.
// Fall back to English automatically if a key is missing for a language.
const STRINGS = {
  nav_jobs:      { en: 'Live jobs',        sw: 'Nafasi za sasa',      fr: 'Offres en direct',     ar: 'وظائف مباشرة' },
  nav_how:       { en: 'How it works',     sw: 'Jinsi inavyofanya kazi', fr: 'Comment ça marche', ar: 'كيف يعمل' },
  nav_trust:     { en: 'Trust & safety',   sw: 'Uaminifu na usalama', fr: 'Confiance et sécurité', ar: 'الثقة والأمان' },
  nav_employers: { en: 'For employers',    sw: 'Kwa waajiri',         fr: 'Pour les employeurs',  ar: 'لأصحاب العمل' },
  nav_pricing:   { en: 'Pricing',          sw: 'Bei',                 fr: 'Tarifs',                ar: 'الأسعار' },
  nav_employer_login: { en: 'Employer login', sw: 'Ingia kama mwajiri', fr: 'Espace employeur',   ar: 'دخول أصحاب العمل' },

  eyebrow_verified: { en: 'Verified employers only', sw: 'Waajiri walioidhinishwa pekee', fr: 'Employeurs vérifiés uniquement', ar: 'أصحاب عمل موثقون فقط' },
  hero_h1_line1: { en: 'Every job here', sw: 'Kila kazi hapa', fr: 'Chaque offre ici', ar: 'كل وظيفة هنا' },
  hero_h1_em:    { en: 'stamped', sw: 'imethibitishwa', fr: 'vérifiée', ar: 'موثقة' },
  hero_h1_rest:  { en: 'real.', sw: 'kuwa halisi.', fr: '.', ar: '.' },
  hero_lede: {
    en: "Kazi checks every employer before they're allowed to post. Sign up once with the role you want, and we'll email you the moment a matching, verified job goes live.",
    sw: 'Kazi huhakiki kila mwajiri kabla ya kuruhusiwa kuchapisha. Jisajili mara moja na aina ya kazi unayotaka, tutakutumia barua pepe mara nafasi inayolingana ikitangazwa.',
    fr: "Kazi vérifie chaque employeur avant de l'autoriser à publier. Inscrivez-vous une fois avec le poste recherché, et nous vous informerons dès qu'une offre vérifiée correspond.",
    ar: 'يتحقق Kazi من كل صاحب عمل قبل السماح له بالنشر. سجّل مرة واحدة بالوظيفة التي تريدها، وسنرسل لك بريدًا إلكترونيًا بمجرد نشر وظيفة موثقة تطابق طلبك.',
  },

  stat_employers: { en: 'verified employers on the platform', sw: 'waajiri walioidhinishwa kwenye jukwaa', fr: 'employeurs vérifiés sur la plateforme', ar: 'أصحاب عمل موثقون على المنصة' },
  stat_response:  { en: 'of one-tap applications reach a real reviewer', sw: 'ya maombi ya kubofya mara moja hufika kwa mkaguzi halisi', fr: "des candidatures en un clic atteignent un vrai recruteur", ar: 'من طلبات النقرة الواحدة تصل إلى مراجع حقيقي' },
  stat_languages: { en: 'languages, including Swahili & Arabic', sw: 'lugha, ikiwemo Kiswahili na Kiarabu', fr: 'langues, dont le swahili et l\'arabe', ar: 'لغات، بما فيها السواحلية والعربية' },
  stat_signup:    { en: 'average signup to first match', sw: 'wastani wa muda kutoka usajili hadi ulinganifu wa kwanza', fr: "délai moyen entre l'inscription et la première correspondance", ar: 'متوسط الوقت من التسجيل إلى أول تطابق' },

  jobs_title: { en: 'Live roles right now', sw: 'Nafasi zilizopo sasa', fr: 'Offres actives en ce moment', ar: 'الوظائف المتاحة الآن' },
  jobs_sub:   { en: 'Anyone signed up for a matching role already got emailed about these.', sw: 'Yeyote aliyejisajili kwa nafasi inayolingana tayari ametumiwa barua pepe.', fr: 'Toute personne inscrite pour un poste correspondant a déjà été informée par e-mail.', ar: 'كل من سجّل لوظيفة مطابقة قد استلم بالفعل بريدًا إلكترونيًا بشأنها.' },
  jobs_empty: { en: "No jobs posted yet — once one goes live, it'll show up here and matching subscribers get emailed automatically.", sw: 'Hakuna kazi zilizochapishwa bado — mara moja itakapotangazwa, itaonekana hapa na waliojisajili watatumiwa barua pepe kiotomatiki.', fr: "Aucune offre publiée pour l'instant — dès qu'une offre sera en ligne, elle apparaîtra ici et les abonnés correspondants seront notifiés automatiquement.", ar: 'لا توجد وظائف منشورة بعد — بمجرد نشر واحدة، ستظهر هنا وسيتم إعلام المشتركين المطابقين تلقائيًا.' },
  jobs_apply: { en: 'Apply', sw: 'Omba', fr: 'Postuler', ar: 'تقديم' },

  pricing_eyebrow: { en: 'For employers', sw: 'Kwa waajiri', fr: 'Pour les employeurs', ar: 'لأصحاب العمل' },
  pricing_h2: { en: 'Pay for reach, not for asking.', sw: 'Lipa kwa ufikiaji, si kwa kuuliza.', fr: "Payez pour la visibilité, pas pour publier.", ar: 'ادفع مقابل الوصول، لا مقابل النشر.' },
  pricing_sub: { en: 'Posting a job is always free. You pay when you want more reach, or direct access to the candidate pool.', sw: 'Kuchapisha kazi ni bila malipo daima. Unalipa unapotaka ufikiaji zaidi, au upatikanaji wa moja kwa moja wa wagombea.', fr: "Publier une offre est toujours gratuit. Vous payez pour plus de visibilité, ou un accès direct au vivier de candidats.", ar: 'نشر وظيفة مجاني دائمًا. تدفع عندما تريد وصولاً أكبر أو وصولاً مباشرًا لقاعدة المرشحين.' },
  pricing_starter_tier: { en: 'Starter', sw: 'Mwanzo', fr: 'Débutant', ar: 'البداية' },
  pricing_starter_name: { en: 'Free', sw: 'Bure', fr: 'Gratuit', ar: 'مجاني' },
  pricing_starter_desc: { en: 'For a single hire, no strings attached.', sw: 'Kwa ajira moja, bila masharti.', fr: "Pour une seule embauche, sans engagement.", ar: 'لتوظيف واحد، بدون شروط.' },
  pricing_growth_tier: { en: 'Growth', sw: 'Ukuaji', fr: 'Croissance', ar: 'النمو' },
  pricing_growth_name: { en: 'For growing teams', sw: 'Kwa timu zinazokua', fr: 'Pour les équipes en croissance', ar: 'للفرق النامية' },
  pricing_growth_desc: { en: 'Unlimited postings and a real look at your funnel.', sw: 'Machapisho yasiyo na kikomo na mtazamo halisi wa mchakato wako.', fr: "Publications illimitées et une vraie visibilité sur votre entonnoir.", ar: 'منشورات غير محدودة ورؤية حقيقية لمسار التوظيف.' },
  pricing_ent_tier: { en: 'Enterprise', sw: 'Shirika Kubwa', fr: 'Entreprise', ar: 'المؤسسات' },
  pricing_ent_name: { en: 'Custom', sw: 'Maalum', fr: 'Sur mesure', ar: 'مخصص' },
  pricing_ent_desc: { en: 'For high-volume hiring and existing ATS setups.', sw: 'Kwa uajiri wa kiasi kikubwa na mifumo iliyopo ya ATS.', fr: "Pour un recrutement à grand volume et des systèmes ATS existants.", ar: 'للتوظيف بكميات كبيرة وأنظمة ATS الحالية.' },
  pricing_talk: { en: "Let's talk", sw: 'Wasiliana nasi', fr: 'Contactez-nous', ar: 'تواصل معنا' },
  pricing_most_common: { en: 'Most common', sw: 'Chaguo maarufu', fr: 'Le plus choisi', ar: 'الأكثر شيوعًا' },
  pricing_start_hiring: { en: 'Start hiring', sw: 'Anza kuajiri', fr: "Commencer à recruter", ar: 'ابدأ التوظيف' },
  pricing_start_growing: { en: 'Start growing', sw: 'Anza kukua', fr: 'Commencer à grandir', ar: 'ابدأ النمو' },
  pricing_talk_sales: { en: 'Talk to sales', sw: 'Zungumza na mauzo', fr: 'Contacter les ventes', ar: 'تحدث مع المبيعات' },
  pricing_feat_1: { en: '1 active job listing', sw: 'Nafasi 1 hai', fr: '1 offre active', ar: 'إعلان وظيفي نشط واحد' },
  pricing_feat_2: { en: 'Standard search placement', sw: 'Nafasi ya kawaida kwenye utafutaji', fr: 'Placement standard dans la recherche', ar: 'ترتيب قياسي في نتائج البحث' },
  pricing_feat_3: { en: 'Centralized applicant inbox', sw: 'Sanduku moja la waombaji', fr: 'Boîte de réception centralisée', ar: 'صندوق موحد للمتقدمين' },
  pricing_feat_4: { en: 'Verified employer badge', sw: 'Alama ya mwajiri aliyeidhinishwa', fr: 'Badge employeur vérifié', ar: 'شارة صاحب عمل موثّق' },
  pricing_feat_5: { en: 'Unlimited active listings', sw: 'Nafasi nyingi bila kikomo', fr: 'Offres illimitées', ar: 'إعلانات غير محدودة' },
  pricing_feat_6: { en: 'Featured placement in search', sw: 'Nafasi maalum kwenye utafutaji', fr: 'Mise en avant dans la recherche', ar: 'إبراز في نتائج البحث' },
  pricing_feat_7: { en: 'Candidate database access', sw: 'Ufikiaji wa hifadhidata ya wagombea', fr: 'Accès à la base de candidats', ar: 'الوصول إلى قاعدة بيانات المرشحين' },
  pricing_feat_8: { en: 'Full listing analytics', sw: 'Uchambuzi kamili wa nafasi', fr: "Statistiques complètes des offres", ar: 'تحليلات كاملة للإعلانات' },
  pricing_feat_9: { en: 'Employer branding page', sw: 'Ukurasa wa chapa ya mwajiri', fr: "Page de marque employeur", ar: 'صفحة العلامة التجارية لصاحب العمل' },
  pricing_feat_10: { en: 'Everything in Growth', sw: 'Kila kitu kilichomo Ukuaji', fr: 'Tout ce qui est dans Croissance', ar: 'كل ما في خطة النمو' },
  pricing_feat_11: { en: 'ATS integration & SSO', sw: 'Muunganisho wa ATS na SSO', fr: 'Intégration ATS et SSO', ar: 'تكامل ATS وتسجيل دخول موحد' },
  pricing_feat_12: { en: 'Dedicated account manager', sw: 'Msimamizi maalum wa akaunti', fr: 'Gestionnaire de compte dédié', ar: 'مدير حساب مخصص' },
  pricing_feat_13: { en: 'Optional success-fee hiring', sw: 'Malipo ya hiari ya mafanikio ya uajiri', fr: 'Frais de réussite optionnels', ar: 'رسوم نجاح اختيارية للتوظيف' },

  whatsapp_cta: { en: 'Chat on WhatsApp', sw: 'Ongea kupitia WhatsApp', fr: 'Discuter sur WhatsApp', ar: 'تواصل عبر واتساب' },

  footer_tagline: { en: 'A job platform built on one habit: verify first, list second.', sw: 'Jukwaa la kazi lililojengwa juu ya kanuni moja: hakiki kwanza, chapisha baadaye.', fr: "Une plateforme d'emploi fondée sur une habitude : vérifier d'abord, publier ensuite.", ar: 'منصة توظيف مبنية على عادة واحدة: التحقق أولاً، ثم النشر.' },
  footer_rights: { en: '© 2026 Kazi. All jobs verified, or flagged trying.', sw: '© 2026 Kazi. Kazi zote zimehakikiwa, au zimewekwa alama.', fr: "© 2026 Kazi. Toutes les offres sont vérifiées, ou signalées.", ar: '© 2026 Kazi. جميع الوظائف موثقة، أو تم الإبلاغ عنها.' },
};

export function t(key, lang) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => t(k, 'en') });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('kazi-lang');
      if (saved && LANGUAGES[saved]) { setLang(saved); return; }
      // Best-effort guess from the browser if nothing saved yet
      const browserLang = (navigator.language || 'en').slice(0, 2);
      if (LANGUAGES[browserLang]) setLang(browserLang);
    } catch (e) { /* ignore, default to English */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem('kazi-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = LANGUAGES[lang]?.dir || 'ltr';
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (k) => t(k, lang) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
