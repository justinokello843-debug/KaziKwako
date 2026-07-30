'use client';

import { useState } from 'react';

export default function JobCard({ job, applyLabel = 'Apply' }) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="job-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap', width: '100%' }}>
        <div>
          <h4>{job.title}</h4>
          <div className="co">{job.company}</div>
          <div className="meta">{job.location} · {job.job_type || 'Full-time'} {job.salary_range ? `· ${job.salary_range}` : ''}</div>
          <div className="desc">{job.description}</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : applyLabel}
        </button>
      </div>

      {open && status !== 'success' && (
        <form onSubmit={handleSubmit} className="apply-form">
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
              <textarea name="cover_note" rows={3} placeholder="Anything you'd like them to know..."></textarea>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={status === 'loading'} style={{ marginTop: 14 }}>
            {status === 'loading' ? 'Submitting…' : 'Submit application'}
          </button>
          {message && <p className={`msg ${status === 'error' ? 'err' : ''}`} style={{ color: status === 'error' ? '#c1440e' : undefined }}>{message}</p>}
        </form>
      )}

      {status === 'success' && (
        <p className="msg ok" style={{ color: '#1F8A70', marginTop: 14 }}>{message}</p>
      )}
    </div>
  );
}
