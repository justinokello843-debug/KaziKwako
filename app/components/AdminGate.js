'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const PasscodeContext = createContext('');
export const usePasscode = () => useContext(PasscodeContext);

/* ============================================================
   GATE — nothing below this renders until the passcode is
   verified against the server. A casual visitor to any /admin
   page sees only this screen, never the dashboard or its data.
   ============================================================ */
export default function AdminGate({ title, subtitle, children }) {
  const [passcode, setPasscode] = useState('');
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('kazi_admin_passcode');
    if (saved) verify(saved);
    else setChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(code) {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem('kazi_admin_passcode', code);
        setPasscode(code);
        setUnlocked(true);
      } else {
        sessionStorage.removeItem('kazi_admin_passcode');
        setError('Incorrect passcode.');
      }
    } catch (err) {
      setError('Network error — try again.');
    } finally {
      setChecking(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    verify(input);
  }

  function logOut() {
    sessionStorage.removeItem('kazi_admin_passcode');
    setUnlocked(false);
    setPasscode('');
    setInput('');
  }

  if (checking) {
    return (
      <div className="admin-shell">
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <p className="sub" style={{ marginBottom: 0 }}>Checking…</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <h1 className="display" style={{ fontStyle: 'italic' }}>Admin access</h1>
          <p className="sub">This dashboard is private. Enter your passcode to continue — nothing beyond this screen is visible to anyone else.</p>
          <form onSubmit={handleSubmit}>
            <div className="field full">
              <label>Passcode</label>
              <input type="password" value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
            </div>
            <button className="btn" type="submit" style={{ marginTop: 16 }} disabled={!input}>Unlock dashboard</button>
            {error && <p className="msg err">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <PasscodeContext.Provider value={passcode}>
      <div className="admin-shell" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <span className="eyebrow">Private dashboard</span>
            <h1 className="display" style={{ fontStyle: 'italic', fontSize: 32, marginTop: 8 }}>{title || 'Kazi Control Room'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/admin" className="btn btn-ghost" style={{ background: 'transparent', borderColor: 'var(--line)' }}>← Dashboard</a>
            <button type="button" onClick={logOut} className="btn btn-ghost" style={{ background: 'transparent', borderColor: 'var(--line)' }}>
              Lock dashboard
            </button>
          </div>
        </div>
        {subtitle && <p className="sub" style={{ marginBottom: 8 }}>{subtitle}</p>}
        {children}
      </div>
    </PasscodeContext.Provider>
  );
}
