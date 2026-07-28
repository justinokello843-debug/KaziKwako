'use client';

import { useState } from 'react';

function BroadcastForm() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(
        data.warning
          ? data.warning
          : `Sent to ${data.sent} of ${data.total} subscriber(s).${data.failed ? ` ${data.failed} failed.` : ''}`
      );
      form.reset();
      form.passcode.value = payload.passcode;
    } catch (err) {
      setStatus('error');
      setMessage('Network error — try again.');
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: 32 }}>
      <h1 className="display" style={{ fontStyle: 'italic', fontSize: 24 }}>Send an update to subscribers</h1>
      <p className="sub">Not tied to a job posting — use this for announcements, platform news, or anything else you want to tell your list directly.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="b-passcode">Admin passcode</label>
            <input id="b-passcode" name="passcode" type="password" required />
          </div>
          <div className="field full">
            <label htmlFor="subject">Subject line</label>
            <input id="subject" name="subject" type="text" required />
          </div>
          <div className="field full">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required />
          </div>
          <div className="field">
            <label htmlFor="role_filter">Only send to role containing (optional)</label>
            <input id="role_filter" name="role_filter" type="text" placeholder="Leave blank to reach everyone" />
          </div>
          <div className="field">
            <label htmlFor="location_filter">Only send to location containing (optional)</label>
            <input id="location_filter" name="location_filter" type="text" placeholder="Leave blank to reach everyone" />
          </div>
        </div>

        <button className="btn" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send update'}
        </button>

        {message && (
          <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>
        )}
      </form>
    </div>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = e.target;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(`Job posted. ${data.notified} matching subscriber(s) emailed.`);
      form.reset();
      // keep the passcode filled in for convenience
      form.passcode.value = payload.passcode;
    } catch (err) {
      setStatus('error');
      setMessage('Network error — try again.');
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <h1 className="display" style={{ fontStyle: 'italic' }}>Post a job</h1>
        <p className="sub">Posting here saves it to the database and emails every subscriber whose role interest matches.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="passcode">Admin passcode</label>
              <input id="passcode" name="passcode" type="password" required />
            </div>
            <div className="field">
              <label htmlFor="title">Job title</label>
              <input id="title" name="title" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" type="text" required />
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" placeholder="Nairobi, or Remote" required />
            </div>
            <div className="field">
              <label htmlFor="role_category">Role category</label>
              <input id="role_category" name="role_category" type="text" placeholder="Must match how seekers describe the role" required />
            </div>
            <div className="field">
              <label htmlFor="job_type">Job type</label>
              <select id="job_type" name="job_type" defaultValue="Full-time">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Remote</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="salary_range">Salary range (optional)</label>
              <input id="salary_range" name="salary_range" type="text" placeholder="$40k–$60k" />
            </div>
            <div className="field full">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={4} required />
            </div>
            <div className="field full">
              <label htmlFor="apply_url">Apply link (optional)</label>
              <input id="apply_url" name="apply_url" type="url" placeholder="https://..." />
            </div>
          </div>

          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Posting…' : 'Post job & notify subscribers'}
          </button>

          {message && (
            <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>
          )}
        </form>
      </div>

      <BroadcastForm />
    </div>
  );
}
