'use client';

import SignupForm from './SignupForm';
import LanguageSwitcher from './LanguageSwitcher';
import PricingSection from './PricingSection';
import JobCard from './JobCard';
import JobSearchBar from './JobSearchBar';
import { useLanguage } from '../../lib/i18n';

export default function HomeClient({ jobs }) {
  const { t } = useLanguage();

  return (
    <>
      <header className="site">
        <nav className="site">
          <a href="#top" className="logo"><span className="mark">K</span> Kazi</a>
          <div className="nav-links">
            <a href="#jobs">{t('nav_jobs')}</a>
            <a href="#how">{t('nav_how')}</a>
            <a href="#trust">{t('nav_trust')}</a>
            <a href="#employers">{t('nav_employers')}</a>
            <a href="#pricing">{t('nav_pricing')}</a>
          </div>
          <div className="nav-utility">
            <LanguageSwitcher />
            <a href="/admin" className="btn btn-ghost">{t('nav_employer_login')}</a>
          </div>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">{t('eyebrow_verified')}</span>
            <h1 className="hero-h1">{t('hero_h1_line1')}<br /><em>{t('hero_h1_em')}</em> {t('hero_h1_rest')}</h1>
            <p className="lede">{t('hero_lede')}</p>
          </div>
          <SignupForm />
        </div>

        <div className="wrap">
          <div className="stat-strip">
            <div className="stat"><div className="num">12,400+</div><div className="lbl">{t('stat_employers')}</div></div>
            <div className="stat"><div className="num">94%</div><div className="lbl">{t('stat_response')}</div></div>
            <div className="stat"><div className="num">6</div><div className="lbl">{t('stat_languages')}</div></div>
            <div className="stat"><div className="num">&lt;2 min</div><div className="lbl">{t('stat_signup')}</div></div>
          </div>
        </div>
      </section>

      <div className="perf"></div>

      {/* LIVE JOBS — short preview only, full list lives on its own page */}
      <section id="jobs" className="section-pad jobs-section" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <h2>{t('jobs_title')}</h2>
          <p className="sub">{t('jobs_sub')}</p>

          <JobSearchBar />

          {jobs.length === 0 ? (
            <div className="empty-state">{t('jobs_empty')}</div>
          ) : (
            <>
              {jobs.slice(0, 5).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}

              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <a href="/jobs" className="btn btn-ghost">
                  {jobs.length > 5 ? `View all ${jobs.length} live roles →` : 'View all live roles →'}
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="perf"></div>

      {/* HOW IT WORKS */}
      <section id="how" className="section-pad">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The journey</span>
            <h2>From sign-up to offer letter, in four stamps.</h2>
            <p>Every stage of Kazi is designed around one rule: never make someone repeat themselves.</p>
          </div>
          <div className="journey">
            <div className="journey-step"><div className="step-num">01</div><h3>Sign up in seconds</h3><p>Phone number, Google, LinkedIn, or email — whichever you already have open.</p></div>
            <div className="journey-step"><div className="step-num">02</div><h3>Build your passport</h3><p>Upload your CV once. Everything else you can fill in later, without it blocking you from browsing.</p></div>
            <div className="journey-step"><div className="step-num">03</div><h3>Get matched, not searched</h3><p>Kazi reads your skills and history, not just your keywords, to surface roles worth your time.</p></div>
            <div className="journey-step"><div className="step-num">04</div><h3>Apply with one tap</h3><p>Your profile travels with you across every listing on the platform.</p></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The search itself</span>
            <h2>Search that respects your time.</h2>
          </div>
          <div className="feature-grid">
            <div className="feature"><h4>Filters that narrow, not just decorate</h4><p>Keyword, radius, salary band, seniority, contract type, date posted — stack as many as you like.</p></div>
            <div className="feature"><h4>Saved searches, delivered</h4><p>Save a search once. We'll email or push you the moment something new matches.</p></div>
            <div className="feature"><h4>One tap to apply</h4><p>Your saved profile fills the form. No re-typing your last job title for the fortieth time.</p></div>
            <div className="feature"><h4>Matches based on fit</h4><p>Our recommendations look at your skills and history, not just literal keyword matches.</p></div>
            <div className="feature"><h4>The number, before you apply</h4><p>Every listing shows a salary range, estimated where the employer hasn't confirmed one.</p></div>
            <div className="feature"><h4>Company pages worth reading</h4><p>Real reviews, employee-submitted pay data, and culture notes.</p></div>
          </div>
        </div>
      </section>

      <div className="perf on-p2"></div>

      {/* TRUST */}
      <section id="trust" className="section-pad" style={{ background: 'var(--parchment-2)' }}>
        <div className="wrap trust-wrap">
          <div className="stamp-gallery">
            <div className="big-stamp stamp-1">VERIFIED<br />EMPLOYER</div>
            <div className="big-stamp stamp-2">DIRECT<br />LISTING</div>
            <div className="big-stamp stamp-3">FLAGGED<br />STALE</div>
          </div>
          <div>
            <span className="eyebrow">Trust &amp; safety</span>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,36px)', color: 'var(--ink)', margin: '16px 0 24px', lineHeight: 1.1 }}>The stamp means something.</h2>
            <div className="trust-list">
              <div className="trust-item"><div className="dot"></div><div><h4>Verified before they can post</h4><p>Every employer clears a business-email check and a first-post review before a listing goes live.</p></div></div>
              <div className="trust-item"><div className="dot"></div><div><h4>Ghost jobs get called out</h4><p>Listings that sit unfilled and unedited for too long get flagged in search.</p></div></div>
              <div className="trust-item"><div className="dot"></div><div><h4>Report anything in one tap</h4><p>See something off about a listing? Flag it directly — our team reviews every report.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="perf on-p2"></div>

      {/* EMPLOYERS */}
      <section id="employers" className="section-pad">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">For employers</span>
            <h2>Post a job, reach the right people.</h2>
            <p>Every job you post here goes straight to everyone who's signed up for that kind of role.</p>
          </div>
          <div className="employer-grid">
            <div className="ef-item"><span className="ef-num">01</span><div><h4>Post in minutes</h4><p>A simple form — title, company, location, description — and it's live.</p></div></div>
            <div className="ef-item"><span className="ef-num">02</span><div><h4>Automatic alerts</h4><p>Everyone whose role interest matches gets emailed the moment you post.</p></div></div>
            <div className="ef-item"><span className="ef-num">03</span><div><h4>See it live instantly</h4><p>Your listing appears on the homepage the second it's posted.</p></div></div>
            <div className="ef-item"><span className="ef-num">04</span><div><h4>Verified badge</h4><p>Employers are reviewed before their first post goes live, so candidates trust what they see.</p></div></div>
          </div>
          <div style={{ marginTop: 32 }}>
            <a href="/admin" className="btn btn-primary">Post a job</a>
          </div>
        </div>
      </section>

      <div className="perf on-ink"></div>

      <PricingSection />

      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a href="#top" className="logo"><span className="mark">K</span> Kazi</a>
              <p>{t('footer_tagline')}</p>
            </div>
            <div className="foot-col">
              <h5>{t('nav_jobs')}</h5>
              <a href="#jobs">{t('nav_jobs')}</a>
              <a href="#trust">{t('nav_trust')}</a>
            </div>
            <div className="foot-col">
              <h5>{t('nav_employers')}</h5>
              <a href="/admin">Post a job</a>
              <a href="#pricing">{t('nav_pricing')}</a>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <a href="#trust">{t('nav_trust')}</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span className="mono">{t('footer_rights')}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
