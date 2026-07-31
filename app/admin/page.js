'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const PasscodeContext = createContext('');
const usePasscode = () => useContext(PasscodeContext);

/* ============================================================
   GATE — nothing below this renders until the passcode is
   verified against the server. A casual visitor to /admin sees
   only this screen, never the dashboard, the data, or the tools.
   ============================================================ */
function PasscodeGate({ children }) {
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
            <h1 className="display" style={{ fontStyle: 'italic', fontSize: 32, marginTop: 8 }}>Kazi Control Room</h1>
          </div>
          <button type="button" onClick={logOut} className="btn btn-ghost" style={{ background: 'transparent', borderColor: 'var(--line)' }}>
            Lock dashboard
          </button>
        </div>
        <p className="sub" style={{ marginBottom: 8 }}>
          Everyone who signed up, everyone who applied, and every job you've posted — all in one place.
          Looking for site traffic (visits, where people came from)? That lives in Google Analytics, not here.
        </p>
        {children}
      </div>
    </PasscodeContext.Provider>
  );
}

/* ============================================================
   POST A JOB
   ============================================================ */
function JobPostForm() {
  const passcode = usePasscode();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const form = e.target;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), passcode };

    try {
      const res = await fetch('/api/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Something went wrong.'); return; }
      setStatus('success');
      setMessage(`Job posted. ${data.notified} matching subscriber(s) emailed.`);
      form.reset();
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Post a job</h2>
      <p className="sub">Saves it live and emails every subscriber whose role interest matches.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field"><label>Job title</label><input name="title" type="text" required /></div>
          <div className="field"><label>Company</label><input name="company" type="text" required /></div>
          <div className="field"><label>Location</label><input name="location" type="text" placeholder="Nairobi, or Remote" required /></div>
          <div className="field"><label>Role category</label><input name="role_category" type="text" placeholder="How seekers describe the role" required /></div>
          <div className="field">
            <label>Job type</label>
            <select name="job_type" defaultValue="Full-time">
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option>
            </select>
          </div>
          <div className="field"><label>Salary range (optional)</label><input name="salary_range" type="text" placeholder="$40k–$60k" /></div>
          <div className="field full"><label>Description</label><textarea name="description" rows={4} required /></div>
          <div className="field full"><label>Apply link (optional)</label><input name="apply_url" type="url" placeholder="https://..." /></div>
        </div>
        <button className="btn" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Posting…' : 'Post job & notify subscribers'}
        </button>
        {message && <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>}
      </form>
    </div>
  );
}

/* ============================================================
   APPLICATIONS — the core client-tracking view
   ============================================================ */
