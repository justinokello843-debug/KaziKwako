export const metadata = { title: 'Privacy Policy' };

function Shell({ children }) {
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
        <div className="wrap" style={{ maxWidth: 760 }}>{children}</div>
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

export default function PrivacyPage() {
  return (
    <Shell>
      <span className="eyebrow">Legal</span>
      <h1 style={{ marginTop: 14, marginBottom: 8 }}>Privacy Policy</h1>
      <p className="sub" style={{ marginBottom: 32 }}>Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--charcoal)' }}>
        <p style={{ marginBottom: 20 }}>
          Kazi ("we", "us", "our") operates kazikwako.space. This page explains what information we collect,
          why we collect it, and how it's used. By using Kazi, you agree to the practices described here.
        </p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>What we collect</h3>
        <p style={{ marginBottom: 12 }}>When you sign up for job alerts or apply to a role, we collect the information you provide directly: your name, email address, phone number (if given), the type of role you're looking for, your location, and your CV if you upload one.</p>
        <p style={{ marginBottom: 12 }}>When you use our live chat, we collect your name, email, phone number (if given), and the content of your messages.</p>
        <p style={{ marginBottom: 20 }}>We also automatically collect standard technical information — such as your general location, device type, and how you interact with the site — through analytics tools (Google Analytics and Vercel Analytics), which use cookies to do this.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>How we use it</h3>
        <p style={{ marginBottom: 12 }}>We use your information to: match you with relevant, verified job listings and email you when one becomes available; review and forward your application if you apply to a role; respond to messages sent through our chat or contact form; and understand how people use the site so we can improve it.</p>
        <p style={{ marginBottom: 20 }}>We do not sell your personal data to third parties. If you apply to a job, your name, contact details, and CV are shared with the specific employer for that role — that's the core function of the platform, and it's why you're applying.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>Cookies and advertising</h3>
        <p style={{ marginBottom: 12 }}>We use cookies for essential site function, analytics (to understand traffic and usage), and — where enabled — advertising, including Google AdSense. Google and its partners may use cookies to serve ads based on your visits to this and other websites. You can manage or opt out of personalized advertising through your <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--clay)', fontWeight: 600 }}>Google Ads Settings</a>.</p>
        <p style={{ marginBottom: 20 }}>Most browsers let you refuse or delete cookies. Doing so may affect how parts of the site work.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>How long we keep your data</h3>
        <p style={{ marginBottom: 20 }}>We keep your information for as long as your account/signup is active, or as needed to provide the service. You can request deletion of your data at any time — see "Your rights" below.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>Your rights</h3>
        <p style={{ marginBottom: 20 }}>You can ask us to access, correct, or delete the personal data we hold about you at any time. Contact us at the address on our <a href="/contact" style={{ color: 'var(--clay)', fontWeight: 600 }}>Contact page</a> and we'll action your request promptly.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>Data protection law</h3>
        <p style={{ marginBottom: 20 }}>As a platform serving users in Kenya, we handle personal data in line with the Kenya Data Protection Act (2019). If you're located elsewhere, your local data protection law may also apply.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>Changes to this policy</h3>
        <p style={{ marginBottom: 20 }}>We may update this policy from time to time. Significant changes will be reflected by updating the date at the top of this page.</p>

        <h3 style={{ margin: '28px 0 10px', color: 'var(--ink)' }}>Contact</h3>
        <p>Questions about this policy or your data? Reach us via the chat bubble on this site, or visit our <a href="/contact" style={{ color: 'var(--clay)', fontWeight: 600 }}>Contact page</a>.</p>
      </div>
    </Shell>
  );
}
