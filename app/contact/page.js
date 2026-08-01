export const metadata = { title: 'Contact' };

export default function ContactPage() {
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
          <span className="eyebrow">Get in touch</span>
          <h1 style={{ marginTop: 14, marginBottom: 20 }}>We're one tap away.</h1>

          <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--charcoal)', marginBottom: 32 }}>
            <p style={{ marginBottom: 16 }}>
              The fastest way to reach us is the chat bubble in the bottom-left corner of this page — tap it, tell us who you are, and a real person will respond by email.
            </p>
            <p>
              Applied to a role already? Mention which one and we'll pick up right where your application left off.
            </p>
          </div>

          <div className="admin-card" style={{ maxWidth: 420 }}>
            <h3 className="display" style={{ fontStyle: 'italic', fontSize: 20 }}>Prefer email?</h3>
            <p className="sub" style={{ marginBottom: 0 }}>
              Write to us at <strong style={{ color: 'var(--gold)' }}>hello@kazikwako.space</strong> and we'll get back to you as soon as we can.
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
