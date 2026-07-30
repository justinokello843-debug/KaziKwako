'use client';

import { useState } from 'react';

export default function ApplyForm({ job }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const form = e.target;
    const formData = new FormData(form);
    formData.set('job_id', job.id);

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage("Application received! We'll review your CV and be in touch if you're shortlisted.");
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage('Network error — check your connection and try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="apply-success">
        <div className="apply-success-icon">✓</div>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="apply-form apply-form-standalone">
      <div className="apply-grid">
        <div className="apply-field">
          <label>Full name</label>
          <input name="full_name" type="text" placeholder="Amara Njoroge" required />
        </div>
        <div className="apply-field">
          <label>Email</label>
          <input name="email" type="email" placeholder="you@email.com" required />
        </div>
        <div className="apply-field">
          <label>Phone (optional)</label>
          <input name="phone" type="tel" placeholder="+254 7XX XXX XXX" />
        </div>
        <div className="apply-field">
          <label>CV (PDF or Word, required)</label>
          <input name="cv" type="file" accept=".pdf,.doc,.docx" required />
        </div>
        <div className="apply-field apply-field-full">
          <label>A note for the employer (optional)</label>
          <textarea name="cover_note" rows={4} placeholder="Anything you'd like them to know..."></textarea>
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={status === 'loading'} style={{ marginTop: 18, width: '100%' }}>
        {status === 'loading' ? 'Submitting…' : 'Submit application'}
      </button>
      {message && <p className="msg err" style={{ color: '#C1440E' }}>{message}</p>}
    </form>
  );
}
