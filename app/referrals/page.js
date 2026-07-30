'use client';

import { useState } from 'react';

export default function ReferralsPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function checkStatus(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/referral-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setError(data.error || 'Something went wrong.'); return; }
      setResult(data);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError('Network error — try again.');
    }
  }

  return (
    <>
      <header className="site">
        <nav className="site">
          <a href="/#top" className="logo"><span className="mark">K</span> Kazi</a>
          <div className="nav-links">
            <a href="/jobs">Live roles</a>
          </div>
          <a href="/admin" className="btn btn-ghost">Employer login</a>
        </nav>
      </header>

      <section className="section-pad" style={{ paddingTop: 60 }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <span className="eyebrow">Refer &amp; Earn</span>
          <h2 style={{ marginTop: 14, marginBottom: 12 }}>Check your referral progress.</h2>
          <p className="sub">Enter the email you applied with to see your code and where you stand.</p>

          <form onSubmit={checkStatus} className="signup-panel" style={{ marginTop: 24 }}>
            <div className="form-grid">
              <div className="field full">
                <label>Your email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
              </div>
            </div>
            <button className="form-btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Checking…' : 'Check my progress'}
            </button>
            {error && <p className="msg err">{error}</p>}
          </form>

          {result && !result.found && (
            <div className="empty-state" style={{ marginTop: 20 }}>{result.message}</div>
          )}

          {result && result.found && (
            <div className="refer-panel" style={{ marginTop: 24 }}>
              <div className="refer-badge">Your code: {result.code}</div>
              <h4 className="refer-heading">
                {result.count} qualifying referral{result.count === 1 ? '' : 's'} so far
              </h4>
              <p className="refer-copy">
                {result.tier > 0
                  ? `You've unlocked up to $${result.tier}!`
                  : "You haven't reached the first tier yet."}
                {result.next && ` ${result.remaining} more to reach $${result.next}.`}
              </p>
              <p className="refer-fineprint">Share your link from any job you've applied to — it's the same code everywhere.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="foot-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span className="mono">© 2026 Kazi. All jobs verified, or flagged trying.</span>
            <a href="/jobs" style={{ fontSize: 13.5, fontWeight: 600 }}>← Back to live roles</a>
          </div>
        </div>
      </footer>
    </>
  );
}
