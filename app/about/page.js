export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <header className="site">
        <nav className="site">
          <a href="/#top" className="logo"><span className="mark">K</span> Kazi</a>
          <div className="nav-links">
            <a href="/jobs">Live roles</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>
          <a href="/admin" className="btn btn-ghost">Employer login</a>
        </nav>
      </header>

      <section className="section-pad" style={{ paddingTop: 56 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow">About Kazi</span>
          <h1 style={{ marginTop: 14, marginBottom: 20 }}>Every job here has been stamped real.</h1>

          <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--charcoal)' }}>
            <p style={{ marginBottom: 20 }}>
              Kazi is a job platform built on one rule: no employer gets to post here until we've verified
              they're real. A checked business email, a manual review, before their first listing ever goes live.
            </p>
            <p style={{ marginBottom: 20 }}>
              For job seekers, that means every alert you get is worth your time — not a stale listing, not a
              scam, not a lead-generation trap. Sign up once with the role you want, and we'll email you the
              moment a matching, verified job goes live.
            </p>
            <p style={{ marginBottom: 20 }}>
              For employers, it means reaching people who trust what they're looking at, the moment you post —
              free to start, with tools to scale as you hire more.
            </p>
            <p style={{ marginBottom: 20 }}>
              We screen every application that comes through Kazi before it reaches an employer — CVs reviewed,
              candidates shortlisted, the strongest matches forwarded. That's the actual work: doing the filtering
              so companies don't have to, and giving job seekers a real shot instead of a black hole.
            </p>
            <p>
              Built for how people actually apply — phone in hand, one tap at a time.
            </p>
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="foot-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span className="mono">© 2026 Kazi. All jobs verified, or flagged trying.</span>
            <a href="/#top" style={{ fontSize: 13.5, fontWeight: 600 }}>← Back to homepage</a>
          </div>
        </div>
      </footer>
    </>
  );
}