function ApplicationsViewer() {
  const passcode = usePasscode();
  const [filter, setFilter] = useState('all');
  const [applications, setApplications] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [decidingId, setDecidingId] = useState(null);
  const [decisionNote, setDecisionNote] = useState({});

  async function loadApplications() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/applications-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, status: filter }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Could not load applications.'); return; }
      setApplications(data.applications);
      setStatus('idle');
      if (data.applications.length === 0) setMessage('No applications yet for this filter.');
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  useEffect(() => { loadApplications(); /* eslint-disable-next-line */ }, []);

  async function updateStatus(applicationId, newStatus) {
    try {
      await fetch('/api/update-application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, application_id: applicationId, status: newStatus }),
      });
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a)));
    } catch (err) {}
  }

  async function decide(applicationId, decision) {
    setDecidingId(applicationId);
    setDecisionNote((prev) => ({ ...prev, [applicationId]: '' }));
    try {
      const res = await fetch('/api/decide-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, application_id: applicationId, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionNote((prev) => ({ ...prev, [applicationId]: data.error || 'Something went wrong.' }));
        return;
      }
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: data.status } : a)));
      setDecisionNote((prev) => ({
        ...prev,
        [applicationId]: data.emailed ? `✓ Candidate emailed (${decision === 'shortlist' ? 'shortlisted' : 'rejected'}).` : (data.warning || 'Status updated.'),
      }));
    } catch (err) {
      setDecisionNote((prev) => ({ ...prev, [applicationId]: 'Network error — try again.' }));
    } finally {
      setDecidingId(null);
    }
  }

  const statusColors = {
    shortlisted: { bg: 'rgba(31,138,112,.18)', text: '#7fe0c4' },
    rejected: { bg: 'rgba(193,68,14,.18)', text: '#ff9b7a' },
    forwarded: { bg: 'rgba(232,163,61,.18)', text: '#E8A33D' },
    reviewed: { bg: 'rgba(247,243,233,.14)', text: 'rgba(247,243,233,.85)' },
    new: { bg: 'rgba(247,243,233,.1)', text: 'rgba(247,243,233,.7)' },
  };

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Applications — every client who applied</h2>
      <p className="sub">Name, contact details, CV, what they applied for, and when. Shortlist or reject with one click — either one emails them instantly. Changed your mind after forwarding someone? Just click the other button — it overwrites the previous decision and sends a new, honest update instead of leaving them with false hope.</p>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field full">
          <label>Filter by status</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All applications</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="forwarded">Forwarded to employer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <button type="button" className="btn" onClick={loadApplications} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Refresh'}
      </button>

      {message && <p className={`msg ${status === 'error' ? 'err' : ''}`}>{message}</p>}

      {applications && applications.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {applications.map((a) => {
            const c = statusColors[a.status] || statusColors.new;
            return (
              <div key={a.id} style={{ background: 'rgba(247,243,233,.06)', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, padding: '14px 16px', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <strong>{a.full_name}</strong>
                  <span className="mono" style={{ fontSize: 10, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100, background: c.bg, color: c.text }}>
                    {a.status}
                  </span>
                </div>
                <div style={{ opacity: 0.85 }}>{a.email}{a.phone ? ` · ${a.phone}` : ''}</div>
                <div style={{ opacity: 0.6, marginTop: 2 }}>Applied for: {a.jobs?.title} — {a.jobs?.company}</div>
                {a.cover_note && <div style={{ opacity: 0.7, marginTop: 6, fontStyle: 'italic' }}>"{a.cover_note}"</div>}
                {a.cv_url && (
                  <div style={{ marginTop: 8 }}>
                    <a href={a.cv_url} target="_blank" rel="noreferrer" style={{ color: '#E8A33D', fontWeight: 700, fontSize: 12 }}>View CV →</a>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => decide(a.id, 'shortlist')}
                    disabled={decidingId === a.id || a.status === 'shortlisted'}
                    style={{ background: '#1F8A70', color: '#fff', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: a.status === 'shortlisted' ? 0.5 : 1 }}
                  >
                    {decidingId === a.id ? 'Sending…' : '✓ Shortlist & notify'}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(a.id, 'reject')}
                    disabled={decidingId === a.id || a.status === 'rejected'}
                    style={{ background: 'transparent', color: '#ff9b7a', border: '1px solid rgba(255,155,122,.4)', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: a.status === 'rejected' ? 0.5 : 1 }}
                  >
                    {decidingId === a.id ? 'Sending…' : a.status === 'shortlisted' ? 'Switch to rejected & notify' : 'Reject & notify'}
                  </button>
                  <select
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value)}
                    style={{ background: 'rgba(247,243,233,.1)', color: '#F7F3E9', border: '1px solid rgba(247,243,233,.2)', borderRadius: 6, fontSize: 11, padding: '4px 8px', marginLeft: 'auto' }}
                    title="Manual status change — does not send an email"
                  >
                    <option value="new">Mark: New</option>
                    <option value="reviewed">Mark: Reviewed</option>
                    <option value="forwarded">Mark: Forwarded to employer</option>
                  </select>
                </div>
                {decisionNote[a.id] && (
                  <div className="mono" style={{ fontSize: 11, marginTop: 8, color: decisionNote[a.id].startsWith('✓') ? '#7fe0c4' : '#ff9b7a' }}>
                    {decisionNote[a.id]}
                  </div>
                )}
                <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 8 }}>Applied {new Date(a.created_at).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUBSCRIBERS — everyone who signed up for alerts (not applied)
   ============================================================ */
function SubscribersViewer() {
  const passcode = usePasscode();
  const [subscribers, setSubscribers] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function load() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/subscribers-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Could not load signups.'); return; }
      setSubscribers(data.subscribers);
      setStatus('idle');
      if (data.subscribers.length === 0) setMessage('No signups yet.');
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Signups — everyone waiting for alerts</h2>
      <p className="sub">People who signed up for job alerts but haven't necessarily applied to anything yet.</p>

      <button type="button" className="btn" onClick={load} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Refresh'}
      </button>
      {message && <p className={`msg ${status === 'error' ? 'err' : ''}`}>{message}</p>}

      {subscribers && subscribers.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subscribers.map((s) => (
            <div key={s.id} style={{ background: 'rgba(247,243,233,.06)', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
              <strong>{s.full_name}</strong>
              <div style={{ opacity: 0.85, marginTop: 2 }}>{s.email}{s.phone ? ` · ${s.phone}` : ''}</div>
              <div style={{ opacity: 0.6, marginTop: 2 }}>
                Wants: {s.role_interest}{s.location ? ` · ${s.location}` : ''}{s.experience_level ? ` · ${s.experience_level}` : ''}
              </div>
              {s.cv_url && (
                <a href={s.cv_url} target="_blank" rel="noreferrer" style={{ color: '#E8A33D', fontWeight: 700, fontSize: 12, display: 'inline-block', marginTop: 6 }}>View CV →</a>
              )}
              <div className="mono" style={{ fontSize: 10, opacity: 0.5, marginTop: 6 }}>Signed up {new Date(s.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BROADCAST
   ============================================================ */
function BroadcastForm() {
  const passcode = usePasscode();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const form = e.target;
    const payload = { ...Object.fromEntries(new FormData(form).entries()), passcode };

    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Something went wrong.'); return; }
      setStatus('success');
      setMessage(data.warning ? data.warning : `Sent to ${data.sent} of ${data.total} subscriber(s).${data.failed ? ` ${data.failed} failed.` : ''}`);
      form.reset();
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Send an update to subscribers</h2>
      <p className="sub">Announcements or platform news — not tied to a specific job posting.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full"><label>Subject line</label><input name="subject" type="text" required /></div>
          <div className="field full"><label>Message</label><textarea name="message" rows={5} required /></div>
          <div className="field"><label>Only send to role containing (optional)</label><input name="role_filter" type="text" placeholder="Leave blank to reach everyone" /></div>
          <div className="field"><label>Only send to location containing (optional)</label><input name="location_filter" type="text" placeholder="Leave blank to reach everyone" /></div>
        </div>
        <button className="btn" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Sending…' : 'Send update'}</button>
        {message && <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>}
      </form>
    </div>
  );
}

/* ============================================================
   SHORTLIST TOOL (subscriber-based, separate from applications)
   ============================================================ */
function ShortlistTool() {
  const passcode = usePasscode();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  useEffect(() => { loadJobs(); /* eslint-disable-next-line */ }, []);

  async function loadJobs() {
    try {
      const res = await fetch('/api/jobs-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok) setJobs(data.jobs);
    } catch (err) {}
  }

  async function loadCandidates(jobId) {
    setSelectedJobId(jobId);
    setCandidates([]);
    setSelectedIds(new Set());
    if (!jobId) return;
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/shortlist-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || 'Could not load candidates.'); return; }
      setCandidates(data.candidates);
      setMessage(data.candidates.length === 0 ? 'No matching subscribers found for this job yet.' : '');
    } catch (err) {
      setMessage('Network error loading candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  }

  function toggleCandidate(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function sendShortlist() {
    if (selectedIds.size === 0) { setMessage('Select at least one candidate first.'); return; }
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, job_id: selectedJobId, subscriber_ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Something went wrong.'); return; }
      setStatus('success');
      setMessage(`Shortlist notice sent to ${data.sent} of ${data.total} selected candidate(s).${data.failed ? ` ${data.failed} failed.` : ''}`);
      setSelectedIds(new Set());
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Shortlist subscribers directly</h2>
      <p className="sub">For notifying alert subscribers who haven't formally applied — pick a job, review who matches, choose exactly who gets notified.</p>

      {jobs.length > 0 && (
        <div className="field full" style={{ marginBottom: 16 }}>
          <label>Choose a job</label>
          <select value={selectedJobId} onChange={(e) => loadCandidates(e.target.value)}>
            <option value="">Select a job...</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.company} ({j.location})</option>)}
          </select>
        </div>
      )}

      {loadingCandidates && <p className="sub">Loading candidates…</p>}

      {candidates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(247,243,233,.55)', marginBottom: 8 }}>
            Eligible candidates ({candidates.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {candidates.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(247,243,233,.06)', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, padding: '10px 12px', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleCandidate(c.id)} />
                <span>{c.full_name} — {c.email} <span style={{ opacity: 0.6 }}>({c.role_interest}{c.location ? `, ${c.location}` : ''})</span></span>
              </label>
            ))}
          </div>
        </div>
      )}

      {candidates.length > 0 && (
        <button type="button" className="btn" onClick={sendShortlist} disabled={status === 'loading' || selectedIds.size === 0}>
          {status === 'loading' ? 'Sending…' : `Shortlist selected (${selectedIds.size})`}
        </button>
      )}
      {message && <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>}
    </div>
  );
}

/* ============================================================
   MESSAGE LOG
   ============================================================ */
function MessageLogViewer() {
  const passcode = usePasscode();
  const [filter, setFilter] = useState('all');
  const [entries, setEntries] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function loadLog() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, message_type: filter }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Could not load the log.'); return; }
      setEntries(data.entries);
      setStatus('idle');
      if (data.entries.length === 0) setMessage('No messages logged yet for this filter.');
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  useEffect(() => { loadLog(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Message log</h2>
      <p className="sub">Every automated email the platform has ever sent, in one place.</p>

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field full">
          <label>Filter by type</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All messages</option>
            <option value="welcome">Welcome emails</option>
            <option value="job_alert">Job match alerts</option>
            <option value="broadcast">Broadcasts</option>
            <option value="application">Application confirmations</option>
            <option value="shortlist">Shortlist notices</option>
            <option value="rejection">Rejection notices</option>
            <option value="chat_alert">Chat alerts (to you)</option>
            <option value="chat_reply">Chat replies (to clients)</option>
          </select>
        </div>
      </div>

      <button type="button" className="btn" onClick={loadLog} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Refresh'}
      </button>
      {message && <p className={`msg ${status === 'error' ? 'err' : ''}`}>{message}</p>}

      {entries && entries.length > 0 && (
        <div style={{ marginTop: 20, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => (
            <div key={e.id} style={{ background: 'rgba(247,243,233,.06)', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="mono" style={{ color: e.status === 'sent' ? '#7fe0c4' : '#ff9b7a', fontSize: 10, textTransform: 'uppercase' }}>
                  {e.message_type} · {e.status}
                </span>
                <span className="mono" style={{ fontSize: 10, opacity: 0.5 }}>{new Date(e.sent_at).toLocaleString()}</span>
              </div>
              <div style={{ opacity: 0.9 }}>{e.recipient_email}</div>
              {e.subject && <div style={{ opacity: 0.6, marginTop: 2 }}>{e.subject}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LIVE CHAT INBOX
   ============================================================ */
function ChatInboxViewer() {
  const passcode = usePasscode();
  const [threads, setThreads] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('idle');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  async function loadThreads() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/chat/threads-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus('error'); setMessage(data.error || 'Could not load conversations.'); return; }
      setThreads(data.threads);
      setStatus('idle');
      if (data.threads.length === 0) setMessage('No conversations yet.');
    } catch (err) {
      setStatus('error'); setMessage('Network error — try again.');
    }
  }

  useEffect(() => { loadThreads(); /* eslint-disable-next-line */ }, []);

  async function openThread(threadId) {
    try {
      const res = await fetch('/api/chat/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, thread_id: threadId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setSelected(data.thread);
      setMessages(data.messages);
      loadThreads(); // refresh unread counts in the list
    } catch (err) {}
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, thread_id: selected.id, message: reply.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'admin', message: reply.trim(), created_at: new Date().toISOString() }]);
        setReply('');
        if (!data.emailed) setMessage('Reply saved, but the email to the client failed to send.');
      }
    } catch (err) {
      setMessage('Network error sending reply.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2 className="display" style={{ fontStyle: 'italic', fontSize: 22 }}>Live chat inbox</h2>
      <p className="sub">Every conversation started from the chat bubble on your site. Replying here emails the client instantly.</p>

      <button type="button" className="btn" onClick={loadThreads} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Refresh'}
      </button>
      {message && <p className="msg err">{message}</p>}

      <div className={`chat-inbox-grid ${selected ? 'has-selection' : ''}`} style={{ marginTop: 20 }}>
        {threads && threads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openThread(t.id)}
                style={{
                  textAlign: 'left', background: selected?.id === t.id ? 'rgba(232,163,61,.15)' : 'rgba(247,243,233,.06)',
                  border: `1px solid ${selected?.id === t.id ? 'var(--gold)' : 'rgba(247,243,233,.15)'}`,
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer', color: 'inherit', fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{t.visitor_name}</strong>
                  {t.unread_count > 0 && (
                    <span style={{ background: '#C1440E', color: '#fff', borderRadius: 100, fontSize: 10, padding: '2px 7px', fontWeight: 700 }}>
                      {t.unread_count}
                    </span>
                  )}
                </div>
                <div style={{ opacity: 0.6, fontSize: 11.5, marginTop: 2 }}>{t.visitor_email}</div>
                {t.last_message && (
                  <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.last_message.sender === 'admin' ? 'You: ' : ''}{t.last_message.message}
                  </div>
                )}
                <div className="mono" style={{ fontSize: 10, opacity: 0.45, marginTop: 6 }}>{new Date(t.last_message_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(247,243,233,.15)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(247,243,233,.06)', fontSize: 12.5 }}>
              <strong>{selected.visitor_name}</strong> · {selected.visitor_email}{selected.visitor_phone ? ` · ${selected.visitor_phone}` : ''}
            </div>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'admin' ? 'var(--gold)' : 'rgba(247,243,233,.1)',
                    color: m.sender === 'admin' ? 'var(--ink)' : 'var(--parchment)',
                    padding: '9px 13px', borderRadius: 12, fontSize: 13, maxWidth: '80%',
                  }}
                >
                  {m.message}
                </div>
              ))}
            </div>
            <form onSubmit={sendReply} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(247,243,233,.12)' }}>
              <input
                type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…"
                style={{ flex: 1, background: 'rgba(247,243,233,.08)', border: '1px solid rgba(247,243,233,.18)', borderRadius: 100, padding: '9px 14px', color: 'var(--parchment)', fontSize: 13 }}
              />
              <button type="submit" className="btn" style={{ marginTop: 0, padding: '9px 18px' }} disabled={sending || !reply.trim()}>
                {sending ? '…' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PasscodeGate>
      <ChatInboxViewer />
      <ApplicationsViewer />
      <SubscribersViewer />
      <JobPostForm />
      <BroadcastForm />
      <ShortlistTool />
      <MessageLogViewer />
    </PasscodeGate>
  );
}
