'use client';

import { useState } from 'react';

export default function SignupForm() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = e.target;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/signup', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage("You're in. We'll email you the moment a matching job goes live.");
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage('Network error — check your connection and try again.');
    }
  }

  return (
    <form className="signup-panel" onSubmit={handleSubmit}>
      <h3>Get notified about jobs like this, first</h3>
      <p className="sub">One form. No account needed yet — we'll email you the moment a matching role goes live.</p>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" type="text" placeholder="Amara Njoroge" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@email.com" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="+254 7XX XXX XXX" />
        </div>
        <div className="field">
          <label htmlFor="role_interest">Role you want alerts for</label>
          <input id="role_interest" name="role_interest" type="text" placeholder="e.g. Product Designer" required />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input id="location" name="location" type="text" placeholder="Nairobi, or Remote" />
        </div>
        <div className="field">
          <label htmlFor="experience_level">Experience level</label>
          <select id="experience_level" name="experience_level" defaultValue="">
            <option value="" disabled>Select one</option>
            <option value="Entry">Entry-level</option>
            <option value="Mid">Mid-level</option>
            <option value="Senior">Senior</option>
            <option value="Executive">Executive</option>
          </select>
        </div>
        <div className="field full">
          <label htmlFor="cv">CV (PDF or Word, optional but recommended)</label>
          <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" />
        </div>
      </div>

      <button className="form-btn" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Saving…' : 'Sign up for job alerts'}
      </button>

      {message && (
        <p className={`msg ${status === 'success' ? 'ok' : status === 'error' ? 'err' : ''}`}>{message}</p>
      )}
    </form>
  );
}
